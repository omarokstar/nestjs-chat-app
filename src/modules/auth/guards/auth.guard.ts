import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsersService } from '../../users/users.service.js';
import type { authUserType, jwtPayloadType } from '../../../common/types.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing token');
    }

    let payload: jwtPayloadType;
    try {
      payload = await this.jwtService.verifyAsync<jwtPayloadType>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Role and blocked status come from the DB, so blocks and role changes apply immediately
    const user = await this.usersService.findAuthState(payload.id);
    if (!user || user.isBlocked) {
      throw new UnauthorizedException('Account unavailable');
    }

    (request as any).user = { id: user.id, role: user.role.name } satisfies authUserType;
    return true;
  }
}