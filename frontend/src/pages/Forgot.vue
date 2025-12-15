<template>
  <div class="forgot-wrap">
    <div class="brand animate-fade-in">
      <div class="logo animate-bounce"><Icon icon="fluent:lock-closed-key-24-filled" color="#ff3b30" width="48" height="48" /></div>
      <div class="title">找回密码</div>
      <div class="subtitle">重置您的账户密码</div>
    </div>
    
    <div class="form-card animate-slide-up">
      <van-form @submit="onSubmit">
        <div class="input-group">
          <!-- 账号 -->
          <van-field 
            v-model="form.account" 
            name="account" 
            placeholder="用户名 / 手机号" 
            :rules="[{ required: true, message: '请输入用户名或手机号' }]"
            class="custom-field"
          >
            <template #left-icon>
              <Icon icon="tabler:user-shield" width="20" height="20" class="field-icon" />
            </template>
          </van-field>

          <!-- 验证码 -->
          <van-field 
            v-model="form.code" 
            name="code" 
            center
            placeholder="验证码" 
            :rules="[{ required: true, message: '请输入验证码' }]"
            class="custom-field code-field"
          >
            <template #left-icon>
              <Icon icon="tabler:shield-check" width="20" height="20" class="field-icon" />
            </template>
            <template #button>
              <div class="captcha-box" @click="refreshCaptcha" title="点击刷新">
                <span class="captcha-text">{{ captchaCode }}</span>
              </div>
            </template>
          </van-field>

          <!-- 新密码 -->
          <van-field 
            v-model="form.password" 
            :type="showPassword ? 'text' : 'password'" 
            name="password" 
            placeholder="新密码" 
            :rules="[{ required: true, message: '请输入新密码' }]"
            class="custom-field"
          >
            <template #left-icon>
              <Icon icon="tabler:lock" width="20" height="20" class="field-icon" />
            </template>
            <template #right-icon>
              <Icon 
                :icon="showPassword ? 'fluent:eye-24-filled' : 'fluent:eye-off-24-filled'" 
                width="20" 
                height="20" 
                class="eye-icon"
                @click="showPassword = !showPassword"
              />
            </template>
          </van-field>

          <!-- 确认密码 -->
          <van-field 
            v-model="form.confirmPassword" 
            :type="showConfirmPassword ? 'text' : 'password'" 
            name="confirmPassword" 
            placeholder="确认新密码" 
            :rules="[{ required: true, message: '请确认新密码' }, { validator: validatePass, message: '两次密码不一致' }]"
            class="custom-field"
          >
            <template #left-icon>
              <Icon icon="tabler:lock-check" width="20" height="20" class="field-icon" />
            </template>
            <template #right-icon>
              <Icon 
                :icon="showConfirmPassword ? 'fluent:eye-24-filled' : 'fluent:eye-off-24-filled'" 
                width="20" 
                height="20" 
                class="eye-icon"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </van-field>
        </div>

        <div class="actions">
          <van-button 
            type="primary" 
            block 
            :loading="loading" 
            native-type="submit"
            class="submit-btn"
          >
            重置密码
          </van-button>
        </div>

        <div class="links">
          <span class="link-text" @click="goLogin">想起密码？去登录</span>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useMessageStore } from '../app/store/message';
import { useAuthStore } from '../app/store/auth';
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';

const msg = useMessageStore();
const auth = useAuthStore();
const router = useRouter();
const form = reactive({
  account: '',
  code: '',
  password: '',
  confirmPassword: ''
});

const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const captchaCode = ref('');

const validatePass = (val: string) => val === form.password;

// 生成随机验证码
function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字符
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function refreshCaptcha() {
  captchaCode.value = generateCaptcha();
  form.code = ''; // 刷新时清空输入
}

// 初始化验证码
refreshCaptcha();

async function onSubmit() {
  if (form.code.toUpperCase() !== captchaCode.value) {
    msg.show('验证码错误', 'error');
    refreshCaptcha();
    return;
  }

  loading.value = true;
  const success = await auth.resetPassword({
    account: form.account,
    password: form.password
  });
  loading.value = false;

  if (success) {
    msg.show('密码重置成功，请登录', 'success');
    setTimeout(() => {
      router.push('/login');
    }, 1000);
  } else {
    refreshCaptcha();
  }
}

function goLogin() {
  router.push('/login');
}
</script>

<style scoped>
.forgot-wrap { 
  min-height: 100vh; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  padding: 24px;
  position: relative;
  overflow-y: auto;
}

/* 品牌区 */
.brand { 
  display: flex; 
  align-items: center; 
  flex-direction: column; 
  gap: 12px; 
  margin-bottom: 32px; 
  z-index: 2;
  margin-top: 20px;
}
.logo { 
  filter: drop-shadow(0 4px 12px rgba(255, 59, 48, 0.3));
}
.title { 
  font-weight: 700; 
  font-size: 26px; 
  color: var(--fg);
  letter-spacing: -0.5px;
}
.subtitle { 
  color: var(--fg); 
  opacity: 0.6;
  font-size: 14px; 
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 表单卡片 */
.form-card {
  width: 100%;
  max-width: 360px;
  z-index: 2;
  margin-bottom: 40px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 32px;
}

/* 自定义输入框样式 */
:deep(.custom-field) {
  background: var(--surface-2);
  border-radius: 16px;
  padding: 14px 20px;
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

.eye-icon {
  color: var(--placeholder);
  cursor: pointer;
}
.eye-icon:hover {
  color: var(--fg);
}

/* 验证码样式 */
.captcha-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 36px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--border);
  margin-left: 12px;
  transition: opacity 0.3s;
  position: relative;
  overflow: hidden;
}

.captcha-box:hover {
  opacity: 0.8;
}

.captcha-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 4px;
  color: #333;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  background-image: linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333), 
                    linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%, #333);
  background-size: 4px 4px;
  background-position: 0 0, 2px 2px;
  -webkit-background-clip: text;
  background-clip: text;
}

/* 按钮 */
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
