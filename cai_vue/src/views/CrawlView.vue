<template>
  <div class="crawl-view">
    <header class="page-header">
      <h1>数据爬取</h1>
      <p class="page-desc">从 500.com 爬取最新的双色球和大乐透开奖数据</p>
    </header>

    <div class="crawl-grid">
      <!-- SSQ Card -->
      <div class="crawl-card">
        <div class="card-header">
          <div class="card-icon ssq">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div>
            <h2>双色球 (SSQ)</h2>
            <p class="card-sub">红球 1-33 选 6 + 蓝球 1-16 选 1</p>
          </div>
        </div>

        <div class="card-body">
          <div class="form-group">
            <label for="ssq-count" class="form-label">爬取期数</label>
            <div class="count-control">
              <button
                class="count-btn"
                aria-label="减少"
                @click="ssqCount = Math.max(5, ssqCount - 5)"
                :disabled="ssqLoading"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <input
                id="ssq-count"
                v-model.number="ssqCount"
                type="number"
                class="count-input"
                :min="5"
                :max="200"
                :disabled="ssqLoading"
              />
              <button
                class="count-btn"
                aria-label="增加"
                @click="ssqCount = Math.min(200, ssqCount + 5)"
                :disabled="ssqLoading"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>

          <button
            class="crawl-button ssq-btn"
            :disabled="ssqLoading"
            @click="crawlSSQ"
          >
            <svg
              v-if="ssqLoading"
              class="spinner"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
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
              <polyline points="4 17 10 11 4 5"/>
              <line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
            {{ ssqLoading ? '爬取中...' : `爬取最近 ${ssqCount} 期` }}
          </button>

          <transition name="fade">
            <div v-if="ssqResult" class="result-card" :class="ssqResult.success ? 'success' : 'error'">
              <p>{{ ssqResult.message }}</p>
            </div>
          </transition>
        </div>
      </div>

      <!-- DLT Card -->
      <div class="crawl-card">
        <div class="card-header">
          <div class="card-icon dlt">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
              <path d="M2 12h20"/>
            </svg>
          </div>
          <div>
            <h2>大乐透 (DLT)</h2>
            <p class="card-sub">前区 1-35 选 5 + 后区 1-12 选 2</p>
          </div>
        </div>

        <div class="card-body">
          <div class="form-group">
            <label for="dlt-count" class="form-label">爬取期数</label>
            <div class="count-control">
              <button
                class="count-btn"
                aria-label="减少"
                @click="dltCount = Math.max(5, dltCount - 5)"
                :disabled="dltLoading"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <input
                id="dlt-count"
                v-model.number="dltCount"
                type="number"
                class="count-input"
                :min="5"
                :max="200"
                :disabled="dltLoading"
              />
              <button
                class="count-btn"
                aria-label="增加"
                @click="dltCount = Math.min(200, dltCount + 5)"
                :disabled="dltLoading"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>

          <button
            class="crawl-button dlt-btn"
            :disabled="dltLoading"
            @click="crawlDLT"
          >
            <svg
              v-if="dltLoading"
              class="spinner"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
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
              <polyline points="4 17 10 11 4 5"/>
              <line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
            {{ dltLoading ? '爬取中...' : `爬取最近 ${dltCount} 期` }}
          </button>

          <transition name="fade">
            <div v-if="dltResult" class="result-card" :class="dltResult.success ? 'success' : 'error'">
              <p>{{ dltResult.message }}</p>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useApi } from '@/composables/useApi';

const { crawl } = useApi();

const ssqCount = ref(30);
const dltCount = ref(30);
const ssqLoading = ref(false);
const dltLoading = ref(false);
const ssqResult = ref<any>(null);
const dltResult = ref<any>(null);

async function crawlSSQ() {
  ssqLoading.value = true;
  ssqResult.value = null;
  try {
    ssqResult.value = await crawl('ssq', ssqCount.value);
  } catch (e: any) {
    ssqResult.value = { success: false, message: `爬取失败: ${e.message}` };
  } finally {
    ssqLoading.value = false;
  }
}

async function crawlDLT() {
  dltLoading.value = true;
  dltResult.value = null;
  try {
    dltResult.value = await crawl('dlt', dltCount.value);
  } catch (e: any) {
    dltResult.value = { success: false, message: `爬取失败: ${e.message}` };
  } finally {
    dltLoading.value = false;
  }
}
</script>

<style scoped>
.crawl-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 28px 32px;
}

.page-header {
  margin-bottom: 24px;
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

/* ========== Grid ========== */
.crawl-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.crawl-card {
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow var(--transition-fast);
}

.crawl-card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px 16px;
}

.card-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.card-sub {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 2px 0 0;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon.ssq {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.card-icon.dlt {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}

.card-body {
  padding: 0 24px 20px;
}

/* ========== Form ========== */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.count-control {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  width: fit-content;
}

.count-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.count-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.count-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.count-input {
  width: 72px;
  height: 44px;
  border: none;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  text-align: center;
  font-family: var(--font-family);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  background: var(--color-bg-white);
  outline: none;
  -moz-appearance: textfield;
}

.count-input::-webkit-outer-spin-button,
.count-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* ========== Button ========== */
.crawl-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 13px 20px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 48px;
}

.crawl-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.crawl-button:active:not(:disabled) {
  transform: translateY(0);
}

.crawl-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.crawl-button.ssq-btn {
  background: linear-gradient(135deg, #EF4444, #DC2626);
}

.crawl-button.dlt-btn {
  background: linear-gradient(135deg, #3B82F6, #2563EB);
}

/* ========== Result ========== */
.result-card {
  margin-top: 14px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
}

.result-card.success {
  background: rgba(16, 185, 129, 0.08);
  color: #065F46;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.result-card.error {
  background: rgba(239, 68, 68, 0.08);
  color: #991B1B;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.result-card p {
  margin: 0;
}

/* ========== Spinner ========== */
.spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .crawl-view {
    padding: 20px 16px;
  }

  .crawl-grid {
    grid-template-columns: 1fr;
  }
}
</style>
