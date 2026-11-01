import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/messages.entitie.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';
import { UsersModule } from "../users/users.module.js"
import { MessagesGateway } from "./messages.gateway.js"

@Module({
  imports: [TypeOrmModule.forFeature([Message]), UsersModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesGateway],
})
export class MessagesModule {}
