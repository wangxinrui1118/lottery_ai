<template>
  <div class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar" aria-label="主导航">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">彩票 AI 助手</span>
          <span class="brand-sub">SSQ & DLT Analysis</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">
          <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="nav-label">智能对话</span>
        </router-link>

        <router-link to="/stats" class="nav-item" :class="{ active: route.path === '/stats' }">
          <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          <span class="nav-label">数据统计</span>
        </router-link>

        <router-link to="/memory" class="nav-item" :class="{ active: route.path === '/memory' }">
          <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span class="nav-label">记忆管理</span>
        </router-link>

        <router-link to="/crawl" class="nav-item" :class="{ active: route.path === '/crawl' }">
          <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 16 12 12 8 16"/>
            <line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            <polyline points="16 16 12 12 8 16"/>
          </svg>
          <span class="nav-label">数据爬取</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="status-dot" :class="{ online: systemOnline }" aria-hidden="true"/>
        <span class="status-text">{{ systemOnline ? '系统就绪' : '未连接' }}</span>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <router-view v-slot="{ Component: ViewComponent }">
        <transition name="page-fade" mode="out-in">
          <component :is="ViewComponent" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';

const route = useRoute();
const { getSystemInfo } = useApi();
const systemOnline = ref(false);

onMounted(async () => {
  try {
    await getSystemInfo();
    systemOnline.value = true;
  } catch {
    systemOnline.value = false;
  }
});
</script>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ========== Sidebar ========== */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-bg-white);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  padding: 0;
  z-index: 10;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 24px;
  border-bottom: 1px solid var(--color-border-light);
}

.brand-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.2px;
}

.brand-sub {
  font-size: 11px;
  color: var(--color-text-muted);
  letter-spacing: 0.3px;
}

/* ========== Navigation ========== */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-fast);
  cursor: pointer;
  min-height: 44px;
}

.nav-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.nav-item.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.nav-item.active .nav-icon {
  stroke: var(--color-primary);
}

.nav-icon {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity var(--transition-fast);
}

.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  opacity: 1;
}

/* ========== Footer ========== */
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border-light);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #EF4444;
  flex-shrink: 0;
  transition: background var(--transition-normal);
}

.status-dot.online {
  background: #10B981;
}

.status-text {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ========== Main ========== */
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-bg);
}

/* ========== Page Transition ========== */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }

  .brand-text,
  .nav-label,
  .status-text,
  .brand-sub {
    display: none;
  }

  .sidebar-brand {
    justify-content: center;
    padding: 16px 8px;
  }

  .nav-item {
    justify-content: center;
    padding: 12px;
  }
}
</style>
