import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

// Sent as multipart/form-data; the audio file itself is handled by FileInterceptor.
export class SendAudioMessageDto {
  @IsUUID()
  receiverId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300) // max 5 minutes
  durationSec!: number;
}