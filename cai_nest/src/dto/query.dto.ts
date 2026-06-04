import { IsString } from 'class-validator';

export class QueryRequest {
  @IsString()
  query: string;
}
