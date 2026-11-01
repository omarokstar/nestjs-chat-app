import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Message } from './entities/messages.entitie.js';
import { MessageType } from '../../common/enums/message-type.enum.js';
import { UsersService } from '../users/users.service.js';
import { SendTextMessageDto } from './dto/send-text-message.dto.js';
import { SendAudioMessageDto } from './dto/send-audio-message.dto.js';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto.js';
import { MessageResponseDto } from './dto/message-response.dto.js';
import { AUDIO_DIR } from './audio-upload.config.js';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly repo: Repository<Message>,
    private readonly usersService: UsersService,
  ) {}

  async sendText(senderId: string, dto: SendTextMessageDto): Promise<MessageResponseDto> {
    await this.assertCanMessage(senderId, dto.receiverId);
    const message = await this.repo.save(
      this.repo.create({
        senderId,
        receiverId: dto.receiverId,
        type: MessageType.TEXT,
        content: dto.content,
      }),
    );
    return this.toResponse(message);
  }

  async sendAudio(
    senderId: string,
    dto: SendAudioMessageDto,
    file: Express.Multer.File,
  ): Promise<MessageResponseDto> {
    try {
      await this.assertCanMessage(senderId, dto.receiverId);
    } catch (err) {
      await unlink(file.path).catch(() => undefined); // don't keep files for rejected messages
      throw err;
    }
    const message = await this.repo.save(
      this.repo.create({
        senderId,
        receiverId: dto.receiverId,
        type: MessageType.AUDIO,
        audioUrl: file.filename, // storage key; the public URL is built in toResponse
        audioDurationSec: dto.durationSec,
      }),
    );
    return this.toResponse(message);
  }

  async getHistory(me: string, other: string, { before, limit }: GetMessagesQueryDto) {
    const qb = this.repo
      .createQueryBuilder('m')
      .where(
        '((m.senderId = :me AND m.receiverId = :other) OR (m.senderId = :other AND m.receiverId = :me))',
        { me, other },
      )
      .orderBy('m.id', 'DESC')
      .take(limit);
    if (before) qb.andWhere('m.id < :before', { before });
    const rows = await qb.getMany();
    return rows.map((m) => this.toResponse(m)); // newest first; pass the last id as `before` for older ones
  }

  async getConversations(userId: string) {
    const rows: Array<{
      partnerId: string; username: string; id: string; type: MessageType;
      content: string | null; senderId: string; createdAt: Date;
    }> = await this.repo.query(
      `SELECT DISTINCT ON (m.partner_id)
              m.partner_id AS "partnerId", u.username, m.id, m.type, m.content,
              m.sender_id AS "senderId", m.created_at AS "createdAt"
         FROM (
           SELECT *, CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS partner_id
             FROM messages
            WHERE sender_id = $1 OR receiver_id = $1
         ) m
         JOIN users u ON u.id = m.partner_id
        ORDER BY m.partner_id, m.id DESC`,
      [userId],
    );

    const unread = await this.repo
      .createQueryBuilder('m')
      .select('m.senderId', 'partnerId')
      .addSelect('COUNT(*)', 'count')
      .where('m.receiverId = :userId AND m.readAt IS NULL', { userId })
      .groupBy('m.senderId')
      .getRawMany<{ partnerId: string; count: string }>();
    const unreadByUser = new Map(unread.map((u) => [u.partnerId, Number(u.count)]));

    return rows
      .map((r) => ({
        userId: r.partnerId,
        username: r.username,
        unreadCount: unreadByUser.get(r.partnerId) ?? 0,
        lastMessage: {
          id: r.id,
          type: r.type,
          content: r.type === MessageType.TEXT ? r.content : null,
          senderId: r.senderId,
          createdAt: r.createdAt,
        },
      }))
      .sort((a, b) => +new Date(b.lastMessage.createdAt) - +new Date(a.lastMessage.createdAt));
  }

  async markRead(me: string, other: string): Promise<{ updated: number }> {
    const result = await this.repo.update(
      { senderId: other, receiverId: me, readAt: IsNull() },
      { readAt: () => 'now()' },
    );
    return { updated: result.affected ?? 0 };
  }

  // Only the sender and receiver may fetch the file
  async getAudioPath(userId: string, id: string): Promise<string> {
    const m = await this.repo.findOne({ where: { id } });
    if (
      !m || m.type !== MessageType.AUDIO || !m.audioUrl ||
      (m.senderId !== userId && m.receiverId !== userId)
    ) {
      throw new NotFoundException('Audio not found');
    }
    return join(AUDIO_DIR, basename(m.audioUrl));
  }

  private async assertCanMessage(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new BadRequestException('You cannot message yourself');
    const [sender, receiver] = await Promise.all([
      this.usersService.findAuthState(senderId),
      this.usersService.findAuthState(receiverId),
    ]);
    if (!sender || sender.isBlocked) throw new ForbiddenException('Account unavailable');
    if (!receiver || receiver.isBlocked) throw new NotFoundException('User not found');
  }

  private toResponse(m: Message): MessageResponseDto {
    return {
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      type: m.type,
      content: m.content ?? null,
      audioUrl: m.type === MessageType.AUDIO ? `/api/messages/audio/${m.id}` : null,
      audioDurationSec: m.audioDurationSec ?? null,
      readAt: m.readAt ?? null,
      createdAt: m.createdAt,
    };
  }
}