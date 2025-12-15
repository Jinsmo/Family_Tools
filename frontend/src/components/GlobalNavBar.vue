<template>
  <van-nav-bar 
    fixed 
    placeholder
    z-index="100"
    :title="title" 
    :left-arrow="showBack"
    @click-left="onClickLeft"
  >
    <template #right>
      <div class="right-actions">
        <!-- 密码助手专属入口 -->
        <button v-if="route.name === 'PasswordHome'" class="text-btn" @click="$router.push('/password/category')">
            分类管理
        </button>

        <button v-if="showLogout" class="icon-btn" @click="handleLogout" aria-label="退出登录">
          <Icon icon="ph:sign-out-bold" width="24" height="24" />
        </button>
        <button class="icon-btn" @click="toggleTheme" aria-label="切换主题">
          <transition name="rotate" mode="out-in">
            <Icon 
              :key="isDark ? 'dark' : 'light'"
              :icon="isDark ? 'material-symbols:dark-mode-rounded' : 'material-symbols:light-mode-rounded'" 
              width="24" 
              height="24" 
              class="theme-icon"
            />
          </transition>
        </button>
      </div>
    </template>
  </van-nav-bar>
</template>

<script setup lang="ts">
import { appConfig } from '../app/config';
import { useThemeStore } from '../app/store/theme';
import { useAuthStore } from '../app/store/auth';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useRoute, useRouter } from 'vue-router';
import { showConfirmDialog } from 'vant';

const theme = useThemeStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const title = computed(() => {
  if (route.meta?.title) {
    return route.meta.title as string;
  }
  return appConfig.showTitle ? appConfig.title : '';
});
const isDark = computed(() => theme.mode === 'dark');

// 仅在非登录页显示返回按钮
const showBack = computed(() => route.name !== 'Login');

// 仅在已登录且非登录相关页面显示退出按钮
const showLogout = computed(() => {
  const publicPages = ['Login', 'Register', 'Forgot'];
  return !publicPages.includes(route.name as string) && auth.token;
});

function toggleTheme() { theme.toggle(); }

function handleLogout() {
  showConfirmDialog({
    title: '确认退出',
    message: '您确定要退出登录吗？',
  })
    .then(() => {
      auth.logout();
    })
    .catch(() => {
      // on cancel
    });
}

function onClickLeft() {
  if (showBack.value) {
    router.back();
  }
}
</script>

<style scoped>
.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn { 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  width: 32px; 
  height: 32px; 
  border: none; 
  background: transparent; 
  color: var(--fg);
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s;
}

.icon-btn:hover {
  background-color: var(--surface-2);
}

.theme-icon {
  color: var(--fg);
}

/* 旋转缩放动画 */
.rotate-enter-active,
.rotate-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.rotate-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.rotate-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}
</style>
