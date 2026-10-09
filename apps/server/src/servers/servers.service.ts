import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServerDto, JoinServerDto } from './dto/server.dto';

@Injectable()
export class ServersService {
  constructor(private prisma: PrismaService) {}

  async createServer(userId: string, dto: CreateServerDto) {
    const server = await this.prisma.server.create({
      data: {
        name: dto.name,
        description: dto.description || '',
        iconUrl:
          dto.iconUrl ||
          `https://api.dicebear.com/7.x/identicon/png?seed=${encodeURIComponent(dto.name)}`,
        ownerId: userId,
        members: {
          create: {
            userId,
          },
        },
        roles: {
          create: [
            {
              name: '@everyone',
              color: '#99aab5',
              isDefault: true,
              position: 0,
            },
            {
              name: 'Yönetici',
              color: '#f04747',
              isDefault: false,
              position: 1,
            },
          ],
        },
        categories: {
          create: [
            {
              name: 'METİN KANALLARI',
              position: 0,
              channels: {
                create: [
                  {
                    name: 'genel',
                    type: ChannelType.TEXT,
                    topic: 'Genel sohbet odası',
                    position: 0,
                    serverId: '', // will be connected
                  },
                ],
              },
            },
            {
              name: 'SES KANALLARI',
              position: 1,
              channels: {
                create: [
                  {
                    name: '🔊 Sohbet Odası 1',
                    type: ChannelType.VOICE,
                    position: 0,
                    serverId: '',
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Link channel serverId
    await this.prisma.channel.updateMany({
      where: {
        category: {
          serverId: server.id,
        },
      },
      data: {
        serverId: server.id,
      },
    });

    return this.getServerDetails(server.id, userId);
  }

  async getUserServers(userId: string) {
    const memberships = await this.prisma.serverMember.findMany({
      where: { userId },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            iconUrl: true,
            description: true,
            ownerId: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return memberships.map((m) => m.server);
  }

  async getServerDetails(serverId: string, userId: string) {
    // Check membership
    const member = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: { serverId, userId },
      },
    });

    if (!member) {
      throw new NotFoundException('Bu sunucunun üyesi değilsiniz');
    }

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      include: {
        categories: {
          orderBy: { position: 'asc' },
          include: {
            channels: {
              orderBy: { position: 'asc' },
            },
          },
        },
        channels: {
          where: { categoryId: null },
          orderBy: { position: 'asc' },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Sunucu bulunamadı');
    }

    return server;
  }

  async joinServerByInvite(userId: string, dto: JoinServerDto) {
    const server = await this.prisma.server.findUnique({
      where: { inviteCode: dto.inviteCode },
    });

    if (!server) {
      throw new NotFoundException('Geçersiz davet kodu');
    }

    const existing = await this.prisma.serverMember.findUnique({
      where: {
        serverId_userId: { serverId: server.id, userId },
      },
    });

    if (existing) {
      return this.getServerDetails(server.id, userId);
    }

    await this.prisma.serverMember.create({
      data: {
        serverId: server.id,
        userId,
      },
    });

    return this.getServerDetails(server.id, userId);
  }
}
