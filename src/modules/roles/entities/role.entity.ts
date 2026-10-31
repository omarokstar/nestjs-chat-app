import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RoleName } from '../../../common/enums/role-name.enum.js';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ type: 'smallint' })
  id!: number;

  @Column({ type: 'enum', enum: RoleName, unique: true })
  name!: RoleName;
}