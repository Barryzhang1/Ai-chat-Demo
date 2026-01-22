import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './modules/chat/chat.module';
import { DeepseekModule } from './modules/deepseek/deepseek.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ChatModule,
    DeepseekModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
