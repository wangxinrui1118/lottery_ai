<template>
  <div class="memory-view">
    <header class="page-header">
      <h1>记忆管理</h1>
      <p class="page-desc">ManasDB AI 记忆时间线与冲突检测</p>
    </header>

    <!-- Tabs -->
    <div class="tab-bar" role="tablist">
      <button
        role="tab"
        :aria-selected="activeTab === 'timeline'"
        :class="['tab', { active: activeTab === 'timeline' }]"
        @click="activeTab = 'timeline'"
      >
        记忆时间线
      </button>
      <button
        role="tab"
        :aria-selected="activeTab === 'conflicts'"
        :class="['tab', { active: activeTab === 'conflicts' }]"
        @click="activeTab = 'conflicts'"
      >
        记忆矛盾
        <span v-if="conflicts.length" class="badge">{{ conflicts.length }}</span>
      </button>
    </div>

    <!-- Timeline Tab -->
    <div v-if="activeTab === 'timeline'" role="tabpanel" aria-label="记忆时间线">
      <div v-if="tlLoading" class="skeleton-list">
        <div class="skeleton-item" v-for="n in 4" :key="n">
          <div class="skeleton-line w-30"/>
          <div class="skeleton-line w-80"/>
          <div class="skeleton-line w-50"/>
        </div>
      </div>

      <div v-else-if="timeline.length" class="timeline">
        <div v-for="item in timeline" :key="item.id" class="tl-card">
          <div class="tl-header">
            <span class="tl-kind" :class="item.kind === 'auto_analysis' ? 'auto' : 'manual'">
              {{ item.kind === 'auto_analysis' ? '自动分析' : item.kind }}
            </span>
            <time class="tl-time" :datetime="item.created_at">
              {{ formatDate(item.created_at) }}
            </time>
          </div>
          <p class="tl-content">{{ item.content.slice(0, 400) }}</p>
          <div class="tl-footer">
            <span class="tl-access">访问 {{ item.access_count }} 次</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>暂无记忆记录，爬取数据后将自动生成分析记忆</p>
      </div>
    </div>

    <!-- Conflicts Tab -->
    <div v-if="activeTab === 'conflicts'" role="tabpanel" aria-label="记忆矛盾">
      <div v-if="confLoading" class="skeleton-list">
        <div class="skeleton-item" v-for="n in 2" :key="n">
          <div class="skeleton-line w-20"/>
          <div class="skeleton-line w-90"/>
        </div>
      </div>

      <div v-else-if="conflicts.length === 0" class="success-card">
        <div class="success-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <p class="success-text">未检测到记忆矛盾，所有记忆保持一致</p>
      </div>

      <div v-else class="conflict-list">
        <div v-for="(c, i) in conflicts" :key="i" class="conflict-card">
          <div class="conflict-header">
            <span class="conflict-label">矛盾 {{ i + 1 }}</span>
            <span class="conflict-similarity">相似度 {{ (c.similarity * 100).toFixed(0) }}%</span>
          </div>
          <div class="conflict-pair">
            <div class="conflict-side">
              <div class="conflict-side-label">记忆 A</div>
              <p>{{ c.memory_a.slice(0, 250) }}</p>
            </div>
            <div class="conflict-divider"/>
            <div class="conflict-side">
              <div class="conflict-side-label">记忆 B</div>
              <p>{{ c.memory_b.slice(0, 250) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import type { TimelineEntry, Conflict } from '@/types';

const { getMemoryTimeline, getMemoryConflicts } = useApi();

const activeTab = ref<'timeline' | 'conflicts'>('timeline');
const timeline = ref<TimelineEntry[]>([]);
const conflicts = ref<Conflict[]>([]);
const tlLoading = ref(false);
const confLoading = ref(false);

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

onMounted(async () => {
  tlLoading.value = true;
  try {
    const data = await getMemoryTimeline();
    timeline.value = data.timeline || [];
  } catch { /* */ }
  tlLoading.value = false;

  confLoading.value = true;
  try {
    const data = await getMemoryConflicts();
    conflicts.value = data.conflicts || [];
  } catch { /* */ }
  confLoading.value = false;
});
</script>

<style scoped>
.memory-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 28px 32px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 4px;
}

.page-desc {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  margin: 0;
}

/* ========== Tabs ========== */
.tab-bar {
  display: flex;
  gap: 0;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 4px;
  margin-bottom: 24px;
  border: 1px solid var(--color-border-light);
}

.tab {
  flex: 1;
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-family: var(--font-family);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab:hover {
  color: var(--color-text);
  background: var(--color-bg-hover);
}

.tab.active {
  background: var(--color-bg-white);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.badge {
  background: #EF4444;
  color: #fff;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 10px;
  font-weight: 600;
}

/* ========== Timeline ========== */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tl-card {
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
  cursor: pointer;
}

.tl-card:hover {
  box-shadow: var(--shadow-md);
}

.tl-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tl-kind {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  letter-spacing: 0.3px;
}

.tl-kind.auto {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.tl-kind.manual {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.tl-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.tl-content {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.tl-footer {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ========== Conflicts ========== */
.success-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-md);
  padding: 20px 24px;
}

.success-icon {
  color: #10B981;
  flex-shrink: 0;
}

.success-text {
  color: #065F46;
  font-weight: 500;
  margin: 0;
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.conflict-card {
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
}

.conflict-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.conflict-label {
  font-weight: 600;
  font-size: 0.9375rem;
}

.conflict-similarity {
  font-size: 0.8125rem;
  color: #EF4444;
  font-weight: 500;
}

.conflict-pair {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  gap: 16px;
}

.conflict-divider {
  background: var(--color-border-light);
  width: 1px;
}

.conflict-side-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.conflict-side p {
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
  margin: 0;
  word-break: break-word;
}

/* ========== Skeleton ========== */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-item {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: 24px;
}

.skeleton-line {
  height: 14px;
  background: var(--color-border-light);
  border-radius: 7px;
  margin-bottom: 10px;
  animation: shimmer 1.5s infinite;
}

.skeleton-line:last-child { margin-bottom: 0; }

.w-30 { width: 30%; }
.w-20 { width: 20%; }
.w-50 { width: 50%; }
.w-80 { width: 80%; }
.w-90 { width: 90%; }

@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

/* ========== Empty ========== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-muted);
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .memory-view {
    padding: 20px 16px;
  }

  .conflict-pair {
    grid-template-columns: 1fr;
  }

  .conflict-divider {
    width: 100%;
    height: 1px;
  }
}
</style>
