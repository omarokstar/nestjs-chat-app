import { Module } from '@nestjs/common';
import { Role } from '../roles/entities/role.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
imports: [TypeOrmModule.forFeature([Role])],
exports: [TypeOrmModule],    
})
export class RolesModule {}
