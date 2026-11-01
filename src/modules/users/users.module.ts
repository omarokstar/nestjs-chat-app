import { Module } from '@nestjs/common';
import { User } from './entities/user.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { SettingsModule } from '../settings/settings.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([User]),SettingsModule],
  exports: [TypeOrmModule, UsersService],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
