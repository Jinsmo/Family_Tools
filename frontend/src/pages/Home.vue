<template>
  <div class="home-container">
    <!-- Header Section -->
    <header class="header animate-fade-in-down">
      <div class="user-info">
        <h1 class="greeting">
          {{ greetingText }}, <span class="highlight">{{ userNickname }}</span>
          <span class="wave">👋</span>
        </h1>
        <p class="subtitle">欢迎回到 FM Tools</p>
      </div>
      <div class="header-action">
        <div class="avatar-placeholder">
          <Icon icon="ph:user-circle-fill" width="40" height="40" />
        </div>
      </div>
    </header>

    <!-- Banner Section -->
    <section class="banner-section animate-fade-in-up delay-1">
      <van-swipe class="banner-swipe" :autoplay="4000" indicator-color="white">
        <van-swipe-item v-for="(banner, index) in banners" :key="index">
          <div class="banner-card" :style="{ background: banner.gradient }">
            <div class="banner-content">
              <h3>{{ banner.title }}</h3>
              <p>{{ banner.desc }}</p>
              <button class="banner-btn">查看详情</button>
            </div>
            <div class="banner-icon-bg">
              <Icon :icon="banner.icon" width="120" />
            </div>
          </div>
        </van-swipe-item>
      </van-swipe>
    </section>

    <!-- Quick Actions Grid -->
    <section class="tools-section animate-fade-in-up delay-2">
      <div class="section-header">
        <h2>常用工具</h2>
        <span class="more-link" @click="router.push('/tools')">全部 <Icon icon="ph:caret-right-bold" /></span>
      </div>
      <div class="tools-grid-wrapper">
        <div 
          v-for="(tool, index) in tools" 
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

    <!-- Recent Activity / Stats -->
    <section class="stats-section animate-fade-in-up delay-3">
      <div class="section-header">
        <h2>概览</h2>
      </div>
      <div class="annual-expense-card">
        <div class="expense-header">
          <div class="expense-info">
            <span class="expense-label">本年支出</span>
            <span class="expense-total">¥ 42,890.00</span>
          </div>
          <div class="expense-trend">
            <Icon icon="ph:trend-up-bold" />
            <span>12%</span>
          </div>
        </div>
        <div class="chart-container">
          <div 
            v-for="(value, index) in monthlyStats" 
            :key="index" 
            class="chart-col"
            :class="{ active: index === new Date().getMonth() }"
          >
            <div class="bar-wrapper">
              <div class="bar-fill" :style="{ height: value + '%' }"></div>
            </div>
            <span class="month-label">{{ index + 1 }}月</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useAuthStore } from '../app/store/auth';
import { computed, ref, onMounted } from 'vue';

import { useRouter } from 'vue-router';
import { useMessageStore } from '../app/store/message';

const router = useRouter();
const auth = useAuthStore();
const msg = useMessageStore();
const greetingText = ref('早安');
const monthlyStats = [35, 28, 45, 32, 50, 42, 60, 55, 48, 65, 40, 38];

const userNickname = computed(() => {
  return auth.user?.nickname || auth.user?.username || '开发者';
});

function updateGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    greetingText.value = '早安';
  } else if (hour >= 12 && hour < 18) {
    greetingText.value = '午安';
  } else {
    greetingText.value = '晚安';
  }
}

const handleToolClick = (tool: any) => {
  if (tool.path) {
    router.push(tool.path);
  } else if (tool.name === '更多') {
    router.push('/tools');
  } else {
    msg.show(`${tool.name} 模块开发中...`, 'warning');
  }
};

onMounted(() => {
  updateGreeting();
});

const banners = [
  { 
    title: '家庭账本', 
    desc: '轻松记录每日开支，掌握家庭财务状况', 
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
    icon: 'ph:wallet-duotone' 
  },
  { 
    title: '购物清单', 
    desc: '无论去超市还是网购，不再遗漏任何物品', 
    gradient: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)', 
    icon: 'ph:shopping-cart-duotone' 
  },
  { 
    title: '家庭相册', 
    desc: '记录美好时刻，分享温馨瞬间', 
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', 
    icon: 'ph:image-duotone' 
  },
];

const tools = [
  { name: '家庭菜单', icon: 'ph:cooking-pot-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #FF9500 0%, #FFB340 100%)', path: '/menu' },
  { name: '密码助手', icon: 'ph:password-bold', iconColor: '#AF52DE', bgGradient: 'rgba(175,82,222,0.1)', path: '/password' },
  { name: '日程安排', icon: 'ph:calendar-blank-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #FF2D55 0%, #FF5E7D 100%)', path: '/admin/schedule' },
  { name: '待办事项', icon: 'ph:check-circle-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)' },
  { name: '家庭相册', icon: 'ph:image-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #30B0C7 0%, #4AD0E8 100%)' },
  { name: '健康档案', icon: 'ph:heartbeat-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #34C759 0%, #5DD97B 100%)' },
  { name: '常用电话', icon: 'ph:address-book-bold', iconColor: '#00C7BE', bgGradient: 'rgba(0,199,190,0.1)' },
  { name: '更多', icon: 'ph:squares-four-bold', iconColor: '#FFF', bgGradient: 'linear-gradient(135deg, #8E8E93 0%, #B0B0B5 100%)' },
];
</script>

<style scoped>
.home-container {
  padding: 24px 20px;
  min-height: 100vh;
  background-color: var(--bg);
  overflow-x: hidden;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.greeting {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: var(--fg);
}

.highlight {
  color: var(--accent);
}

.subtitle {
  margin: 4px 0 0;
  color: var(--placeholder);
  font-size: 14px;
}

.wave {
  display: inline-block;
  animation: wave 2.5s infinite;
  transform-origin: 70% 70%;
}

.avatar-placeholder {
  color: var(--placeholder);
  cursor: pointer;
  transition: transform 0.2s;
}

.avatar-placeholder:active {
  transform: scale(0.95);
}

/* Banner */
.banner-section {
  margin-bottom: 32px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.dark .banner-section {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.banner-card {
  position: relative;
  height: 160px;
  padding: 24px;
  color: white;
  border-radius: 16px;
  overflow: hidden;
}

.banner-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.banner-content h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
}

.banner-content p {
  margin: 0 0 16px;
  font-size: 13px;
  opacity: 0.9;
  max-width: 70%;
}

.banner-btn {
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.banner-btn:active {
  background: rgba(255, 255, 255, 0.3);
}

.banner-icon-bg {
  position: absolute;
  right: -20px;
  bottom: -30px;
  opacity: 0.2;
  transform: rotate(-15deg);
  z-index: 1;
}

/* Tools Grid */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--fg);
}

.more-link {
  font-size: 12px;
  color: var(--placeholder);
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
}

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

/* Annual Expense Card */
.annual-expense-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.dark .annual-expense-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.expense-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.expense-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.expense-label {
  font-size: 12px;
  color: var(--placeholder);
}

.expense-total {
  font-size: 24px;
  font-weight: 700;
  color: var(--fg);
  font-family: 'D-DIN', sans-serif;
}

.expense-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(52, 199, 89, 0.1);
  color: #34C759;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Chart */
.chart-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 120px;
  padding-top: 20px;
}

.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.bar-wrapper {
  width: 6px;
  height: 100%;
  background: var(--bg);
  border-radius: 3px;
  display: flex;
  align-items: flex-end;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: var(--placeholder);
  border-radius: 3px;
  transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.3;
}

.chart-col.active .bar-fill {
  background: var(--accent);
  opacity: 1;
}

.month-label {
  font-size: 10px;
  color: var(--placeholder);
  transform: scale(0.9);
}

.chart-col.active .month-label {
  color: var(--accent);
  font-weight: 600;
}

/* Animations */
@keyframes wave {
  0% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}

.animate-fade-in-down {
  animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
