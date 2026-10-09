import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track connected users: userId -> socketId[]
  private activeUsers = new Map<string, string[]>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super-secret-chatagram-jwt-key-2026',
      });

      const userId = payload.sub;
      client.data.userId = userId;

      const userSockets = this.activeUsers.get(userId) || [];
      this.activeUsers.set(userId, [...userSockets, client.id]);

      // Update user status in DB
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'ONLINE' },
      });

      // Broadcast user online status
      this.server.emit('user_status_changed', { userId, status: 'ONLINE' });
    } catch (err) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      const userSockets = this.activeUsers.get(userId) || [];
      const updated = userSockets.filter((id) => id !== client.id);

      if (updated.length === 0) {
        this.activeUsers.delete(userId);
        await this.prisma.user.update({
          where: { id: userId },
          data: { status: 'OFFLINE' },
        });
        this.server.emit('user_status_changed', { userId, status: 'OFFLINE' });
      } else {
        this.activeUsers.set(userId, updated);
      }
    }
  }

  @SubscribeMessage('join_channel')
  handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.join(`channel:${data.channelId}`);
    return { status: 'joined', channelId: data.channelId };
  }

  @SubscribeMessage('leave_channel')
  handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.leave(`channel:${data.channelId}`);
    return { status: 'left', channelId: data.channelId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      channelId: string;
      content: string;
      replyToId?: string;
      attachments?: any;
    },
  ) {
    const userId = client.data?.userId;
    if (!userId) return;

    const message = await this.messagesService.sendMessage(
      data.channelId,
      userId,
      {
        content: data.content,
        replyToId: data.replyToId,
        attachments: data.attachments,
      },
    );

    // Broadcast to everyone in channel room (including sender)
    this.server.to(`channel:${data.channelId}`).emit('new_message', message);

    return message;
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; username: string },
  ) {
    client.to(`channel:${data.channelId}`).emit('user_typing', {
      channelId: data.channelId,
      userId: client.data?.userId,
      username: data.username,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.to(`channel:${data.channelId}`).emit('user_typing', {
      channelId: data.channelId,
      userId: client.data?.userId,
      isTyping: false,
    });
  }

  @SubscribeMessage('join_voice')
  handleJoinVoice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; serverId: string },
  ) {
    client.join(`voice:${data.channelId}`);
    this.server.to(`voice:${data.channelId}`).emit('voice_participant_joined', {
      channelId: data.channelId,
      userId: client.data?.userId,
    });
  }

  @SubscribeMessage('leave_voice')
  handleLeaveVoice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    client.leave(`voice:${data.channelId}`);
    this.server.to(`voice:${data.channelId}`).emit('voice_participant_left', {
      channelId: data.channelId,
      userId: client.data?.userId,
    });
  }
}
