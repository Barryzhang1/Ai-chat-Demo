import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seat, SeatDocument, SeatStatus } from './schemas/seat.schema';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { RedisService } from '../../redis/redis.service';

// Redis Key 常量
const SEAT_STATUS_OCCUPIED_PREFIX = 'seat:status:occupied:';
const QUEUE_KEY = 'seat:queue';
const QUEUE_INFO_PREFIX = 'seat:queue:info:';

// 座位占用信息接口
export interface SeatOccupiedInfo {
  socketId: string;
  nickname?: string;
  occupiedAt: string;
}

// 排队信息接口
export interface QueueInfo {
  socketId: string;
  nickname?: string;
  queuedAt: string;
  partySize: number;
}

@Injectable()
export class SeatService {
  constructor(
    @InjectModel(Seat.name) private seatModel: Model<SeatDocument>,
    private readonly redisService: RedisService,
  ) {}

  async create(createSeatDto: CreateSeatDto): Promise<Seat> {
    try {
      // 检查座位号是否已存在（包括软删除的座位）
      const existingSeat = await this.seatModel.findOne({ 
        seatNumber: createSeatDto.seatNumber
      });
      
      if (existingSeat) {
        if (!existingSeat.isActive) {
          // 如果座位已被软删除，恢复它
          existingSeat.isActive = true;
          existingSeat.status = createSeatDto.status || SeatStatus.AVAILABLE;
          existingSeat.occupiedBy = undefined;
          existingSeat.occupiedByName = undefined;
          existingSeat.occupiedAt = undefined;
          return await existingSeat.save();
        } else {
          // 座位号已存在且处于活跃状态
          throw new ConflictException(`座位号 ${createSeatDto.seatNumber} 已存在`);
        }
      }

      // 创建新座位
      const createdSeat = new this.seatModel(createSeatDto);
      return await createdSeat.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      // 处理 MongoDB 重复键错误
      if (error.code === 11000) {
        throw new ConflictException(`座位号 ${createSeatDto.seatNumber} 已存在`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Seat[]> {
    return this.seatModel
      .find({ isActive: true })
      .sort({ seatNumber: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Seat> {
    const seat = await this.seatModel.findById(id).exec();
    if (!seat || !seat.isActive) {
      throw new NotFoundException(`座位 ID ${id} 未找到`);
    }
    return seat;
  }

  async findAvailableSeats(): Promise<Seat[]> {
    // 从 MongoDB 获取所有活跃座位
    const allSeats = await this.findAll();
    const availableSeats = [];

    // 遍历检查 Redis 中的占用状态
    for (const seat of allSeats) {
      const occupiedInfo = await this.redisService.get(
        `${SEAT_STATUS_OCCUPIED_PREFIX}${seat._id}`,
      );

      // 没有占用信息 = 可用座位
      if (!occupiedInfo) {
        availableSeats.push(seat);
      }
    }

    return availableSeats;
  }

  async update(id: string, updateSeatDto: UpdateSeatDto): Promise<Seat> {
    const updatedSeat = await this.seatModel
      .findByIdAndUpdate(id, updateSeatDto, { new: true })
      .exec();
    
    if (!updatedSeat || !updatedSeat.isActive) {
      throw new NotFoundException(`座位 ID ${id} 未找到`);
    }
    return updatedSeat;
  }

  async updateStatus(id: string, status: SeatStatus): Promise<Seat> {
    return this.update(id, { status });
  }

  async occupySeat(id: string, socketId: string, nickname?: string): Promise<Seat> {
    // 1. 查询座位基本信息（MongoDB）
    const seat = await this.seatModel.findById(id).exec();
    
    if (!seat || !seat.isActive) {
      throw new NotFoundException(`座位 ID ${id} 未找到`);
    }
    
    // 2. 检查 Redis 中是否已被占用
    const existingInfo = await this.redisService.get(
      `${SEAT_STATUS_OCCUPIED_PREFIX}${id}`,
    );
    
    if (existingInfo) {
      throw new ConflictException('座位不可用');
    }

    // 3. 在 Redis 中设置占用信息
    const occupiedInfo: SeatOccupiedInfo = {
      socketId,
      nickname,
      occupiedAt: new Date().toISOString(),
    };
    
    await this.redisService.set(
      `${SEAT_STATUS_OCCUPIED_PREFIX}${id}`,
      JSON.stringify(occupiedInfo),
    );
    
    return seat;
  }

  async releaseSeat(id: string): Promise<Seat> {
    // 1. 查询座位基本信息（MongoDB）
    const seat = await this.seatModel.findById(id).exec();
    
    if (!seat || !seat.isActive) {
      throw new NotFoundException(`座位 ID ${id} 未找到`);
    }
    
    // 2. 从 Redis 删除占用信息
    await this.redisService.del(`${SEAT_STATUS_OCCUPIED_PREFIX}${id}`);
    
    return seat;
  }

  async releaseSeatBySocketId(socketId: string): Promise<Seat | null> {
    // 1. 遍历所有座位，查找被该 socketId 占用的座位
    const allSeats = await this.findAll();
    
    for (const seat of allSeats) {
      const occupiedInfoStr = await this.redisService.get(
        `${SEAT_STATUS_OCCUPIED_PREFIX}${seat._id}`,
      );
      
      if (occupiedInfoStr) {
        const occupiedInfo: SeatOccupiedInfo = JSON.parse(occupiedInfoStr);
        
        if (occupiedInfo.socketId === socketId) {
          // 2. 从 Redis 删除占用信息
          await this.redisService.del(`${SEAT_STATUS_OCCUPIED_PREFIX}${seat._id}`);
          return seat;
        }
      }
    }
    
    return null;
  }

  async remove(id: string): Promise<Seat> {
    // 软删除
    const deletedSeat = await this.seatModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
    
    if (!deletedSeat) {
      throw new NotFoundException(`座位 ID ${id} 未找到`);
    }
    return deletedSeat;
  }

  async getStatistics() {
    const seats = await this.findAll();
    const availableSeats = await this.findAvailableSeats();
    const queueLength = await this.getQueueLength();
    
    return {
      total: seats.length,
      available: availableSeats.length,
      occupied: seats.length - availableSeats.length,
      closed: 0, // 当前版本未实现关闭状态
      queueLength,
    };
  }

  // ==================== 排队系统方法 ====================

  /**
   * 加入排队
   */
  async joinQueue(
    socketId: string,
    nickname?: string,
    partySize: number = 1,
  ): Promise<number> {
    // 1. 添加到 Redis List（FIFO 队列）
    await this.redisService.rpush(QUEUE_KEY, socketId);
    
    // 2. 存储排队详细信息
    const queueInfo: QueueInfo = {
      socketId,
      nickname,
      queuedAt: new Date().toISOString(),
      partySize,
    };
    
    await this.redisService.set(
      `${QUEUE_INFO_PREFIX}${socketId}`,
      JSON.stringify(queueInfo),
    );
    
    // 3. 返回排队位置
    return await this.getQueuePosition(socketId);
  }

  /**
   * 离开排队
   */
  async leaveQueue(socketId: string): Promise<void> {
    // 1. 从队列中移除
    await this.redisService.lrem(QUEUE_KEY, 0, socketId);
    
    // 2. 删除排队信息
    await this.redisService.del(`${QUEUE_INFO_PREFIX}${socketId}`);
  }

  /**
   * 获取排队位置
   */
  async getQueuePosition(socketId: string): Promise<number> {
    const queue = await this.redisService.lrange(QUEUE_KEY, 0, -1);
    const position = queue.indexOf(socketId);
    return position === -1 ? -1 : position + 1;
  }

  /**
   * 获取排队队列长度
   */
  async getQueueLength(): Promise<number> {
    return await this.redisService.llen(QUEUE_KEY);
  }

  /**
   * 获取完整排队列表
   */
  async getQueueList(): Promise<QueueInfo[]> {
    const socketIds = await this.redisService.lrange(QUEUE_KEY, 0, -1);
    const queueList: QueueInfo[] = [];

    for (const socketId of socketIds) {
      const infoStr = await this.redisService.get(
        `${QUEUE_INFO_PREFIX}${socketId}`,
      );
      if (infoStr) {
        queueList.push(JSON.parse(infoStr));
      }
    }

    return queueList;
  }

  /**
   * 叫号（分配座位给下一位）
   */
  async callNext(): Promise<QueueInfo | null> {
    // 1. 从队列头部取出一个 socketId
    const socketId = await this.redisService.lpop(QUEUE_KEY);
    
    if (!socketId) {
      return null;
    }
    
    // 2. 获取排队信息
    const infoStr = await this.redisService.get(
      `${QUEUE_INFO_PREFIX}${socketId}`,
    );
    
    if (infoStr) {
      await this.redisService.del(`${QUEUE_INFO_PREFIX}${socketId}`);
      return JSON.parse(infoStr);
    }
    
    return null;
  }

  // ==================== 商家端方法 ====================

  /**
   * 获取所有座位及实时状态（从 Redis）
   */
  async findAllWithStatus(): Promise<any[]> {
    const allSeats = await this.findAll();
    const seatsWithStatus = [];

    for (const seat of allSeats) {
      const occupiedInfoStr = await this.redisService.get(
        `${SEAT_STATUS_OCCUPIED_PREFIX}${seat._id}`,
      );

      let realTimeStatus = 'available';
      let occupiedInfo = null;

      if (occupiedInfoStr) {
        realTimeStatus = 'occupied';
        occupiedInfo = JSON.parse(occupiedInfoStr);
      }

      // 计算最终显示状态：如果 Redis 中有占用记录，则强制为 occupied；否则使用数据库中的状态
      const finalStatus = occupiedInfo ? 'occupied' : seat.status;

      seatsWithStatus.push({
        _id: seat._id,
        seatNumber: seat.seatNumber,
        status: finalStatus,
        isActive: seat.isActive,
        createdAt: (seat as any).createdAt,
        updatedAt: (seat as any).updatedAt,
        realTimeStatus,
        occupiedInfo,
        // 扁平化常用字段给前端使用
        occupiedByName: occupiedInfo?.nickname,
        occupiedAt: occupiedInfo?.occupiedAt,
        occupiedBy: occupiedInfo?.socketId,
      });
    }

    return seatsWithStatus;
  }

  /**
   * 获取单个座位的实时状态
   */
  async getSeatStatus(id: string): Promise<any> {
    const seat = await this.findOne(id);
    
    const occupiedInfoStr = await this.redisService.get(
      `${SEAT_STATUS_OCCUPIED_PREFIX}${id}`,
    );

    let status = 'available';
    let occupiedInfo = null;

    if (occupiedInfoStr) {
      status = 'occupied';
      occupiedInfo = JSON.parse(occupiedInfoStr);
    }

    return {
      status,
      occupiedInfo,
    };
  }
}
