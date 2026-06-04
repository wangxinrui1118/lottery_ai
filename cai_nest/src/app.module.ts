import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { CrawlerModule } from './crawler/crawler.module';
import { LLMModule } from './llm/llm.module';
import { MemoryModule } from './memory/memory.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    CrawlerModule,
    LLMModule,
    MemoryModule,
    AgentModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
