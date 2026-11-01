import { HttpException, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage,
  WebSocketGateway, WebSocketServer, WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service.js';
import { MessagesService } from './messages.service.js';
import { SendTextMessageDto } from './dto/send-text-message.dto.js';
import type { jwtPayloadType } from '../../common/types.js';

const room = (userId: string) => `user:${userId}`;

@WebSocketGateway({ namespace: 'chat', cors: { origin: true } }) // restrict origin in production
export class MessagesGateway implements OnGatewayConnection {
  private readonly logger = new Logger(MessagesGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('Missing token');

      const payload = await this.jwtService.verifyAsync<jwtPayloadType>(token);
      const user = await this.usersService.findAuthState(payload.id);
      if (!user || user.isBlocked) throw new Error('Account unavailable');

      client.data.userId = user.id;
      await client.join(room(user.id));
    } catch (err) {
      this.logger.warn(`Socket rejected: ${(err as Error).message}`);
      client.emit('exception', { status: 'error', message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        new WsException(Object.values(errors[0]?.constraints ?? {})[0] ?? 'Invalid payload'),
    }),
  )
  @SubscribeMessage('message:send')
  async onSend(@ConnectedSocket() client: Socket, @MessageBody() dto: SendTextMessageDto) {
    try {
      const message = await this.messagesService.sendText(client.data.userId as string, dto);
      this.emitToUser(dto.receiverId, 'message:new', message);
      return { ok: true, message }; // returned value becomes the socket.io ack
    } catch (err) {
      return { ok: false, error: err instanceof HttpException ? err.message : 'Internal server error' };
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(room(userId)).emit(event, payload);
  }

  disconnectUser(userId: string) {
    this.server.in(room(userId)).disconnectSockets(true);
  }
}