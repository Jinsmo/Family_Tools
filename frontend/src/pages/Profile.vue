<template>
  <div class="profile-page">
    <!-- Header Section -->
    <div class="header">
      <div class="user-info">
        <van-image
          round
          width="80"
          height="80"
          :src="userAvatar"
          class="avatar"
          fit="cover"
        />
        <div class="info-content">
          <h2 class="username">{{ auth.user?.username || '用户' }}</h2>
          <p class="user-id">ID: {{ auth.user?.id || 'Unknown' }}</p>
        </div>
      </div>
      <div class="header-shapes"></div>
    </div>

    <!-- Content Section -->
    <div class="content">
      <!-- Family Points Card -->
      <div class="points-card">
        <div class="points-info">
          <span class="points-label">亲情分</span>
          <span class="points-value">{{ points }}</span>
        </div>
        <div class="points-icon">
          <Icon icon="ph:heart-fill" />
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="quick-actions">
        <div class="action-item" @click="handleAction('profile')">
          <div class="action-icon blue">
            <Icon icon="ph:user-bold" />
          </div>
          <span class="action-label">个人中心</span>
        </div>

        <div class="action-item" @click="handleAction('orders')">
          <div class="action-icon orange">
            <Icon icon="ph:receipt-bold" />
          </div>
          <span class="action-label">我的订单</span>
        </div>
        
        <div class="action-item" @click="handleAction('family')">
          <div class="action-icon pink">
            <Icon icon="ph:users-three-bold" />
          </div>
          <span class="action-label">我的家人</span>
        </div>
        <div class="action-item" @click="handleAction('more')">
          <div class="action-icon purple">
            <Icon icon="ph:squares-four-bold" />
          </div>
          <span class="action-label">更多服务</span>
        </div>
      </div>

      <!-- Promotion Banner -->
      <div class="promo-banner" @click="handleAction('invite')">
        <div class="banner-content">
          <h3>邀请家人加入</h3>
          <p>共享亲情时光，赚取更多积分</p>
        </div>
        <div class="banner-icon">
          <Icon icon="ph:paper-plane-tilt-fill" />
        </div>
      </div>

      <!-- Menu Group 1 -->
      <van-cell-group inset class="menu-group">
        <van-cell center is-link>
          <template #title>
            <span class="cell-title">每日签到</span>
          </template>
          <template #icon>
            <div class="icon-wrapper red">
              <Icon icon="ph:calendar-check-bold" />
            </div>
          </template>
          <template #value>
            <span class="cell-value">已连续 3 天</span>
          </template>
        </van-cell>

        <!-- Admin Button -->
        <van-cell center is-link to="/admin" v-if="auth.user?.is_admin === 1">
          <template #title>
            <span class="cell-title">后台管理</span>
          </template>
          <template #icon>
            <div class="icon-wrapper blue">
              <Icon icon="ph:shield-check-bold" />
            </div>
          </template>
        </van-cell>

        <van-cell center title="深色模式">
          <template #icon>
            <div class="icon-wrapper purple">
              <Icon icon="ph:moon-stars-bold" />
            </div>
          </template>
          <template #right-icon>
            <van-switch v-model="isDark" size="22px" @change="toggleTheme" />
          </template>
        </van-cell>
      </van-cell-group>

      <!-- Logout Button -->
      <div class="logout-section">
        <van-button block class="logout-btn" @click="handleLogout">
          退出登录
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../app/store/auth';
import { useThemeStore } from '../app/store/theme';
import { useMessageStore } from '../app/store/message';
import { Icon } from '@iconify/vue';
import { showDialog } from 'vant';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const themeStore = useThemeStore();
const messageStore = useMessageStore();
const router = useRouter();

const points = ref(0);

onMounted(async () => {
  await auth.fetchProfile();
  
  // Simple number animation
  const duration = 1500;
  const start = 0;
  const targetPoints = auth.user?.family_points || 0;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out quart
    const easeProgress = 1 - Math.pow(1 - progress, 4);
    
    points.value = Math.floor(start + (targetPoints - start) * easeProgress);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
});

const userAvatar = computed(() => {
  if (auth.user?.avatar) return auth.user.avatar;
  return 'https://api.dicebear.com/7.x/notionists/svg?seed=' + (auth.user?.username || 'User') + '&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';
});

const isDark = computed({
  get: () => themeStore.mode === 'dark',
  set: (val) => themeStore.set(val ? 'dark' : 'light'),
});

const toggleTheme = () => {
  // handled by setter logic mostly
};

const handleAction = (type: string) => {
  if (type === 'profile') {
    router.push('/user-info');
    return;
  }
  if (type === 'family') {
    router.push('/family');
    return;
  }
  
  if (type === 'orders') {
    router.push('/orders');
    return;
  }
  
  // Use global message component
  const messages: Record<string, string> = {
    'more': '更多精彩服务敬请期待',
    'invite': '邀请链接已复制',
  };
  
  messageStore.show(messages[type] || `点击了: ${type}`, 'info');
};

const handleLogout = () => {
  showDialog({
    title: '提示',
    message: '确定要退出登录吗？',
    showCancelButton: true,
    confirmButtonColor: '#ee0a24',
  }).then((action) => {
    if (action === 'confirm') {
      auth.logout();
      messageStore.show('已安全退出登录', 'success');
    }
  });
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: var(--surface-2);
  padding-bottom: 90px;
}

.header {
  position: relative;
  padding: 60px 24px 90px;
  background: linear-gradient(135deg, #007AFF 0%, #00c6fb 100%);
  color: white;
  border-radius: 0 0 32px 32px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.2);
}

.header-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 85% 15%, rgba(255,255,255,0.15) 0%, transparent 25%),
    radial-gradient(circle at 10% 60%, rgba(255,255,255,0.1) 0%, transparent 30%);
  pointer-events: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.avatar {
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background: #f0f0f0;
}

.username {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 6px;
  letter-spacing: 0.5px;
}

.user-id {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 10px;
  border-radius: 12px;
  display: inline-block;
}

.content {
  margin-top: -60px;
  padding: 0 16px;
  position: relative;
  z-index: 2;
}

/* Points Card */
.points-card {
  background: var(--bg);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.points-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1;
}

.points-label {
  font-size: 14px;
  color: var(--placeholder);
  font-weight: 500;
}

.points-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
}

.points-icon {
  font-size: 48px;
  color: #ff3b30;
  opacity: 0.15;
  position: absolute;
  right: 20px;
  bottom: -10px;
  transform: rotate(-15deg);
}

/* Quick Actions Grid */
.quick-actions {
  background: var(--bg);
  border-radius: 20px;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-item:active .action-icon {
  transform: scale(0.95);
}

.action-label {
  font-size: 12px;
  color: var(--fg);
  font-weight: 500;
}

.action-icon.blue { background: linear-gradient(135deg, #4facfe, #00f2fe); box-shadow: 0 4px 12px rgba(79, 172, 254, 0.2); }
.action-icon.orange { background: linear-gradient(135deg, #ff9a9e, #fecfef); box-shadow: 0 4px 12px rgba(255, 154, 158, 0.2); }
.action-icon.green { background: linear-gradient(135deg, #43e97b, #38f9d7); box-shadow: 0 4px 12px rgba(67, 233, 123, 0.2); }
.action-icon.pink { background: linear-gradient(135deg, #ff758c, #ff7eb3); box-shadow: 0 4px 12px rgba(255, 117, 140, 0.2); }
.action-icon.purple { background: linear-gradient(135deg, #a18cd1, #fbc2eb); box-shadow: 0 4px 12px rgba(161, 140, 209, 0.2); }
.action-icon.teal { background: linear-gradient(135deg, #00c6fb, #005bea); }

/* Promo Banner */
.promo-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(118, 75, 162, 0.2);
}

.banner-content h3 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.banner-content p {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}

.banner-icon {
  font-size: 40px;
  opacity: 0.8;
  transform: rotate(-10deg);
}

/* Menu Groups */
.menu-group {
  margin: 0 0 20px !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  border-radius: 16px !important;
  background: var(--bg) !important;
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  font-size: 20px;
  color: white;
  transition: transform 0.2s;
}

.menu-group .van-cell:active .icon-wrapper {
  transform: scale(0.95);
}

.icon-wrapper.blue { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.icon-wrapper.purple { background: linear-gradient(135deg, #a18cd1, #fbc2eb); }
.icon-wrapper.green { background: linear-gradient(135deg, #43e97b, #38f9d7); }
.icon-wrapper.red { background: linear-gradient(135deg, #ff5858, #f09819); }
.icon-wrapper.orange { background: linear-gradient(135deg, #ff9a9e, #fecfef); }
.icon-wrapper.teal { background: linear-gradient(135deg, #00c6fb, #005bea); }

.cell-title {
  font-weight: 500;
  font-size: 16px;
  color: var(--fg);
}

.cell-value {
  font-size: 13px;
  color: var(--placeholder);
}

.logout-section {
  padding: 0 8px;
}

.logout-btn {
  height: 50px;
  border-radius: 14px;
  background-color: var(--bg);
  color: #ee0a24;
  border: none;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

:deep(.van-switch) {
  background: rgba(120, 120, 128, 0.16);
}

:deep(.van-switch--on) {
  background: var(--accent);
}

/* Dark mode adjustments */
:root:has(.dark) .points-card,
:root:has(.dark) .quick-actions,
:root:has(.dark) .menu-group,
:root:has(.dark) .logout-btn {
  background: var(--surface);
}

:root:has(.dark) .header {
  background: linear-gradient(135deg, #0a84ff 0%, #007aff 100%);
}

/* Animations */
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

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.header {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.points-card {
  animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.1s;
  opacity: 0; /* ensure it's hidden before animation starts */
}

.quick-actions {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.2s;
  opacity: 0;
}

.promo-banner {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.3s;
  opacity: 0;
}

.menu-group {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.4s;
  opacity: 0;
}

.logout-section {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.5s;
  opacity: 0;
}
</style>
