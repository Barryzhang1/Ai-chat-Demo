import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InventoryLoss,
  InventoryLossSchema,
} from './entities/inventory-loss.entity';
import { InventoryLossService } from './inventory-loss.service';
import { InventoryLossController } from './inventory-loss.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryLoss.name, schema: InventoryLossSchema },
    ]),
    InventoryModule,
  ],
  controllers: [InventoryLossController],
  providers: [InventoryLossService],
})
export class InventoryLossModule {}
