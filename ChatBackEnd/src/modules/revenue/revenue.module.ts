import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';
import {
  ExtraTransaction,
  ExtraTransactionSchema,
} from './entities/extra-transaction.entity';
import { Order, OrderSchema } from '../ordering/schemas/order.schema';
import { Dish, DishSchema } from '../dish/entities/dish.entity';
import { Inventory, InventorySchema } from '../inventory/entities/inventory.entity';

/**
 * 收入管理模块
 * 提供收入统计和额外收支管理功能
 * 仅限 BOSS 角色访问
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExtraTransaction.name, schema: ExtraTransactionSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Dish.name, schema: DishSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
  ],
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
