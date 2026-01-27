import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SeatService } from './seat.service';
import { SeatGateway } from './seat.gateway';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { JoinQueueDto } from './dto/join-queue.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('seats')
@Controller('seats')
export class SeatController {
  constructor(
    private readonly seatService: SeatService,
    private readonly seatGateway: SeatGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建新座位' })
  @ApiResponse({ status: 201, description: '座位创建成功' })
  async create(@Body() createSeatDto: CreateSeatDto) {
    const seat = await this.seatService.create(createSeatDto);
    await this.seatGateway.notifyMerchantSeatChange();
    return seat;
  }

  @Get()
  @ApiOperation({ summary: '获取所有座位（不含实时状态）' })
  findAll() {
    return this.seatService.findAll();
  }

  @Get('with-status')
  @ApiOperation({ summary: '获取所有座位及实时状态（从 Redis）' })
  findAllWithStatus() {
    return this.seatService.findAllWithStatus();
  }

  @Get('available')
  @ApiOperation({ summary: '获取所有可用座位（从 Redis）' })
  findAvailable() {
    return this.seatService.findAvailableSeats();
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取座位统计信息' })
  getStatistics() {
    return this.seatService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定座位' })
  findOne(@Param('id') id: string) {
    return this.seatService.findOne(id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: '获取座位实时状态（从 Redis）' })
  getSeatStatus(@Param('id') id: string) {
    return this.seatService.getSeatStatus(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新座位信息' })
  async update(@Param('id') id: string, @Body() updateSeatDto: UpdateSeatDto) {
    const seat = await this.seatService.update(id, updateSeatDto);
    await this.seatGateway.notifyMerchantSeatChange();
    return seat;
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除座位（软删除）' })
  async remove(@Param('id') id: string) {
    const seat = await this.seatService.remove(id);
    await this.seatGateway.notifyMerchantSeatChange();
    return seat;
  }

  // ==================== 排队系统接口 ====================

  @Post('queue/join')
  @ApiOperation({ summary: '加入排队' })
  @ApiResponse({ status: 201, description: '加入排队成功' })
  async joinQueue(@Body() joinQueueDto: JoinQueueDto) {
    const position = await this.seatService.joinQueue(
      joinQueueDto.socketId,
      joinQueueDto.nickname,
      joinQueueDto.partySize,
    );
    await this.seatGateway.notifyMerchantSeatChange();
    return {
      position,
      message: `您当前排在第 ${position} 位`,
    };
  }

  @Delete('queue/leave')
  @ApiOperation({ summary: '离开排队' })
  @ApiQuery({ name: 'socketId', required: true, description: 'Socket ID' })
  async leaveQueue(@Query('socketId') socketId: string) {
    await this.seatService.leaveQueue(socketId);
    await this.seatGateway.notifyMerchantSeatChange();
    return { message: '已退出排队' };
  }

  @Get('queue/list')
  @ApiOperation({ summary: '获取排队列表' })
  getQueueList() {
    return this.seatService.getQueueList();
  }

  @Get('queue/position')
  @ApiOperation({ summary: '查询排队位置' })
  @ApiQuery({ name: 'socketId', required: true, description: 'Socket ID' })
  async getQueuePosition(@Query('socketId') socketId: string) {
    const position = await this.seatService.getQueuePosition(socketId);
    if (position === -1) {
      return { position: -1, message: '您不在排队队列中' };
    }
    return {
      position,
      message: `您当前排在第 ${position} 位`,
    };
  }

  @Post('queue/call-next')
  @ApiOperation({ summary: '叫号（商家操作）' })
  async callNext() {
    const nextUser = await this.seatService.callNext();
    if (!nextUser) {
      return { message: '队列为空' };
    }
    await this.seatGateway.notifyMerchantSeatChange();
    return nextUser;
  }
}
