<template>
  <transition name="msg-slide">
    <div v-if="visible" class="message-capsule" :class="[store.type, { 'is-dark': themeStore.mode === 'dark' }]">
      <div class="icon-box">
        <Icon :icon="iconName" width="20" height="20" />
      </div>
      <span class="content">{{ store.text }}</span>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useMessageStore } from '../app/store/message';
import { useThemeStore } from '../app/store/theme';
import { watch, ref, computed } from 'vue';
import { Icon } from '@iconify/vue';

const store = useMessageStore();
const themeStore = useThemeStore();
const visible = ref(false);
let timer: any = null;

const iconName = computed(() => {
  switch (store.type) {
    case 'success': return 'fluent:checkmark-circle-24-filled';
    case 'error': return 'fluent:dismiss-circle-24-filled';
    case 'warning': return 'fluent:warning-24-filled';
    default: return 'fluent:info-24-filled';
  }
});

watch(() => store.visible, (v) => {
  if (v && store.text) {
    visible.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      visible.value = false;
      store.clear();
    }, 3000);
  } else {
    visible.value = false;
  }
});
</script>

<style scoped>
.message-capsule {
  position: fixed;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  padding: 8px 16px 8px 12px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(20px);
  border-radius: 99px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
  z-index: 9999;
  min-width: 140px;
  max-width: 90vw;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.message-capsule.is-dark {
  background: rgba(35, 35, 36, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  border-radius: 50%;
}

.content {
  font-size: 15px;
  font-weight: 500;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-capsule.is-dark .content {
  color: #f5f5f7;
}

/* 类型颜色 */
.success .icon-box { color: #34c759; }
.error .icon-box { color: #ff3b30; }
.warning .icon-box { color: #ff9500; }
.info .icon-box { color: #007aff; }

/* 动画 */
.msg-slide-enter-from,
.msg-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}

.msg-slide-enter-active,
.msg-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.msg-slide-enter-to,
.msg-slide-leave-from {
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}
</style>