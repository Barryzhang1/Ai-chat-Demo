import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err: Error) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // 基础操作
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  // List 操作（用于队列）
  async lpush(key: string, value: string): Promise<number> {
    return await this.client.lPush(key, value);
  }

  async rpush(key: string, value: string): Promise<number> {
    return await this.client.rPush(key, value);
  }

  async lpop(key: string): Promise<string | null> {
    return await this.client.lPop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.client.rPop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lRange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return await this.client.lLen(key);
  }

  async lrem(key: string, count: number, value: string): Promise<number> {
    return await this.client.lRem(key, count, value);
  }

  async lindex(key: string, index: number): Promise<string | null> {
    return await this.client.lIndex(key, index);
  }

  // 批量删除
  async delPattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    return await this.client.del(keys);
  }

  // 获取原生客户端（高级用法）
  getClient(): RedisClientType {
    return this.client;
  }
}
