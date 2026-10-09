import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddReactionDto, SendMessageDto } from './dto/message.dto';
import { MessagesService } from './messages.service';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post('channel/:channelId')
  sendMessage(
    @CurrentUser() user: { id: string },
    @Param('channelId') channelId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(channelId, user.id, dto);
  }

  @Get('channel/:channelId')
  getMessages(
    @CurrentUser() user: { id: string },
    @Param('channelId') channelId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messagesService.getMessages(
      channelId,
      user.id,
      limit ? parseInt(limit, 10) : 50,
      before,
    );
  }

  @Post(':id/reaction')
  toggleReaction(
    @CurrentUser() user: { id: string },
    @Param('id') messageId: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.messagesService.toggleReaction(messageId, user.id, dto);
  }
}
