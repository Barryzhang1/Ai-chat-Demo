import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DeepseekModule } from './modules/deepseek/deepseek.module';
import { AuthModule } from './modules/auth/auth.module';
import { DishModule } from './modules/dish/dish.module';
import { OrderingModule } from './modules/ordering/ordering.module';
import { CategoryModule } from './modules/category/category.module';
import { SeatModule } from './modules/seat/seat.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';
import { InventoryLossModule } from './modules/inventory-loss/inventory-loss.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { GameScoreModule } from './modules/game-score/game-score.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('MONGO_HOST', 'localhost');
        const port = configService.get<string>('MONGO_PORT', '27017');
        const user = configService.get<string>('MONGO_USER', '');
        const password = configService.get<string>('MONGO_PASSWORD', '');
        const database = configService.get<string>(
          'MONGO_DATABASE',
          'restaurant',
        );
        const authSource = configService.get<string>(
          'MONGO_AUTH_SOURCE',
          'admin',
        );

        // 如果没有用户名和密码，使用无认证连接
        let uri: string;
        if (user && password) {
          uri = `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
        } else {
          uri = `mongodb://${host}:${port}/${database}`;
        }

        return {
          uri,
        };
      },
    }),
    RedisModule,
    DeepseekModule,
    AuthModule,
    DishModule,
    OrderingModule,
    CategoryModule,
    SeatModule,
    InventoryModule,
    PurchaseOrderModule,
    InventoryLossModule,
    UsersModule,
    RevenueModule,
    GameScoreModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
