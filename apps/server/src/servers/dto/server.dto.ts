import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateServerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;
}

export class JoinServerDto {
  @IsString()
  @IsNotEmpty()
  inviteCode: string;
}
