import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Point } from 'geojson';
import { Role } from '../../roles/entities/role.entity.js';
import { UserType } from '../../../common/enums/user-type.enum.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'role_id', type: 'smallint' })
  roleId!: number;

  @ManyToOne(() => Role, { nullable: false, eager: true })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ type: 'varchar', length: 50, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ name: 'user_type', type: 'enum', enum: UserType, default: UserType.NORMAL_USER })
  userType!: UserType;

  @Column({ name: 'is_account_verified', type: 'boolean', default: false })
  isAccountVerified!: boolean;

  @Column({ name: 'email_token', type: 'varchar', length: 255, nullable: true })
  emailToken!: string | null;

  // PostGIS geography point: { type: 'Point', coordinates: [lng, lat] }
  @Index({ spatial: true })
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  location!: Point | null;

  @Column({ name: 'location_updated_at', type: 'timestamptz', nullable: true })
  locationUpdatedAt!: Date | null;

  @Column({ name: 'is_blocked', type: 'boolean', default: false })
  isBlocked!: boolean;

  @Column({ name: 'blocked_reason', type: 'text', nullable: true })
  blockedReason!: string | null;

  @Column({ name: 'blocked_at', type: 'timestamptz', nullable: true })
  blockedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}