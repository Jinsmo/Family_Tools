<template>
  <div class="login-wrap">
    <div class="brand animate-fade-in">
      <div class="logo animate-bounce"><Icon icon="fluent:heart-28-filled" color="#ff3b30" width="48" height="48" /></div>
      <div v-if="showTitle" class="title">{{ title }}</div>
      <div class="subtitle">{{ subtitle }}</div>
    </div>
    
    <div class="form-card animate-slide-up">
      <van-form @submit="onSubmit">
        <div class="input-group">
          <van-field 
            v-model="form.username" 
            name="username" 
            placeholder="用户名或手机号" 
            :rules="[{ required: true, message: '请输入账号' }]"
            class="custom-field"
          >
            <template #left-icon>
              <Icon icon="tabler:user" width="20" height="20" class="field-icon" />
            </template>
          </van-field>
          
          <van-field 
            v-model="form.password" 
            type="password" 
            name="password" 
            placeholder="请输入密码" 
            :rules="[{ required: true, message: '请输入密码' }]"
            class="custom-field"
          >
            <template #left-icon>
              <Icon icon="tabler:lock" width="20" height="20" class="field-icon" />
            </template>
          </van-field>
        </div>

        <div class="actions">
          <van-button 
            type="primary" 
            block 
            :loading="auth.loading" 
            :disabled="disabled" 
            native-type="submit"
            class="submit-btn"
          >
            登 录
          </van-button>
        </div>

        <div class="links">
          <span class="link-text" @click="onRegister">立即注册</span>
          <span class="divider">|</span>
          <span class="link-text" @click="onForgot">忘记密码</span>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useAuthStore } from '../app/store/auth';
import { useMessageStore } from '../app/store/message';
import { appConfig } from '../app/config';
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const msg = useMessageStore();
const router = useRouter();
const form = reactive({ username: '', password: '' });
const disabled = computed(() => !form.username || !form.password);
const title = appConfig.title;
const subtitle = appConfig.subtitle;
const showTitle = appConfig.showTitle;

async function onSubmit() {
  const success = await auth.login({ account: form.username, password: form.password });
  if (success) {
    msg.show('登录成功', 'success');
    router.push('/home');
  }
}

function onRegister() {
  if (!appConfig.enableRegister) {
    msg.show('暂不支持注册', 'warning');
    return;
  }
  router.push('/register');
}

function onForgot() {
  router.push('/forgot');
}
</script>

<style scoped>
.login-wrap { 
  min-height: 100vh; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* 品牌区 */
.brand { 
  display: flex; 
  align-items: center; 
  flex-direction: column; 
  gap: 12px; 
  margin-bottom: 40px; 
  z-index: 2;
}
.logo { 
  filter: drop-shadow(0 4px 12px rgba(255, 59, 48, 0.3));
}
.title { 
  font-weight: 700; 
  font-size: 28px; 
  color: var(--fg);
  letter-spacing: -0.5px;
}
.subtitle { 
  color: var(--fg); 
  opacity: 0.6;
  font-size: 15px; 
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 表单卡片 */
.form-card {
  width: 100%;
  max-width: 360px;
  z-index: 2;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

/* 自定义输入框样式 */
:deep(.custom-field) {
  background: var(--surface-2);
  border-radius: 16px;
  padding: 16px 20px;
  align-items: center;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

:deep(.custom-field:focus-within) {
  background: var(--surface);
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15);
  transform: translateY(-1px);
}

:deep(.van-field__control) {
  font-size: 16px;
  font-weight: 500;
}

:deep(.van-field__left-icon) {
  margin-right: 12px;
  display: flex;
  align-items: center;
}

.field-icon {
  color: var(--placeholder);
  transition: color 0.3s;
}

:deep(.custom-field:focus-within .field-icon) {
  color: var(--accent);
}

/* 登录按钮 */
.actions { margin-bottom: 24px; }
.submit-btn {
  height: 52px;
  border-radius: 26px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #007AFF 0%, #0055ff 100%);
  border: none;
  box-shadow: 0 8px 20px rgba(0, 122, 255, 0.3);
  transition: all 0.3s ease;
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

/* 底部链接 */
.links { 
  display: flex; 
  gap: 24px; 
  justify-content: center; 
  align-items: center;
}
.link-text {
  color: var(--fg);
  opacity: 0.5;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.link-text:hover {
  opacity: 0.8;
  color: var(--accent);
}
.divider {
  color: var(--fg);
  opacity: 0.2;
  font-size: 12px;
}

/* 动画 */
.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.animate-bounce {
  animation: bounce 2s infinite ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
