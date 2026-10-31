import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSetting } from './entities/app-setting.entity.js';

@Module({
imports: [TypeOrmModule.forFeature([AppSetting])],
exports: [TypeOrmModule],    
})
export class SettingsModule {}
