import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderingController } from './ordering.controller';
import { OrderingService } from './ordering.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { ChatHistory, ChatHistorySchema } from './schemas/chat-history.schema';
import { Dish, DishSchema } from '../dish/entities/dish.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ChatHistory.name, schema: ChatHistorySchema },
      { name: Dish.name, schema: DishSchema },
    ]),
    AuthModule,
  ],
  controllers: [OrderingController],
  providers: [OrderingService],
  exports: [OrderingService],
})
export class OrderingModule {}
