import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — 允许前端跨域
  app.enableCors({
    origin: '*',
    credentials: true,
    methods: '*',
    allowedHeaders: '*',
  });

  // 请求验证
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = app.get(ConfigService);
  const host = config.get<string>('api.host') || '0.0.0.0';
  const port = config.get<number>('api.port') || 8000;

  await app.listen(port, host);

  console.log(`
╔══════════════════════════════════════════╗
║   🎱 彩票 AI 智能体系统 (NestJS)          ║
║   地址: http://${host}:${port}                ║
║   API:  http://${host}:${port}/query          ║
╚══════════════════════════════════════════╝
  `);
}
bootstrap();
