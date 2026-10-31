import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MessageType } from '../../../common/enums/message-type.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('messages')
@Index(['senderId', 'receiverId', 'createdAt'])
@Index(['receiverId', 'readAt'])
@Check(
  'CHK_messages_payload',
  `("type" = 'text' AND "content" IS NOT NULL AND "audio_url" IS NULL)
   OR ("type" = 'audio' AND "audio_url" IS NOT NULL)`,
)
export class Message {
  // bigint comes back from pg as string
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @Column({ name: 'receiver_id', type: 'uuid' })
  receiverId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver!: User;

  @Column({ type: 'enum', enum: MessageType })
  type!: MessageType;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ name: 'audio_url', type: 'varchar', length: 500, nullable: true })
  audioUrl!: string | null;

  @Column({ name: 'audio_duration_sec', type: 'int', nullable: true })
  audioDurationSec!: number | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}