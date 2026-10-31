import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { authUserType } from '../types.js';

export const CurrentUser = createParamDecorator(
  (data: keyof authUserType | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user as authUserType | undefined;
    return data ? user?.[data] : user;
  },
);