import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { UsersModule } from '../users/users.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { MessagesModule } from '../messages/messages.module.js';

@Module({
  imports: [UsersModule, SettingsModule, MessagesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}