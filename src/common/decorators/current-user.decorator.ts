import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { jwtPayloadType } from '../types.js';

export const CurrentUser = createParamDecorator(
  (data: keyof jwtPayloadType | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request['user'] as jwtPayloadType;
    return data ? user?.[data] : user;
  },
);
