<template>
  <div class="tools-container">
    <!-- Page Header -->
    <header class="page-header animate-fade-in-down">
      <h1>工具箱</h1>
      <p>发现更多生活便利</p>
    </header>

    <!-- Family Tools Section -->
    <section class="tools-section animate-fade-in-up">
      <div class="section-header">
        <div class="header-left">
          <Icon icon="ph:house-line-bold" class="header-icon" />
          <h2>家庭工具</h2>
        </div>
        <span class="subtitle">共享美好生活</span>
      </div>
      
      <div class="tools-grid-wrapper">
        <div 
          v-for="(tool, index) in familyTools" 
          :key="tool.name" 
          class="tool-card"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="handleToolClick(tool)"
        >
          <div class="tool-icon-box" :style="{ background: tool.bgGradient }">
            <Icon :icon="tool.icon" class="tool-icon" :style="{ color: tool.iconColor }" />
          </div>
          <span class="tool-name">{{ tool.name }}</span>
        </div>
      </div>
    </section>

    <!-- Personal Tools Section -->
    <section class="tools-section animate-fade-in-up delay-2">
      <div class="personal-tools-card">
        <div class="card-header">
          <div class="header-content">
            <div class="header-title">
              <Icon icon="ph:lock-key-fill" class="lock-icon" />
              <h2>个人工具</h2>
            </div>
            <span class="privacy-badge">
              <Icon icon="ph:shield-check-fill" />
              数据隔离
            </span>
          </div>
          <p class="card-desc">私密空间，仅自己可见</p>
        </div>

        <div class="personal-grid">
          <div 
            v-for="tool in personalTools" 
            :key="tool.name" 
            class="personal-tool-item"
            @click="handleToolClick(tool)"
          >
            <div class="personal-icon-box">
              <Icon :icon="tool.icon" width="24" height="24" />
            </div>
            <span class="personal-tool-name">{{ tool.name }}</span>
            <Icon icon="ph:caret-right-bold" class="arrow-icon" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useMessageStore } from '../app/store/message';
import { useRouter } from 'vue-router';

const msg = useMessageStore();
const router = useRouter();

interface ToolItem {
  name: string;
  icon: string;
  iconColor: string;
  bgGradient: string;
  path?: string;
}

const familyTools: ToolItem[] = [
  { name: '家庭菜单', icon: 'ph:cooking-pot-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #FF9500 0%, #FFB340 100%)', path: '/menu' },
  { name: '日程安排', icon: 'ph:calendar-blank-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #FF2D55 0%, #FF5E7D 100%)', path: '/admin/schedule' },
  { name: '待办事项', icon: 'ph:check-circle-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)' },
  { name: '家庭相册', icon: 'ph:image-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #30B0C7 0%, #4AD0E8 100%)' },
  { name: '健康档案', icon: 'ph:heartbeat-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #34C759 0%, #5DD97B 100%)' },
  { name: '月度支出', icon: 'ph:coins-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #FF3B30 0%, #FF6B63 100%)' },
  { name: '采购清单', icon: 'ph:shopping-cart-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #5856D6 0%, #7A78FF 100%)' },
  { name: '心愿清单', icon: 'ph:gift-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #FF6491 0%, #FF8D72 100%)' },
  { name: '种草清单', icon: 'ph:plant-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #00B894 0%, #55EFC4 100%)', path: '/wishlist' },
  { name: '更多工具', icon: 'ph:squares-four-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #8E8E93 0%, #B0B0B5 100%)' },
];

const personalTools: ToolItem[] = [
  { name: '密码助手', icon: 'ph:password-bold', iconColor: '#AF52DE', bgGradient: 'rgba(175,82,222,0.1)', path: '/password' },
  { name: '常用电话', icon: 'ph:address-book-bold', iconColor: '#00C7BE', bgGradient: 'rgba(0,199,190,0.1)' },
];

function handleToolClick(tool: ToolItem) {
  if (tool.path) {
    router.push(tool.path);
  } else {
    msg.show(`${tool.name} 模块开发中...`, 'warning');
  }
}
</script>

<style scoped>
.tools-container {
  padding: 24px 20px 100px;
  min-height: 100vh;
  background-color: var(--bg);
  background-image: 
    radial-gradient(circle at 100% 0%, rgba(0,122,255,0.05) 0%, transparent 20%),
    radial-gradient(circle at 0% 100%, rgba(255,45,85,0.05) 0%, transparent 20%);
}

/* Header */
.page-header {
  margin-bottom: 32px;
  padding-top: 12px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 8px;
  background: linear-gradient(120deg, var(--fg) 0%, var(--placeholder) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

.page-header p {
  font-size: 14px;
  color: var(--placeholder);
  margin: 0;
}

/* Section Common */
.tools-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
  color: var(--accent);
}

.section-header h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--fg);
}

.subtitle {
  font-size: 12px;
  color: var(--placeholder);
  font-weight: 500;
}

/* Family Tools Grid */
.tools-grid-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 12px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  animation: fadeInUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
}

.tool-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(0,0,0,0.08);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
}

.tool-icon {
  font-size: 26px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.tool-card:active .tool-icon-box {
  transform: scale(0.9);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.tool-name {
  font-size: 12px;
  color: var(--fg);
  font-weight: 500;
  text-align: center;
  opacity: 0.9;
}

/* Personal Tools Card */
.personal-tools-card {
  background: var(--surface);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}

.personal-tools-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #AF52DE, #00C7BE);
}

.card-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--fg);
}

.lock-icon {
  color: #AF52DE;
  font-size: 20px;
}

.card-desc {
  font-size: 13px;
  color: var(--placeholder);
  margin: 0;
  padding-left: 28px;
}

.privacy-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(175,82,222,0.1);
  color: #AF52DE;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.personal-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.personal-tool-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--surface-2);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.personal-tool-item:active {
  transform: scale(0.98);
  background: var(--border);
}

.personal-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.personal-tool-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--fg);
}

.arrow-icon {
  color: var(--placeholder);
  font-size: 16px;
}

/* Animations */
.animate-fade-in-down {
  animation: fadeInDown 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
}

.delay-2 { animation-delay: 0.2s; }

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
