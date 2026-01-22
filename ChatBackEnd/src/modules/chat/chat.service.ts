import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Chat } from './entities/chat.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private chats: Chat[] = []; // 临时存储,实际应使用数据库
  private idCounter = 1;

  create(createChatDto: CreateChatDto): Chat {
    this.logger.log(`Creating new chat message for user: ${createChatDto.userId}`);
    
    const chat: Chat = {
      id: String(this.idCounter++),
      message: createChatDto.message,
      userId: createChatDto.userId,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.chats.push(chat);
    
    // 模拟AI响应
    const aiResponse: Chat = {
      id: String(this.idCounter++),
      message: `这是对"${createChatDto.message}"的AI回复`,
      userId: createChatDto.userId,
      role: 'assistant',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.chats.push(aiResponse);
    
    return aiResponse;
  }

  findAll(): Chat[] {
    this.logger.log('Fetching all chat messages');
    return this.chats;
  }

  findOne(id: string): Chat {
    this.logger.log(`Fetching chat message with id: ${id}`);
    const chat = this.chats.find((c) => c.id === id);
    
    if (!chat) {
      throw new NotFoundException(`Chat message with ID ${id} not found`);
    }
    
    return chat;
  }

  update(id: string, updateChatDto: UpdateChatDto): Chat {
    this.logger.log(`Updating chat message with id: ${id}`);
    const chat = this.findOne(id);
    
    Object.assign(chat, updateChatDto, { updatedAt: new Date() });
    
    return chat;
  }

  remove(id: string): void {
    this.logger.log(`Removing chat message with id: ${id}`);
    const index = this.chats.findIndex((c) => c.id === id);
    
    if (index === -1) {
      throw new NotFoundException(`Chat message with ID ${id} not found`);
    }
    
    this.chats.splice(index, 1);
  }
}
