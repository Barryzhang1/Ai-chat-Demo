import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderingController } from './ordering.controller';
import { OrderingService } from './ordering.service';
import { Cart, CartSchema } from './schemas/cart.schema';
import { Order, OrderSchema } from './schemas/order.schema';
import { ChatHistory, ChatHistorySchema } from './schemas/chat-history.schema';
import { Dish, DishSchema } from '../dish/entities/dish.entity';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Inventory, InventorySchema } from '../inventory/entities/inventory.entity';
import { AuthModule } from '../auth/auth.module';
import { DishService } from '../dish/dish.service';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryHistory, InventoryHistorySchema } from '../inventory/entities/inventory-history.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ChatHistory.name, schema: ChatHistorySchema },
      { name: Dish.name, schema: DishSchema },
      { name: User.name, schema: UserSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryHistory.name, schema: InventoryHistorySchema },
    ]),
    AuthModule,
  ],
  controllers: [OrderingController],
  providers: [OrderingService, DishService, InventoryService],
  exports: [OrderingService],
})
export class OrderingModule {}
