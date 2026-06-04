<template>
  <div class="stats-view">
    <header class="page-header">
      <h1>数据统计</h1>
      <p class="page-desc">双色球 & 大乐透历史开奖数据分析</p>
    </header>

    <!-- Tabs -->
    <div class="tab-bar" role="tablist" aria-label="彩票类型">
      <button
        role="tab"
        :aria-selected="lottoType === 'ssq'"
        :class="['tab', { active: lottoType === 'ssq' }]"
        @click="switchTab('ssq')"
      >
        双色球 SSQ
      </button>
      <button
        role="tab"
        :aria-selected="lottoType === 'dlt'"
        :class="['tab', { active: lottoType === 'dlt' }]"
        @click="switchTab('dlt')"
      >
        大乐透 DLT
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-area" role="status" aria-label="加载中">
      <div class="skeleton-card" v-for="n in 2" :key="n">
        <div class="skeleton-line w-60"/>
        <div class="skeleton-line w-80"/>
        <div class="skeleton-line w-40"/>
      </div>
    </div>

    <!-- Overview Cards -->
    <template v-else-if="stats">
      <div class="overview-cards">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_draws?.toLocaleString() || 0 }}</div>
          <div class="stat-label">总期数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ dateRangeText }}</div>
          <div class="stat-label">数据范围</div>
        </div>
        <div class="stat-card accent">
          <div class="stat-value">{{ hotBalls.slice(0, 3).map(b => String(b.ball).padStart(2, '0')).join(' ') }}</div>
          <div class="stat-label">{{ freqLabel }}高频 Top 3</div>
        </div>
      </div>

      <!-- Frequency Charts -->
      <div class="section">
        <h2>{{ freqLabel }}出现频次</h2>
        <div class="freq-chart">
          <div
            v-for="item in freqData.slice(0, 15)"
            :key="item.ball"
            class="freq-bar-wrap"
          >
            <div class="freq-ball" :style="{ background: ballColor(item.ball) }" :aria-label="`${freqLabel} ${item.ball}`">
              {{ String(item.ball).padStart(2, '0') }}
            </div>
            <div class="freq-bar-track">
              <div
                class="freq-bar-fill"
                :style="{ width: `${item.percent}%` }"
              />
            </div>
            <span class="freq-count">{{ item.count }}次</span>
          </div>
        </div>
      </div>

      <!-- Secondary Freq -->
      <div v-if="secondaryFreq.length" class="section">
        <h2>{{ secondaryLabel }}出现频次</h2>
        <div class="secondary-grid">
          <div
            v-for="item in secondaryFreq"
            :key="item.ball"
            class="secondary-chip"
            :class="{ hot: item.count > secondaryAvg }"
          >
            <span class="chip-ball" :style="{ background: item.count > secondaryAvg ? '#EF4444' : '#6366F1' }">
              {{ String(item.ball).padStart(2, '0') }}
            </span>
            <span class="chip-count">{{ item.count }}次</span>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>暂无统计数据，请先爬取数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import type { Statistics } from '@/types';

const { getStats } = useApi();

const lottoType = ref<'ssq' | 'dlt'>('ssq');
const stats = ref<Statistics | null>(null);
const loading = ref(false);

const freqLabel = computed(() => (lottoType.value === 'ssq' ? '红球' : '前区'));
const secondaryLabel = computed(() => (lottoType.value === 'ssq' ? '蓝球' : '后区'));

const dateRangeText = computed(() => {
  if (!stats.value) return '-';
  const { start, end } = stats.value.date_range;
  return start && end ? `${start} ~ ${end}` : '-';
});

const freqData = computed(() => {
  const freq =
    lottoType.value === 'ssq'
      ? stats.value?.red_frequency
      : stats.value?.front_frequency;
  if (!freq) return [];
  const maxCount = Math.max(...Object.values(freq).map(Number));
  return Object.entries(freq)
    .map(([ball, count]) => ({
      ball: Number(ball),
      count: Number(count),
      percent: Math.round((Number(count) / maxCount) * 100),
    }))
    .sort((a, b) => b.count - a.count);
});

const hotBalls = computed(() => freqData.value.slice(0, 5));

const secondaryFreq = computed(() => {
  const freq =
    lottoType.value === 'ssq'
      ? stats.value?.blue_frequency
      : stats.value?.back_frequency;
  if (!freq) return [];
  return Object.entries(freq)
    .map(([ball, count]) => ({ ball: Number(ball), count: Number(count) }))
    .sort((a, b) => b.count - a.count);
});

const secondaryAvg = computed(() => {
  if (!secondaryFreq.value.length) return 0;
  return secondaryFreq.value.reduce((s, i) => s + i.count, 0) / secondaryFreq.value.length;
});

function ballColor(ball: number): string {
  if (ball <= 11) return '#EF4444';
  if (ball <= 22) return '#3B82F6';
  return '#10B981';
}

async function switchTab(type: 'ssq' | 'dlt') {
  lottoType.value = type;
  await loadStats();
}

async function loadStats() {
  loading.value = true;
  try {
    const data = await getStats(lottoType.value);
    stats.value = data.statistics;
  } catch {
    stats.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(loadStats);
</script>

<style scoped>
.stats-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 28px 32px;
}

/* ========== Header ========== */
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

/* ========== Overview Cards ========== */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 20px 24px;
  box-shadow: var(--shadow-sm);
}

.stat-card.accent {
  background: var(--color-primary-soft);
  border-color: var(--color-primary-border);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* ========== Sections ========== */
.section {
  margin-bottom: 28px;
}

.section h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text);
}

/* ========== Frequency Chart ========== */
.freq-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.freq-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.freq-ball {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.freq-bar-track {
  flex: 1;
  height: 10px;
  background: var(--color-border-light);
  border-radius: 5px;
  overflow: hidden;
}

.freq-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-cta));
  border-radius: 5px;
  transition: width 400ms ease;
  min-width: 2px;
}

.freq-count {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 40px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ========== Secondary Grid ========== */
.secondary-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.secondary-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-radius: 24px;
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.secondary-chip.hot {
  border-color: #FECACA;
  background: #FEF2F2;
}

.chip-ball {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
}

.chip-count {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* ========== Skeleton ========== */
.skeleton-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: 24px;
  margin-bottom: 12px;
}

.skeleton-line {
  height: 14px;
  background: var(--color-border-light);
  border-radius: 7px;
  margin-bottom: 10px;
  animation: shimmer 1.5s infinite;
}

.skeleton-line:last-child { margin-bottom: 0; }

.w-60 { width: 60%; }
.w-80 { width: 80%; }
.w-40 { width: 40%; }

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
  .stats-view {
    padding: 20px 16px;
  }

  .overview-cards {
    grid-template-columns: 1fr;
  }

  .tab-bar {
    flex-direction: column;
  }
}
</style>
