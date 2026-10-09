import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async createChannel(serverId: string, userId: string, dto: CreateChannelDto) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!server) {
      throw new NotFoundException('Sunucu bulunamadı');
    }

    if (server.members.length === 0) {
      throw new ForbiddenException('Bu sunucunun üyesi değilsiniz');
    }

    return this.prisma.channel.create({
      data: {
        serverId,
        name: dto.name.toLowerCase().replace(/\s+/g, '-'),
        type: dto.type,
        categoryId: dto.categoryId,
        topic: dto.topic,
      },
    });
  }

  async getChannel(channelId: string, userId: string) {
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
      throw new NotFoundException('Kanal bulunamadı veya erişim yetkiniz yok');
    }

    return channel;
  }
}
