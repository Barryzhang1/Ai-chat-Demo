import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * 订单 WebSocket Gateway
 * 负责订单相关的实时通知
 * 使用独立的 /order namespace，与座位管理(/seat)和聊天分离
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/order',
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrderGateway.name);

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`订单客户端连接: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`订单客户端断开: ${client.id}`);
  }

  /**
   * 广播订单更新通知（订单创建或状态更改）
   * @param event 事件类型：'created' | 'statusChanged'
   * @param order 订单数据
   */
  notifyOrderUpdate(event: 'created' | 'statusChanged', order: any) {
    this.logger.log(`广播订单更新: ${event}, 订单ID: ${order.orderId || order._id}`);
    
    this.server.emit('orderUpdated', {
      event,
      order,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 通知特定用户的订单更新
   * @param userId 用户ID
   * @param event 事件类型
   * @param order 订单数据
   */
  notifyUserOrderUpdate(userId: string, event: 'created' | 'statusChanged', order: any) {
    this.logger.log(`通知用户 ${userId} 订单更新: ${event}`);
    
    // 向所有连接的客户端广播（前端根据 userId 过滤）
    this.server.emit('userOrderUpdated', {
      userId,
      event,
      order,
      timestamp: new Date().toISOString(),
    });
  }
}
