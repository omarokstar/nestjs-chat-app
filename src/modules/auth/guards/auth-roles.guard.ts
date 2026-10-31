import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { UserType } from "../../../common/enums/user-type.enum.js";
import { jwtPayloadType } from "../../../common/types.js";
import { ROLES_KEY } from "../../../common/decorators/roles.decorator.js";

@Injectable()
export class AuthRolesGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // First: authenticate (verify JWT)
        const request: Request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException("Missing token");
        }

        let payload: jwtPayloadType;
        try {
            payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });
            (request as any)["user"] = payload;
        } catch {
            throw new UnauthorizedException("Invalid or expired token");
        }

        // Second: authorize (check roles)
        const requiredRoles: UserType[] | undefined = this.reflector.getAllAndOverride(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are required, just authentication is enough
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Check if user's type matches any required role
        if (!requiredRoles.includes(payload.userType)) {
            throw new ForbiddenException("You do not have permission to access this resource");
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(" ") ?? [];
        return type === "Bearer" ? token : undefined;
    }
}
