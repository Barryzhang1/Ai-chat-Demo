import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeepseekService } from './deepseek.service';
import { DeepseekController } from './deepseek.controller';
import { Dish, DishSchema } from '../dish/entities/dish.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dish.name, schema: DishSchema }]),
  ],
  controllers: [DeepseekController],
  providers: [DeepseekService],
  exports: [DeepseekService],
})
export class DeepseekModule {}
