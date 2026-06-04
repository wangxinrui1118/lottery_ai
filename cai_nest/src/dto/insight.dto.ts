import { IsString, IsArray } from 'class-validator';

export class InsightRequest {
  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[] = [];
}
