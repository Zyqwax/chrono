import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateServerDto, JoinServerDto } from './dto/server.dto';
import { ServersService } from './servers.service';

@UseGuards(JwtAuthGuard)
@Controller('servers')
export class ServersController {
  constructor(private serversService: ServersService) {}

  @Post()
  createServer(@CurrentUser() user: { id: string }, @Body() dto: CreateServerDto) {
    return this.serversService.createServer(user.id, dto);
  }

  @Get()
  getUserServers(@CurrentUser() user: { id: string }) {
    return this.serversService.getUserServers(user.id);
  }

  @Get(':id')
  getServerDetails(
    @CurrentUser() user: { id: string },
    @Param('id') serverId: string,
  ) {
    return this.serversService.getServerDetails(serverId, user.id);
  }

  @Post('join')
  joinServer(
    @CurrentUser() user: { id: string },
    @Body() dto: JoinServerDto,
  ) {
    return this.serversService.joinServerByInvite(user.id, dto);
  }
}
