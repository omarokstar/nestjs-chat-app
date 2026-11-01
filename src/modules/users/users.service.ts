import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { SettingsService } from '../settings/settings.service.js';
import { RoleName } from '../../common/enums/role-name.enum.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import { NearbyQueryDto } from './dto/nearby-query.dto.js';
import { NearbyUserResponseDto } from './dto/nearby-user-response.dto.js';


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly usersRepository: Repository<User>,
        private readonly settingsService: SettingsService,
    ) {}

    public async getCurrentUser(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    findAuthState(id: string) {
        return this.usersRepository.findOne({
            where: { id },
            select: { id: true, isBlocked: true },
            relations: { role: true },
        });
}


  async updateLocation(id: string, { latitude, longitude }: UpdateLocationDto) {
    await this.usersRepository.query(
      `UPDATE users
         SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
             location_updated_at = now()
       WHERE id = $3`,
      [longitude, latitude, id], // PostGIS order: lng, lat
    );
    return { latitude, longitude };
  }

  async findNearby(userId: string, { page, limit }: NearbyQueryDto) {
    const me = await this.usersRepository.findOne({
      where: { id: userId },
      select: { id: true, locationUpdatedAt: true },
    });
    if (!me?.locationUpdatedAt) {
      throw new BadRequestException('Update your location first');
    }

    const radiusKm = await this.settingsService.getRadiusKm();
      const users = await this.usersRepository
          .createQueryBuilder('u')
          .select(['u.id AS id', 'u.username AS username'])
          .addSelect('ROUND(ST_Distance(u.location, me.location))::int', 'distanceMeters')
          .innerJoin(User, 'me', 'me.id = :userId', { userId })
          .where('u.id <> :userId')
          .andWhere('u.isBlocked = false')
          .andWhere('u.isAccountVerified = true')
          .andWhere('u.location IS NOT NULL')
          .andWhere('ST_DWithin(u.location, me.location, :meters)', { meters: radiusKm * 1000 })
          .orderBy('"distanceMeters"', 'ASC')
          .limit(limit)
          .offset((page - 1) * limit)
          .getRawMany<NearbyUserResponseDto>();
      return { radiusKm, page, limit, users };
  }

  //   used by AdminService

  async listForAdmin(q: { search?: string; isBlocked?: boolean; page: number; limit: number }) {
    const qb = this.usersRepository
      .createQueryBuilder('u')
      .leftJoin('u.role', 'r')
      .select([
        'u.id', 'u.username', 'u.email', 'u.isBlocked', 'u.blockedReason',
        'u.blockedAt', 'u.isAccountVerified', 'u.createdAt', 'r.id', 'r.name',
      ])
      .orderBy('u.createdAt', 'DESC')
      .skip((q.page - 1) * q.limit)
      .take(q.limit);

    if (q.search) {
      const term = `%${q.search.replace(/[\\%_]/g, '\\$&')}%`;
      qb.andWhere('(u.username ILIKE :term OR u.email ILIKE :term)', { term });
    }
    if (q.isBlocked !== undefined) {
      qb.andWhere('u.isBlocked = :blocked', { blocked: q.isBlocked });
    }

    const [rows, total] = await qb.getManyAndCount();
    const items = rows.map(({ role, ...u }) => ({ ...u, role: role.name }));
    return { items, total, page: q.page, limit: q.limit };
  }

  async blockUser(id: string, reason?: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role.name === RoleName.ADMIN) throw new ForbiddenException('Admins cannot be blocked');
    await this.usersRepository.update(id, {
      isBlocked: true,
      blockedReason: reason ?? null,
      blockedAt: new Date(),
    });
    return { id, isBlocked: true };
  }

  async unblockUser(id: string) {
    const result = await this.usersRepository.update(id, {
      isBlocked: false,
      blockedReason: null,
      blockedAt: null,
    });
    if (!result.affected) throw new NotFoundException('User not found');
    return { id, isBlocked: false };
  }

}       
