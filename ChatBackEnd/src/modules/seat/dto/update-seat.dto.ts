import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateSeatDto } from './create-seat.dto';
import { SeatStatus } from '../schemas/seat.schema';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSeatDto extends PartialType(CreateSeatDto) {
  @ApiProperty({ 
    description: '座位状态', 
    enum: SeatStatus,
    required: false 
  })
  @IsEnum(SeatStatus)
  @IsOptional()
  status?: SeatStatus;
}
