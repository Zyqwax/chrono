import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/channel.dto';

@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Post('server/:serverId')
  createChannel(
    @CurrentUser() user: { id: string },
    @Param('serverId') serverId: string,
    @Body() dto: CreateChannelDto,
  ) {
    return this.channelsService.createChannel(serverId, user.id, dto);
  }

  @Get(':id')
  getChannel(
    @CurrentUser() user: { id: string },
    @Param('id') channelId: string,
  ) {
    return this.channelsService.getChannel(channelId, user.id);
  }
}
