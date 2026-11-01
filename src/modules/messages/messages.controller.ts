import {
  BadRequestException, Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe,
  Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { MessagesService } from './messages.service.js';
import { MessagesGateway } from './messages.gateway.js';
import { SendTextMessageDto } from './dto/send-text-message.dto.js';
import { SendAudioMessageDto } from './dto/send-audio-message.dto.js';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto.js';
import { audioUploadOptions } from './audio-upload.config.js';

@Controller('messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly gateway: MessagesGateway,
  ) {}

  @Get('conversations')
  conversations(@CurrentUser('id') me: string) {
    return this.messagesService.getConversations(me);
  }

  @Get('with/:userId')
  history(
    @CurrentUser('id') me: string,
    @Param('userId', ParseUUIDPipe) other: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.messagesService.getHistory(me, other, query);
  }

  @Patch('with/:userId/read')
  async markRead(@CurrentUser('id') me: string, @Param('userId', ParseUUIDPipe) other: string) {
    const result = await this.messagesService.markRead(me, other);
    if (result.updated) this.gateway.emitToUser(other, 'message:read', { byUserId: me });
    return result;
  }

  @Post('text')
  async sendText(@CurrentUser('id') me: string, @Body() dto: SendTextMessageDto) {
    const message = await this.messagesService.sendText(me, dto);
    this.gateway.emitToUser(dto.receiverId, 'message:new', message);
    return message;
  }

  @Post('audio')
  @UseInterceptors(FileInterceptor('audio', audioUploadOptions))
  async sendAudio(
    @CurrentUser('id') me: string,
    @Body() dto: SendAudioMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Audio file is required (form field "audio")');
    const message = await this.messagesService.sendAudio(me, dto, file);
    this.gateway.emitToUser(dto.receiverId, 'message:new', message);
    return message;
  }

  @Get('audio/:id')
  async audio(
    @CurrentUser('id') me: string,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    res.sendFile(await this.messagesService.getAudioPath(me, String(id)));
  }
}