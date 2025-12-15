<template>
  <van-tabbar 
    v-if="showTabbar" 
    v-model="active" 
    route 
    fixed 
    placeholder 
    safe-area-inset-bottom 
    :border="false" 
    class="global-tabbar"
  >
    <van-tabbar-item replace to="/home">
      <span>首页</span>
      <template #icon="props">
        <Icon :icon="props.active ? 'ph:house-fill' : 'ph:house-bold'" width="24" height="24" />
      </template>
    </van-tabbar-item>
    <van-tabbar-item replace to="/tools">
      <span>工具箱</span>
      <template #icon="props">
        <Icon :icon="props.active ? 'ph:toolbox-fill' : 'ph:toolbox-bold'" width="24" height="24" />
      </template>
    </van-tabbar-item>
    <van-tabbar-item replace to="/profile">
      <span>我的</span>
      <template #icon="props">
        <Icon :icon="props.active ? 'ph:user-fill' : 'ph:user-bold'" width="24" height="24" />
      </template>
    </van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '../app/store/auth';

const route = useRoute();
const auth = useAuthStore();
const active = ref(0);

const showTabbar = computed(() => {
  const hiddenPages = ['Login', 'Register', 'Forgot', 'OrderConfirm'];
  // 只有在已登录且不在隐藏页面时显示
  return auth.token && !hiddenPages.includes(route.name as string);
});
</script>

<style scoped>
.global-tabbar {
  /* 强制固定定位，确保始终在视口底部 */
  position: fixed !important;
  bottom: 0 !important;
  left: 0;
  width: 100%;
  z-index: 999;
  
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border);
}
</style>

<style>
/* 全局样式覆盖，确保暗色模式生效 */
.global-tabbar {
  --van-tabbar-background: rgba(255, 255, 255, 0.85);
  --van-tabbar-item-active-background: transparent;
  --van-tabbar-item-active-text-color: var(--accent);
  --van-tabbar-item-text-color: #646566;
  background: var(--van-tabbar-background) !important;
}

html.dark .global-tabbar {
  --van-tabbar-background: rgba(28, 28, 30, 0.85);
  --van-tabbar-item-active-background: transparent;
  --van-tabbar-item-text-color: #8e8e93;
  border-top-color: rgba(255, 255, 255, 0.12);
  background: var(--van-tabbar-background) !important;
}
</style>
