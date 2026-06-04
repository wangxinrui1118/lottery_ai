<template>
  <div class="stats-panel">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>概述</template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="总期数">{{ stats?.total_draws || 0 }}</el-descriptions-item>
            <el-descriptions-item label="数据范围">
              {{ stats?.date_range?.start || '-' }} ~ {{ stats?.date_range?.end || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="12" v-if="freqData.length">
        <el-card shadow="hover">
          <template #header>{{ freqLabel }}频次 Top 10</template>
          <div class="freq-list">
            <div
              v-for="(item, i) in freqData.slice(0, 10)"
              :key="i"
              class="freq-item"
            >
              <span class="ball" :style="{ background: getBallColor(item.ball) }">
                {{ String(item.ball).padStart(2, '0') }}
              </span>
              <el-progress
                :percentage="item.percent"
                :stroke-width="12"
                :show-text="false"
                style="flex: 1; margin: 0 12px"
              />
              <span class="count">{{ item.count }}次</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Statistics } from '@/types';

const props = defineProps<{
  stats: Statistics | null;
  lottoType: 'ssq' | 'dlt';
}>();

const freqLabel = computed(() =>
  props.lottoType === 'ssq' ? '红球' : '前区'
);

const freqData = computed(() => {
  const freq =
    props.lottoType === 'ssq'
      ? props.stats?.red_frequency
      : props.stats?.front_frequency;
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

function getBallColor(ball: number): string {
  if (ball <= 11) return '#e74c3c';
  if (ball <= 22) return '#3498db';
  return '#2ecc71';
}
</script>

<style scoped>
.freq-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.ball {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 13px;
  flex-shrink: 0;
}

.count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 36px;
  text-align: right;
}
</style>
