import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/messages.entitie.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  exports: [TypeOrmModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
