import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Chat } from './entities/chat.entity';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: '发送聊天消息' })
  @ApiResponse({ status: 201, description: '消息发送成功', type: Chat })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  create(@Body() createChatDto: CreateChatDto): Chat {
    return this.chatService.create(createChatDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有聊天消息' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Chat] })
  findAll(): Chat[] {
    return this.chatService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取聊天消息' })
  @ApiResponse({ status: 200, description: '获取成功', type: Chat })
  @ApiResponse({ status: 404, description: '消息不存在' })
  findOne(@Param('id') id: string): Chat {
    return this.chatService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新聊天消息' })
  @ApiResponse({ status: 200, description: '更新成功', type: Chat })
  @ApiResponse({ status: 404, description: '消息不存在' })
  update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto): Chat {
    return this.chatService.update(id, updateChatDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除聊天消息' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '消息不存在' })
  remove(@Param('id') id: string): void {
    return this.chatService.remove(id);
  }
}
