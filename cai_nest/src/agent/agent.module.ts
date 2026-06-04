import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { DatabaseModule } from '../database/database.module';
import { MemoryModule } from '../memory/memory.module';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [DatabaseModule, MemoryModule, LLMModule],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
