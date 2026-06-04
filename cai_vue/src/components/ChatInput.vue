<template>
  <div class="chat-input-area">
    <!-- Example suggestions -->
    <div class="suggestions" v-if="examples.length">
      <button
        v-for="(ex, i) in examples"
        :key="i"
        class="suggestion-chip"
        @click="$emit('send', ex)"
        :aria-label="`试试: ${ex}`"
      >
        {{ ex }}
      </button>
    </div>

    <!-- Input row -->
    <div class="input-row">
      <label for="chat-input" class="sr-only">输入问题</label>
      <div class="input-wrapper">
        <input
          id="chat-input"
          ref="inputEl"
          v-model="text"
          type="text"
          class="chat-text-input"
          placeholder="输入你的问题，例如「红球08在最近30期出现多少次」"
          :disabled="loading"
          autocomplete="off"
          spellcheck="false"
          @keydown.enter="handleSend"
        />
        <button
          class="send-button"
          :disabled="loading || !text.trim()"
          :aria-label="loading ? '思考中...' : '发送消息'"
          @click="handleSend"
        >
          <!-- Loading spinner -->
          <svg
            v-if="loading"
            class="spinner"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <!-- Send icon -->
          <svg
            v-else
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

defineProps<{ loading: boolean }>();
const emit = defineEmits<{ send: [text: string] }>();

const text = ref('');
const inputEl = ref<HTMLInputElement>();

const examples = [
  '红球08在最近30期出现多少次',
  '双色球有哪些选号策略',
  '大乐透前区高频号有哪些',
  '分析最近10期双色球奇偶分布',
  '记忆中有什么有趣的规律',
];

function handleSend() {
  const value = text.value.trim();
  if (!value) return;
  emit('send', value);
  text.value = '';
  nextTick(() => inputEl.value?.focus());
}
</script>

<style scoped>
.chat-input-area {
  padding: 16px 24px 24px;
  background: linear-gradient(to top, var(--color-bg-white), transparent);
  flex-shrink: 0;
}

/* ========== Suggestions ========== */
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.suggestion-chip {
  padding: 6px 14px;
  font-size: 13px;
  font-family: var(--font-family);
  color: var(--color-text-secondary);
  background: var(--color-bg-white);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  min-height: 36px;
}

.suggestion-chip:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-light);
  background: var(--color-primary-soft);
  transform: translateY(-1px);
}

.suggestion-chip:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ========== Input Row ========== */
.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--color-bg-white);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  overflow: hidden;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.chat-text-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 13px 16px;
  font-size: 0.9375rem;
  font-family: var(--font-family);
  color: var(--color-text);
  background: transparent;
  min-width: 0;
}

.chat-text-input::placeholder {
  color: var(--color-text-muted);
}

.chat-text-input:disabled {
  opacity: 0.6;
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: 4px;
  border: none;
  border-radius: 10px;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.send-button:hover:not(:disabled) {
  background: #6D28D9;
  transform: scale(1.04);
}

.send-button:active:not(:disabled) {
  transform: scale(0.97);
}

.send-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ========== Spinner ========== */
.spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== Responsive ========== */
@media (max-width: 640px) {
  .chat-input-area {
    padding: 12px 12px 16px;
  }

  .suggestion-chip {
    font-size: 12px;
    padding: 5px 10px;
    min-height: 32px;
  }

  .chat-text-input {
    font-size: 1rem;
    padding: 11px 12px;
  }
}
</style>
