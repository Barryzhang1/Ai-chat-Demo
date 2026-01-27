import { IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SeatStatus } from '../schemas/seat.schema';

export class CreateSeatDto {
  @ApiProperty({ description: '座位号', example: 1 })
  @IsNumber()
  @Min(1)
  seatNumber: number;

  @ApiProperty({ 
    description: '座位状态', 
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE 
  })
  @IsEnum(SeatStatus)
  @IsOptional()
  status?: SeatStatus;
}
