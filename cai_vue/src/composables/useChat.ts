/**
 * 聊天逻辑 — SSE 流式输出
 */
import { ref } from 'vue';
import { useApi } from './useApi';
import type { ChatMessage } from '../types';

const WELCOME_MESSAGE = `👋 你好！我是彩票 AI 助手。

**数据源**: MySQL 历史开奖 + MySQL Memory AI 记忆
**模型**: Ollama (qwen2.5:7b)

可以问我：
- 📊 数据查询 — 「红球08出现几次」「大乐透最近10期」
- 🧠 智能分析 — 「有什么选号策略」「分析红球走势」
- 🔍 记忆搜索 — 「记忆中有什么规律」

试试输入你的问题吧 👇`;

export function useChat() {
  const { queryStream } = useApi();
  const messages = ref<ChatMessage[]>([
    { role: 'system', content: WELCOME_MESSAGE },
  ]);
  const loading = ref(false);
  /** 当前正在流式输出的消息索引（-1 表示无） */
  const streamingIndex = ref(-1);

  async function send(text: string) {
    if (!text.trim() || loading.value) return;

    messages.value.push({ role: 'user', content: text });
    // 占位消息，内容逐步填充
    messages.value.push({ role: 'assistant', content: '' });
    streamingIndex.value = messages.value.length - 1;
    loading.value = true;

    await queryStream(text, {
      onMeta(meta) {
        if (streamingIndex.value >= 0) {
          messages.value[streamingIndex.value].meta = meta;
        }
      },
      onToken(token) {
        if (streamingIndex.value >= 0) {
          messages.value[streamingIndex.value].content += token;
        }
      },
      onDone(result) {
        if (streamingIndex.value >= 0) {
          messages.value[streamingIndex.value].meta = result;
        }
        streamingIndex.value = -1;
        loading.value = false;
      },
      onError(err) {
        if (streamingIndex.value >= 0) {
          const current =
            messages.value[streamingIndex.value].content;
          messages.value[streamingIndex.value].content =
            current + `\n\n❌ 出错了: ${err}`;
        }
        streamingIndex.value = -1;
        loading.value = false;
      },
    });
  }

  function clear() {
    messages.value = [{ role: 'system', content: WELCOME_MESSAGE }];
    streamingIndex.value = -1;
    loading.value = false;
  }

  return { messages, loading, streamingIndex, send, clear };
}
