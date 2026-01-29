import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SeatService } from './seat.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/seat',
})
export class SeatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SeatGateway.name);

  // 心跳检测相关
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map(); // socketId -> interval
  private readonly HEARTBEAT_INTERVAL = 10000; // 10秒检测一次

  constructor(private readonly seatService: SeatService) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // 停止心跳检测
    this.stopHeartbeat(client.id);

    // 释放座位
    const releasedSeat = await this.seatService.releaseSeatBySocketId(client.id);

    // 从排队队列中移除
    await this.seatService.leaveQueue(client.id);

    // 如果释放了座位，处理队列中等待的用户
    if (releasedSeat) {
      this.logger.log(`Seat ${releasedSeat.seatNumber} released by ${client.id}, processing queue...`);
      await this.notifyMerchantSeatChange();
      await this.processQueue();
    } else {
      // 如果没有释放座位（用户可能只是在排队），只广播状态
      await this.notifyMerchantSeatChange();
    }
  }

  @SubscribeMessage('requestSeat')
  async handleRequestSeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { nickname?: string },
  ) {
    try {
      // 检查是否有可用座位
      const availableSeats = await this.seatService.findAvailableSeats();

      if (availableSeats.length > 0) {
        // 随机分配一个座位
        const randomIndex = Math.floor(Math.random() * availableSeats.length);
        const seat = availableSeats[randomIndex];

        // 占用座位
        const occupiedSeat = await this.seatService.occupySeat(
          seat._id.toString(),
          client.id,
          data?.nickname,
        );

        // 通知用户座位已分配
        client.emit('seatAssigned', {
          seatNumber: occupiedSeat.seatNumber,
          seatId: occupiedSeat._id.toString(),
        });

        this.logger.log(
          `Seat ${occupiedSeat.seatNumber} assigned to ${client.id}`,
        );

        // 启动心跳检测
        this.startHeartbeat(client.id);

        // 广播座位状态更新
        await this.notifyMerchantSeatChange();
      } else {
        // 添加到排队队列
        const position = await this.seatService.joinQueue(
          client.id,
          data?.nickname,
          1,
        );

        // 通知用户需要排队
        client.emit('needQueue', {
          position,
          queueLength: await this.seatService.getQueueLength(),
        });

        this.logger.log(
          `Client ${client.id} added to queue at position ${position}`,
        );

        // 广播队列状态
        await this.notifyMerchantSeatChange();
      }
    } catch (error) {
      this.logger.error(`Error handling seat request: ${error.message}`);
      client.emit('error', { message: '座位分配失败，请重试' });
    }
  }

  @SubscribeMessage('leaveSeat')
  async handleLeaveSeat(@ConnectedSocket() client: Socket) {
    try {
      // 停止心跳检测
      this.stopHeartbeat(client.id);

      await this.seatService.releaseSeatBySocketId(client.id);
      client.emit('seatReleased', { message: '座位已释放' });

      this.logger.log(`Seat released by ${client.id}`);

      // 广播座位状态更新
      await this.notifyMerchantSeatChange();

      // 检查队列中是否有等待的用户
      await this.processQueue();
    } catch (error) {
      this.logger.error(`Error releasing seat: ${error.message}`);
      client.emit('error', { message: '释放座位失败' });
    }
  }

  @SubscribeMessage('getQueueStatus')
  async handleGetQueueStatus(@ConnectedSocket() client: Socket) {
    const position = await this.seatService.getQueuePosition(client.id);

    if (position === -1) {
      client.emit('queueStatus', { inQueue: false });
    } else {
      client.emit('queueStatus', {
        inQueue: true,
        position,
        queueLength: await this.seatService.getQueueLength(),
      });
    }
  }

  // 商家端请求清理离线用户
  @SubscribeMessage('cleanupOfflineUsers')
  async handleCleanupOfflineUsers(@ConnectedSocket() client: Socket) {
    this.logger.log(`Merchant ${client.id} requested cleanup of offline users`);
    await this.cleanupOfflineUsers();
    // 清理完成后返回最新状态
    await this.handleGetMerchantSeatStatus(client);
  }

  // 处理队列，为等待的用户分配座位
  private async processQueue() {
    const queueLength = await this.seatService.getQueueLength();
    
    if (queueLength === 0) {
      return;
    }

    const availableSeats = await this.seatService.findAvailableSeats();

    while (availableSeats.length > 0 && (await this.seatService.getQueueLength()) > 0) {
      const nextUser = await this.seatService.callNext();
      const seat = availableSeats.shift();

      if (!nextUser || !seat) {
        break;
      }

      try {
        // 占用座位
        const occupiedSeat = await this.seatService.occupySeat(
          seat._id.toString(),
          nextUser.socketId,
          nextUser.nickname,
        );

        // 通知用户座位已分配
        this.server.to(nextUser.socketId).emit('seatAssigned', {
          seatNumber: occupiedSeat.seatNumber,
          seatId: occupiedSeat._id.toString(),
        });

        // 也发送 called 事件
        this.server.to(nextUser.socketId).emit('called', {
          message: `已为您分配座位：${occupiedSeat.seatNumber}号`,
        });

        this.logger.log(
          `Seat ${occupiedSeat.seatNumber} assigned to queued user ${nextUser.socketId}`,
        );

        // 启动心跳检测
        this.startHeartbeat(nextUser.socketId);
      } catch (error) {
        this.logger.error(
          `Error assigning seat to queued user: ${error.message}`,
        );
        // 如果分配失败，将用户重新加入队列头部
        if (nextUser) {
          await this.seatService.joinQueue(
            nextUser.socketId,
            nextUser.nickname,
            nextUser.partySize,
          );
        }
        break;
      }
    }

    // 广播更新后的状态
    await this.notifyMerchantSeatChange();
    
    // 更新队列中每个用户的位置
    await this.updateQueuePositions();
  }

  // 更新队列中所有用户的排队位置
  private async updateQueuePositions() {
    const queueList = await this.seatService.getQueueList();
    
    queueList.forEach((user, index) => {
      this.server.to(user.socketId).emit('queueUpdate', {
        position: index + 1,
        queueLength: queueList.length,
      });
    });
  }

  // ==================== 心跳检测方法 ====================

  /**
   * 启动心跳检测
   * 每隔10秒检测用户是否在线，如果不在线则释放座位
   */
  private startHeartbeat(socketId: string) {
    // 检查 server 是否已初始化
    if (!this.server?.sockets?.sockets) {
      this.logger.warn(`Cannot start heartbeat for ${socketId}: server not ready`);
      return;
    }

    // 如果已存在，先停止
    this.stopHeartbeat(socketId);

    // 创建心跳定时器
    const interval = setInterval(async () => {
      // 再次检查 server 是否可用（防止运行时 server 被销毁）
      if (!this.server?.sockets?.sockets) {
        this.logger.warn('Server no longer available, stopping heartbeat');
        this.stopHeartbeat(socketId);
        return;
      }

      // 检查用户是否还在线（socket是否还连接）
      const socket = this.server.sockets.sockets.get(socketId);
      
      if (!socket || !socket.connected) {
        this.logger.warn(
          `Client ${socketId} is offline, releasing seat...`,
        );

        // 停止心跳检测
        this.stopHeartbeat(socketId);

        // 释放座位
        const releasedSeat = await this.seatService.releaseSeatBySocketId(socketId);

        if (releasedSeat) {
          this.logger.log(
            `Seat ${releasedSeat.seatNumber} released due to user offline`,
          );

          // 广播座位状态更新
          await this.notifyMerchantSeatChange();

          // 处理队列中等待的用户
          await this.processQueue();
        }
      } else {
        this.logger.debug(`Client ${socketId} is still online`);
      }
    }, this.HEARTBEAT_INTERVAL);

    // 保存定时器引用
    this.heartbeatIntervals.set(socketId, interval);

    this.logger.log(`Heartbeat started for ${socketId}`);
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(socketId: string) {
    const interval = this.heartbeatIntervals.get(socketId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(socketId);
      this.logger.log(`Heartbeat stopped for ${socketId}`);
    }
  }

  /**
   * 清理所有离线用户的座位
   * 商家端打开页面时调用
   */
  private async cleanupOfflineUsers() {
    this.logger.log('Starting cleanup of offline users...');
    
    // 检查 server 是否已初始化
    if (!this.server?.sockets?.sockets) {
      this.logger.warn('Server not fully initialized, skipping cleanup');
      return;
    }
    
    // 获取所有占用座位的用户
    const allSeats = await this.seatService.findAll();
    let cleanedCount = 0;

    for (const seat of allSeats) {
      const occupiedInfo = await this.seatService.getSeatOccupiedInfo(seat._id.toString());
      
      if (occupiedInfo) {
        const socketId = occupiedInfo.socketId;
        const socket = this.server.sockets.sockets.get(socketId);
        
        // 如果用户不在线，释放座位
        if (!socket || !socket.connected) {
          this.logger.log(`Cleaning up offline user ${socketId} from seat ${seat.seatNumber}`);
          
          await this.seatService.releaseSeat(seat._id.toString());
          this.stopHeartbeat(socketId);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} offline users`);
      
      // 广播座位状态更新
      await this.notifyMerchantSeatChange();
      
      // 处理队列中等待的用户
      await this.processQueue();
    } else {
      this.logger.log('No offline users found');
    }
  }

  // 商家端：获取所有座位状态
  @SubscribeMessage('getMerchantSeatStatus')
  async handleGetMerchantSeatStatus(@ConnectedSocket() client: Socket) {
    try {
      const seats = await this.seatService.findAllWithStatus();
      const statistics = await this.seatService.getStatistics();
      const queueList = await this.seatService.getQueueList();

      client.emit('merchantSeatStatus', {
        seats,
        statistics,
        queueList,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Error getting merchant seat status: ${error.message}`,
      );
      client.emit('error', { message: '获取座位状态失败' });
    }
  }

  // 座位状态变更时，通知所有商家端
  async notifyMerchantSeatChange() {
    try {
      const seats = await this.seatService.findAllWithStatus();
      const statistics = await this.seatService.getStatistics();
      const queueList = await this.seatService.getQueueList();

      this.server.emit('merchantSeatUpdate', {
        seats,
        statistics,
        queueList,
        timestamp: new Date().toISOString(),
      });

      // 同时广播统计信息给所有客户端
      this.server.emit('seatStatus', statistics);
      this.server.emit('queueStatus', {
        queueLength: statistics.queueLength,
      });
    } catch (error) {
      this.logger.error(`Error notifying merchant seat change: ${error.message}`);
    }
  }
}
