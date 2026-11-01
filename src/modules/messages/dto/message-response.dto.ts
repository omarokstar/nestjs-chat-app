import { MessageType } from '../../../common/enums/message-type.enum.js';

export class MessageResponseDto {
  id!: string;
  senderId!: string;
  receiverId!: string;
  type!: MessageType;
  content!: string | null;
  audioUrl!: string | null; // API path, streamed by GET /messages/audio/:id
  audioDurationSec!: number | null;
  readAt!: Date | null;
  createdAt!: Date;
}