/**
 * LLM 服务 — 对应 ssq_python/llm.py (LLMClient)
 * OpenAI 兼容协议客户端，连接 Ollama
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class LLMService implements OnModuleInit {
  private readonly logger = new Logger(LLMService.name);
  private client: OpenAI;
  private model: string;
  private maxTokens: number;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const baseURL = this.config.get<string>('llm.baseUrl');
    this.model = this.config.get<string>('llm.model');
    this.maxTokens = this.config.get<number>('llm.maxTokens');

    this.client = new OpenAI({
      baseURL,
      apiKey: 'ollama', // Ollama 不需要真实 API key
    });

    this.logger.log(`LLM 客户端初始化: ${baseURL} model=${this.model}`);
  }

  /**
   * 发送对话请求，返回模型回复
   */
  async chat(
    systemPrompt: string,
    userMessage: string,
    temperature: number = 0.7,
  ): Promise<string> {
    try {
      const resp = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: this.maxTokens,
      });
      return resp.choices[0]?.message?.content?.trim() || '';
    } catch (e) {
      this.logger.error(`LLM 调用失败: ${e}`);
      return '';
    }
  }

  /**
   * 流式对话 — 返回 async iterable，每次产出 delta 文本
   */
  async *chatStream(
    systemPrompt: string,
    userMessage: string,
    temperature: number = 0.7,
  ): AsyncGenerator<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: this.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      }
    } catch (e) {
      this.logger.error(`LLM 流式调用失败: ${e}`);
      yield '';
    }
  }
}
