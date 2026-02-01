import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 设置全局路由前缀
  app.setGlobalPrefix('api');

  // CORS配置 - 允许多个源访问
  app.enableCors({
    origin: [
      'http://localhost:3000',  // ChatUI
      'http://localhost:3001',  // ChatUI备用端口
      'http://localhost:3002',  // FlappyBird当前端口
      'http://localhost:8080',  // FlappyBird备用端口
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // 改为 false，允许额外属性但会被过滤
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API文档配置
  const config = new DocumentBuilder()
    .setTitle('Chat API')
    .setDescription('Chat应用后端API文档')
    .setVersion('1.0')
    .addTag('chat')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3001;
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  logger.log(`Application is running on: http://${host}:${port}`);
  logger.log(
    `Swagger documentation available at: http://${host}:${port}/api`,
  );
}
void bootstrap();
