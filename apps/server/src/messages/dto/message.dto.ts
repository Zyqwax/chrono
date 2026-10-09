import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  attachments?: any;

  @IsString()
  @IsOptional()
  replyToId?: string;
}

export class AddReactionDto {
  @IsString()
  @IsNotEmpty()
  emoji: string;
}
