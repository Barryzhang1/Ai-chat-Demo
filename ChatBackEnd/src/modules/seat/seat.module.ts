import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeatService } from './seat.service';
import { SeatController } from './seat.controller';
import { SeatGateway } from './seat.gateway';
import { Seat, SeatSchema } from './schemas/seat.schema';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Seat.name, schema: SeatSchema },
    ]),
    RedisModule,
  ],
  controllers: [SeatController],
  providers: [SeatService, SeatGateway],
  exports: [SeatService, SeatGateway],
})
export class SeatModule {}
