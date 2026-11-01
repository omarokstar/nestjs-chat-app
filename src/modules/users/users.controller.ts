import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import { NearbyQueryDto } from './dto/nearby-query.dto.js';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getCurrentUser(@CurrentUser('id') id: string) {
    return this.usersService.getCurrentUser(id);
  }

  @Patch('me/location')
  updateLocation(@CurrentUser('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.usersService.updateLocation(id, dto);
  }

  @Get('nearby')
  nearby(@CurrentUser('id') id: string, @Query() query: NearbyQueryDto) {
    return this.usersService.findNearby(id, query);
  }
}