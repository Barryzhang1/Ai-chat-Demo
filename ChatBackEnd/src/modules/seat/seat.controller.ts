import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SeatService } from './seat.service';
import { SeatGateway } from './seat.gateway';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
  @ApiOperation({ summary: '获取所有座位' })
  findAll() {
    return this.seatService.findAll();
  }

  @Get('available')
  @ApiOperation({ summary: '获取所有可用座位' })
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

  @Patch(':id')
  @ApiOperation({ summary: '更新座位信息' })
  async update(@Param('id') id: string, @Body() updateSeatDto: UpdateSeatDto) {
    const seat = await this.seatService.update(id, updateSeatDto);
    await this.seatGateway.notifyMerchantSeatChange();
    return seat;
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除座位' })
  async remove(@Param('id') id: string) {
    const seat = await this.seatService.remove(id);
    await this.seatGateway.notifyMerchantSeatChange();
    return seat;
  }
}
