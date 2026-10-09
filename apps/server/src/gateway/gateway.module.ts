import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagesModule } from '../messages/messages.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [AuthModule, MessagesModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class GatewayModule {}
