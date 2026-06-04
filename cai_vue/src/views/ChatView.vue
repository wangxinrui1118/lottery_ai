<template>
  <div class="chat-view">
    <!-- Messages -->
    <div class="chat-messages" ref="msgContainer" @scroll="onScroll">
      <ChatMessage
        v-for="(msg, i) in chat.messages.value"
        :key="i"
        :role="msg.role"
        :content="msg.content"
        :meta="msg.meta"
        :is-streaming="i === chat.streamingIndex.value"
      />

      <!-- Typing indicator -->
      <div v-if="chat.loading.value" class="typing-indicator" aria-live="polite" aria-label="AI 正在思考">
        <span class="dot"/>
        <span class="dot"/>
        <span class="dot"/>
        <span class="typing-text">思考中...</span>
      </div>
    </div>

    <!-- Input -->
    <ChatInput
      :loading="chat.loading.value"
      @send="(text: string) => chat.send(text)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import ChatMessage from '@/components/ChatMessage.vue';
import ChatInput from '@/components/ChatInput.vue';
import { useChat } from '@/composables/useChat';

const chat = useChat();
const msgContainer = ref<HTMLElement>();

// Track scroll position — only auto-scroll when user is near bottom AND a NEW user/assistant message appears
const isNearBottom = ref(true);
let prevLen = chat.messages.value.length; // start at current count, skip initial mount

function onScroll() {
  if (!msgContainer.value) return;
  const el = msgContainer.value;
  isNearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
}

watch(
  () => chat.messages.value.length,
  async (newLen) => {
    await nextTick();
    // Only scroll when new messages are ADDED (skip initial render)
    if (newLen > prevLen && isNearBottom.value) {
      msgContainer.value?.scrollTo({
        top: msgContainer.value.scrollHeight,
        behavior: 'smooth',
      });
    }
    prevLen = newLen;
  },
);
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 860px;
  margin: 0 auto;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-anchor: none;
  padding: 20px 24px;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px 0 12px 50px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary-light);
  animation: dotPulse 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0s; }

@keyframes dotPulse {
  0%, 80%, 100% { transform: scale(0.5); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.typing-text {
  margin-left: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .chat-messages {
    padding: 12px 12px;
  }
}
</style>
