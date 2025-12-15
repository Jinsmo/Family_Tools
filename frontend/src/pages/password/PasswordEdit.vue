<template>
  <div class="password-edit page-container">
    <div class="header-section animate-fade-in-down">
      <h2 class="page-title">{{ isEdit ? '编辑密码' : '新增密码' }}</h2>
      <p class="page-subtitle">请填写账号详细信息</p>
    </div>

    <van-form @submit="onSubmit" class="edit-form animate-slide-up">
      <div class="form-card">
        <div class="section-title">基本信息</div>
        <van-field 
          v-model="form.title" 
          name="title" 
          label="标题" 
          placeholder="例如：微信、QQ" 
          :rules="[{ required: true, message: '请填写标题' }]" 
          class="custom-field"
        >
          <template #left-icon>
            <van-icon name="label-o" class="field-icon" />
          </template>
        </van-field>
        
        <van-field 
          v-model="form.account" 
          name="account" 
          label="账号" 
          placeholder="用户名/手机号/邮箱" 
          :rules="[{ required: true, message: '请填写账号' }]" 
          class="custom-field"
        >
          <template #left-icon>
            <van-icon name="user-o" class="field-icon" />
          </template>
        </van-field>
        
        <van-field 
          v-model="form.password" 
          :type="passwordVisible ? 'text' : 'password'" 
          name="password" 
          label="密码" 
          placeholder="请输入密码" 
          :rules="[{ required: true, message: '请填写密码' }]"
          class="custom-field"
        >
          <template #left-icon>
            <van-icon name="lock" class="field-icon" />
          </template>
          <template #right-icon>
             <div class="pwd-actions">
                <van-icon :name="passwordVisible ? 'eye-o' : 'closed-eye'" @click="passwordVisible = !passwordVisible" class="action-icon" />
                <span class="gen-pwd-btn" @click.stop="generatePassword">生成</span>
             </div>
          </template>
        </van-field>

        <van-field
          v-model="categoryName"
          is-link
          readonly
          name="category"
          label="分类"
          placeholder="点击选择分类"
          @click="showCategoryPicker = true"
          class="custom-field"
        >
          <template #left-icon>
            <van-icon name="apps-o" class="field-icon" />
          </template>
        </van-field>
        
        <van-popup v-model:show="showCategoryPicker" position="bottom" round>
          <van-picker
            :columns="categoryColumns"
            @confirm="onCategoryConfirm"
            @cancel="showCategoryPicker = false"
            title="选择分类"
          />
        </van-popup>
      </div>

      <div class="form-card animate-slide-up" style="animation-delay: 0.1s">
        <div class="section-title">更多信息</div>
        <van-field 
          v-model="form.url" 
          name="url" 
          label="网址" 
          placeholder="登录网址（选填）" 
          class="custom-field"
        >
          <template #left-icon>
            <van-icon name="desktop-o" class="field-icon" />
          </template>
        </van-field>
        
        <van-field 
          v-model="form.remark" 
          name="remark" 
          label="备注" 
          type="textarea" 
          placeholder="备注信息（选填）" 
          rows="2" 
          autosize 
          class="custom-field"
        >
          <template #left-icon>
            <van-icon name="notes-o" class="field-icon" />
          </template>
        </van-field>
        
        <van-cell center title="加入收藏" class="custom-field switch-cell">
          <template #icon>
            <van-icon name="star-o" class="field-icon" style="margin-right: 4px;" />
          </template>
          <template #right-icon>
            <van-switch v-model="form.is_favorite" size="24" active-color="#1989fa" />
          </template>
        </van-cell>
      </div>
      
      <div class="submit-bar">
        <van-button 
          round 
          block 
          type="primary" 
          native-type="submit" 
          :loading="submitting"
          class="submit-btn"
        >
          保存
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import { getCategories, createEntry, updateEntry, getEntries, getEntryPassword, type Category } from '../../api/password';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.query.id);
const entryId = Number(route.query.id);

const form = ref({
  title: '',
  account: '',
  password: '',
  category_id: undefined as number | undefined,
  url: '',
  remark: '',
  is_favorite: false
});

const categories = ref<Category[]>([]);
const showCategoryPicker = ref(false);
const passwordVisible = ref(false);
const submitting = ref(false);

const categoryName = computed(() => {
  const cat = categories.value.find(c => c.id === form.value.category_id);
  return cat ? cat.name : '';
});

const categoryColumns = computed(() => {
  return categories.value.map(c => ({ text: c.name, value: c.id }));
});

const onCategoryConfirm = ({ selectedOptions }: any) => {
  if (selectedOptions[0]) {
    form.value.category_id = selectedOptions[0].value;
  }
  showCategoryPicker.value = false;
};

const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pwd = '';
  for (let i = 0; i < 16; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  form.value.password = pwd;
  passwordVisible.value = true; // Show generated password
  showToast('已生成强密码');
};

const onSubmit = async () => {
  submitting.value = true;
  try {
    const data = { ...form.value };
    if (isEdit.value) {
      await updateEntry(entryId, data);
      showToast('更新成功');
    } else {
      await createEntry(data);
      showToast('创建成功');
    }
    router.back();
  } catch (error) {
    // error
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    categories.value = await getCategories();
    
    if (isEdit.value) {
      // Load entry details
      const list = await getEntries();
      const entry = list.find(e => e.id === entryId);
      if (entry) {
        form.value.title = entry.title;
        form.value.account = entry.account;
        form.value.category_id = entry.category_id;
        form.value.url = entry.url || '';
        form.value.remark = entry.remark || '';
        form.value.is_favorite = !!entry.is_favorite;
        
        // Fetch password
        try {
          const res = await getEntryPassword(entryId);
          form.value.password = res.password;
        } catch (e) {
          console.error('Failed to get password', e);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--bg);
  padding-bottom: 80px;
}

.header-section {
  padding: 24px 20px;
  background: linear-gradient(135deg, var(--surface-1) 0%, var(--bg) 100%);
  margin-bottom: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--fg);
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--placeholder);
  margin: 0;
}

.edit-form {
  padding: 0 16px;
}

.form-card {
  background-color: var(--surface-1);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--placeholder);
  margin-bottom: 12px;
  padding-left: 4px;
}

.custom-field {
  background-color: transparent;
  padding: 16px 8px;
  border-bottom: 1px solid var(--border);
}

.custom-field:last-child {
  border-bottom: none;
}

.field-icon {
  font-size: 18px;
  color: #1989fa;
  margin-right: 8px;
}

.pwd-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-icon {
  font-size: 20px;
  color: var(--fg);
  cursor: pointer;
}

.gen-pwd-btn {
  font-size: 12px;
  color: #1989fa;
  background: rgba(25, 137, 250, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 16px 24px;
  background-color: var(--surface-1);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
  z-index: 99;
}

.submit-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #1989fa, #0570db);
  border: none;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
}

/* Animations */
.animate-fade-in-down {
  animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>