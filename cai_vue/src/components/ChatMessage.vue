<template>
  <article :class="['message', role]" :aria-label="ariaLabel">
    <!-- Avatar -->
    <div class="avatar" aria-hidden="true">
      <div v-if="role === 'assistant'" class="avatar-icon ai">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <div v-else-if="role === 'user'" class="avatar-icon user">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    </div>

    <!-- Bubble -->
    <div class="bubble">
      <!-- System/welcome message -->
      <div v-if="role === 'system'" class="system-content">
        <div class="content" v-html="renderedContent"/>
      </div>

      <!-- Chat messages -->
      <template v-else>
        <div class="content" v-html="renderedContent"/>
        <span v-if="isStreaming" class="stream-cursor" aria-hidden="true">|</span>
        <div v-if="!isStreaming && meta?.source" class="meta-footer">
          <span class="meta-source">{{ meta.source }}</span>
        </div>
      </template>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  html: false,
});

const props = defineProps<{
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta?: Record<string, any>;
  isStreaming?: boolean;
}>();

const ariaLabel = computed(() => {
  switch (props.role) {
    case 'user': return '你的消息';
    case 'assistant': return 'AI 回复';
    default: return '系统消息';
  }
});

const renderedContent = computed(() => {
  try {
    return md.render(props.content);
  } catch {
    return props.content;
  }
});
</script>

<style scoped>
.message {
  display: flex;
  gap: 14px;
  padding: 16px 0;
  align-items: flex-start;
  animation: messageIn 200ms ease;
}

@keyframes messageIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.message.user {
  flex-direction: row-reverse;
}

.message.system {
  justify-content: center;
  animation: none;
}

/* ========== Avatar ========== */
.avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.avatar-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon.ai {
  background: linear-gradient(135deg, #7C3AED, #06B6D4);
  color: #fff;
}

.avatar-icon.user {
  background: var(--color-border-light);
  color: var(--color-text-secondary);
}

/* ========== Bubble ========== */
.bubble {
  max-width: 70%;
  min-width: 0;
}

.message.user .bubble {
  background: var(--color-primary-soft);
  border-radius: var(--radius-lg) 4px var(--radius-lg) var(--radius-lg);
  padding: 12px 16px;
}

.message.assistant .bubble {
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-radius: 4px var(--radius-lg) var(--radius-lg) var(--radius-lg);
  padding: 12px 16px;
  box-shadow: var(--shadow-sm);
}

.message.system .bubble {
  max-width: 600px;
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  box-shadow: var(--shadow-sm);
  text-align: left;
}

/* ========== Content ========== */
.content {
  line-height: 1.65;
  word-break: break-word;
  font-size: 0.9375rem;
}

.content :deep(p) {
  margin: 0 0 8px;
}

.content :deep(p:last-child) {
  margin-bottom: 0;
}

.content :deep(ul),
.content :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

.content :deep(li) {
  margin-bottom: 4px;
}

.content :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
}

.content :deep(pre) {
  background: #1E1B4B;
  color: #DDD6FE;
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 10px 0;
  font-size: 0.875rem;
}

.content :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

.content :deep(table) {
  border-collapse: collapse;
  margin: 10px 0;
  width: 100%;
  font-size: 0.875rem;
}

.content :deep(th) {
  background: var(--color-primary-soft);
  color: var(--color-text);
  font-weight: 600;
  padding: 8px 12px;
  text-align: left;
}

.content :deep(td) {
  border-bottom: 1px solid var(--color-border-light);
  padding: 8px 12px;
}

.content :deep(blockquote) {
  border-left: 3px solid var(--color-primary-light);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--color-text-secondary);
}

.content :deep(strong) {
  font-weight: 600;
  color: var(--color-text);
}

/* ========== Meta ========== */
.meta-footer {
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border-light);
}

.meta-source {
  font-size: 11px;
  color: var(--color-text-muted);
  letter-spacing: 0.2px;
}

/* ========== Streaming Cursor ========== */
.stream-cursor {
  display: inline;
  color: var(--color-primary);
  font-weight: 700;
  animation: blink 0.7s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ========== Responsive ========== */
@media (max-width: 640px) {
  .bubble {
    max-width: 85%;
  }

  .message {
    gap: 8px;
    padding: 10px 0;
  }

  .avatar-icon {
    width: 30px;
    height: 30px;
  }

  .avatar-icon svg {
    width: 14px;
    height: 14px;
  }
}
</style>
