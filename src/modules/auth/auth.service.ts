import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from '../users/entities/user.entity.js';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from './dto/register.dto.js';
import bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';
import { jwtPayloadType } from '../../common/types.js';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service.js';
import { randomBytes } from 'crypto';
import { Role } from '../roles/entities/role.entity.js';
import { RoleName } from '../../common/enums/role-name.enum.js';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly usersRepository: Repository<User>,
        @InjectRepository(Role) private readonly rolesRepository: Repository<Role>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
    ) {
    }

    public async register(registerDto: RegisterDto) {
        const { email, username, password } = registerDto;
        const existing = await this.usersRepository.findOne({ where: [{ email }, { username }] });
        if (existing) {
            throw new BadRequestException("User already exists");
        }
        const hashedPassword = await this.hashPassword(password);
        const userRole = await this.rolesRepository.findOne({ where: { name: RoleName.USER } });
        if (!userRole) {
            throw new InternalServerErrorException("Default user role not found. Please seed the roles table.");
        }
        const newUser = this.usersRepository.create({
            email,
            username,
            passwordHash: hashedPassword,
            emailToken: randomBytes(64).toString('hex'),
            roleId: userRole.id,
        });
        await this.usersRepository.save(newUser);
        const link = this.generateVerificationLink(newUser.id, newUser.emailToken!);
        this.mailService.sendEmailVerification(email, link);
        return { message: "Please check your email to verify your account" };
    }

    /**
     * @param loginDto: LoginDto
     * @returns token or verification message
     */
    public async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .leftJoinAndSelect('user.role', 'role') 
            .where('user.email = :email', { email })
            .getOne();

        if (!user) {
            throw new BadRequestException("Invalid credentials");
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new BadRequestException("Invalid credentials");
        }
        if (user.isBlocked) {
            throw new BadRequestException("Your account has been blocked");
        }
        if (!user.isAccountVerified) {
            let emailToken = user.emailToken;
            if (!emailToken) {
                emailToken = randomBytes(64).toString('hex');
                user.emailToken = emailToken;
                await this.usersRepository.save(user);
            }
            const link = this.generateVerificationLink(user.id, emailToken);
            this.mailService.sendEmailVerification(user.email, link);
            return { message: "Please check your email to verify your account" };
        }
        const token = await this.generateJwtToken({ id: user.id });
        return { token, user: { id: user.id, username: user.username, email: user.email, role: user.role.name } };
    }

    public async verifyEmail(userId: string, emailToken: string) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException("Invalid verification link");
        }
        if (user.isAccountVerified) {
            return { message: "Email is already verified" };
        }
        if (user.emailToken !== emailToken) {
            throw new BadRequestException("Invalid verification link");
        }
        user.isAccountVerified = true;
        user.emailToken = null;
        await this.usersRepository.save(user);
        return { message: "Email verified successfully" };
    }

    /**
     * @param payload - JWT payload containing user id and type
     * @returns signed JWT token string
     */
    private async generateJwtToken(payload: jwtPayloadType): Promise<string> {
        return this.jwtService.signAsync(payload);
    }

    private generateVerificationLink(userId: string, emailToken: string): string {
        return `${this.configService.get<string>("DOMAIN")}api/auth/verify-email/${userId}/${emailToken}`;
    }

    public async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
}
