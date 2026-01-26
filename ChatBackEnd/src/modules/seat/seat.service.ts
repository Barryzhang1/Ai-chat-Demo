import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seat, SeatDocument, SeatStatus } from './schemas/seat.schema';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';

@Injectable()
export class SeatService {
  constructor(
    @InjectModel(Seat.name) private seatModel: Model<SeatDocument>,
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
    return this.seatModel
      .find({ 
        status: SeatStatus.AVAILABLE,
        isActive: true 
      })
      .sort({ seatNumber: 1 })
      .exec();
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
    const seat = await this.seatModel.findById(id).exec();
    
    if (!seat || !seat.isActive) {
      throw new NotFoundException(`座位 ID ${id} 未找到`);
    }
    
    if (seat.status !== SeatStatus.AVAILABLE) {
      throw new ConflictException('座位不可用');
    }

    seat.status = SeatStatus.OCCUPIED;
    seat.occupiedBy = socketId;
    seat.occupiedByName = nickname;
    seat.occupiedAt = new Date();
    
    return await seat.save();
  }

  async releaseSeat(id: string): Promise<Seat> {
    const seat = await this.seatModel.findById(id).exec();
    
    if (!seat || !seat.isActive) {
      throw new NotFoundException(`座位 ID ${id} 未找到`);
    }
    
    seat.status = SeatStatus.AVAILABLE;
    seat.occupiedBy = undefined;
    seat.occupiedByName = undefined;
    seat.occupiedAt = undefined;
    
    return await seat.save();
  }

  async releaseSeatBySocketId(socketId: string): Promise<Seat | null> {
    const seat = await this.seatModel.findOne({ 
      occupiedBy: socketId,
      isActive: true 
    });
    
    if (!seat) {
      return null;
    }

    seat.status = SeatStatus.AVAILABLE;
    seat.occupiedBy = undefined;
    seat.occupiedByName = undefined;
    seat.occupiedAt = undefined;
    
    return await seat.save();
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
    
    return {
      total: seats.length,
      available: seats.filter(s => s.status === SeatStatus.AVAILABLE).length,
      occupied: seats.filter(s => s.status === SeatStatus.OCCUPIED).length,
      closed: seats.filter(s => s.status === SeatStatus.CLOSED).length,
    };
  }
}
