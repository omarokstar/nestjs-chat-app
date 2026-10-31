import { UserType } from './enums/user-type.enum.js';

export type jwtPayloadType = {
    id: string;
    userType: UserType;
}

export type accessTokenType = {
    token: string;
}