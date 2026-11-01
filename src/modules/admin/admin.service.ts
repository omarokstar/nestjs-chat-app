import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { MessagesGateway } from '../messages/messages.gateway.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly settingsService: SettingsService,
    private readonly gateway: MessagesGateway,
  ) {}

  listUsers(query: ListUsersQueryDto) {
    return this.usersService.listForAdmin(query);
  }

  async blockUser(id: string, reason?: string) {
    const result = await this.usersService.blockUser(id, reason);
    this.gateway.disconnectUser(id); // kick active sockets immediately
    return result;
  }

  unblockUser(id: string) {
    return this.usersService.unblockUser(id);
  }

  async getRadius() {
    return { radiusKm: await this.settingsService.getRadiusKm() };
  }

  setRadius(radiusKm: number, adminId: string) {
    return this.settingsService.setRadiusKm(radiusKm, adminId);
  }
}