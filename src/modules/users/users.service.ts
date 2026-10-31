import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly usersRepository: Repository<User>,
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
}   
