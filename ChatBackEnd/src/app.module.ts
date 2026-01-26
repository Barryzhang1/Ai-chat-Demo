import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatModule } from './modules/chat/chat.module';
import { DeepseekModule } from './modules/deepseek/deepseek.module';
import { AuthModule } from './modules/auth/auth.module';
import { DishModule } from './modules/dish/dish.module';
import { CategoryModule } from './modules/category/category.module';
import { SeatModule } from './modules/seat/seat.module';

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
        const user = configService.get<string>('MONGO_USER', 'root');
        const password = configService.get<string>('MONGO_PASSWORD', 'password');
        const database = configService.get<string>('MONGO_DATABASE', 'restaurant');
        const authSource = configService.get<string>('MONGO_AUTH_SOURCE', 'admin');
        
        const uri = `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
        
        return {
          uri,
        };
      },
    }),
    ChatModule,
    DeepseekModule,
    AuthModule,
    DishModule,
    CategoryModule,
    SeatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
