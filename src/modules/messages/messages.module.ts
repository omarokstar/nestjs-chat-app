import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/messages.entitie.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';
import { UsersModule } from "../users/users.module.js"

@Module({
  imports: [TypeOrmModule.forFeature([Message]),UsersModule],
  exports: [TypeOrmModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
