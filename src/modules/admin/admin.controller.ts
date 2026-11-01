import { Body, Controller, Get, Param, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { AuthRolesGuard } from '../auth/guards/auth-roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleName } from '../../common/enums/role-name.enum.js';
import { UuidParamDto } from '../../common/dto/uuid-param.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { BlockUserDto } from './dto/block-user.dto.js';
import { UpdateRadiusDto } from './dto/update-radius.dto.js';

@Controller('admin')
@UseGuards(AuthGuard, AuthRolesGuard)
@Roles(RoleName.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/block')
  block(@Param() { id }: UuidParamDto, @Body() dto: BlockUserDto) {
    return this.adminService.blockUser(id, dto.reason);
  }

  @Patch('users/:id/unblock')
  unblock(@Param() { id }: UuidParamDto) {
    return this.adminService.unblockUser(id);
  }

  @Get('settings/radius')
  getRadius() {
    return this.adminService.getRadius();
  }

  @Put('settings/radius')
  setRadius(@CurrentUser('id') adminId: string, @Body() dto: UpdateRadiusDto) {
    return this.adminService.setRadius(dto.radiusKm, adminId);
  }
}