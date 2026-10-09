import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddReactionDto, SendMessageDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(channelId: string, userId: string, dto: SendMessageDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!channel || channel.server.members.length === 0) {
      throw new ForbiddenException('Bu kanala mesaj gönderme yetkiniz yok');
    }

    return this.prisma.message.create({
      data: {
        channelId,
        senderId: userId,
        content: dto.content,
        attachments: dto.attachments || null,
        replyToId: dto.replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });
  }

  async getMessages(channelId: string, userId: string, limit = 50, before?: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!channel || channel.server.members.length === 0) {
      throw new ForbiddenException('Bu kanalın mesajlarını görme yetkiniz yok');
    }

    return this.prisma.message.findMany({
      where: {
        channelId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });
  }

  async toggleReaction(messageId: string, userId: string, dto: AddReactionDto) {
    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji: dto.emoji,
        },
      },
    });

    if (existing) {
      await this.prisma.messageReaction.delete({
        where: { id: existing.id },
      });
      return { action: 'removed', emoji: dto.emoji };
    } else {
      await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji: dto.emoji,
        },
      });
      return { action: 'added', emoji: dto.emoji };
    }
  }
}
