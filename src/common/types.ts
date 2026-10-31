import { RoleName } from './enums/role-name.enum.js';

export type jwtPayloadType = { id: string };
export type authUserType = { id: string; role: RoleName };