<template>
  <div class="page-container">
    <van-nav-bar title="用户管理" left-arrow @click-left="router.back()" fixed placeholder />
    
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="user-list">
        <div v-for="user in users" :key="user.id" class="user-card" @click="editUser(user)">
          <div class="user-header">
            <span class="username">{{ user.username }}</span>
            <van-tag :type="user.is_admin ? 'primary' : 'default'">{{ user.is_admin ? '管理员' : '普通用户' }}</van-tag>
          </div>
          <div class="user-info">
            <p>昵称: {{ user.nickname }}</p>
            <p>身份: {{ user.family_role }}</p>
            <p>手机: {{ user.phone }}</p>
            <p>积分: {{ user.family_points }}</p>
          </div>
        </div>
        <van-empty v-if="users.length === 0" description="暂无用户" />
      </div>
    </van-pull-refresh>

    <!-- Edit Popup -->
    <van-popup v-model:show="showEdit" position="bottom" round :style="{ height: '80%' }">
      <div class="popup-content">
        <div class="popup-header">
          <h3>编辑用户</h3>
        </div>
        <van-form @submit="onSave">
          <van-cell-group inset>
            <van-field v-model="form.username" label="用户名" disabled />
            <van-field v-model="form.nickname" label="昵称" placeholder="请输入昵称" />
            <van-field v-model="form.family_role" label="家庭身份" placeholder="如：爸爸、妈妈" />
            <van-field v-model="form.phone" label="手机号" placeholder="请输入手机号" />
            <van-field name="gender" label="性别">
              <template #input>
                <van-radio-group v-model="form.gender" direction="horizontal">
                  <van-radio name="male">男</van-radio>
                  <van-radio name="female">女</van-radio>
                  <van-radio name="unknown">保密</van-radio>
                </van-radio-group>
              </template>
            </van-field>
            <van-field v-model="form.birthday" label="生日" placeholder="请选择生日" @click="showBirthdayPicker = true" readonly is-link />
            <van-field name="is_admin" label="管理员">
              <template #input>
                <van-switch v-model="form.is_admin" :active-value="1" :inactive-value="0" size="20" />
              </template>
            </van-field>
            <van-field v-model.number="form.family_points" label="亲情分" type="number" />
            <van-field v-model="form.remark" label="备注" placeholder="备注信息" />
            <van-field v-model="form.password" label="新密码" placeholder="不修改请留空" type="password" />
          </van-cell-group>
          <div class="form-actions">
            <van-button round block type="primary" native-type="submit" :loading="saving">保存</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- Date Picker -->
    <van-popup v-model:show="showBirthdayPicker" position="bottom">
      <van-date-picker
        v-model="currentDate"
        title="选择生日"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onConfirmBirthday"
        @cancel="showBirthdayPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '../../app/request';
import { showToast } from 'vant';

const router = useRouter();
const users = ref<any[]>([]);
const refreshing = ref(false);
const showEdit = ref(false);
const saving = ref(false);
const showBirthdayPicker = ref(false);

const form = ref<any>({});
const minDate = new Date(1900, 0, 1);
const maxDate = new Date();
const currentDate = ref(['1990', '01', '01']);

const fetchUsers = async () => {
  try {
    const res: any = await request.get('/auth/users');
    users.value = res;
  } catch (e) {
    console.error(e);
  } finally {
    refreshing.value = false;
  }
};

const onRefresh = () => {
  fetchUsers();
};

const editUser = (user: any) => {
  form.value = { ...user, password: '' };
  
  // Format birthday for picker
  if (user.birthday) {
    const date = new Date(user.birthday);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    form.value.birthday = `${year}-${month}-${day}`;
    currentDate.value = [year, month, day];
  } else {
    currentDate.value = ['1990', '01', '01'];
  }
  
  showEdit.value = true;
};

const onConfirmBirthday = ({ selectedValues }: any) => {
  form.value.birthday = selectedValues.join('-');
  showBirthdayPicker.value = false;
};

const onSave = async () => {
  saving.value = true;
  try {
    const data = { ...form.value };
    if (!data.password) delete data.password;
    if (data.birthday === null) delete data.birthday; // keep existing or set null logic
    
    await request.put(`/auth/users/${data.id}`, data);
    showToast('更新成功');
    showEdit.value = false;
    fetchUsers();
  } catch (e) {
    // error handled by request interceptor
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--bg);
}

.user-list {
  padding: 12px;
  padding-bottom: 40px;
}

.user-card {
  background: var(--surface-1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: opacity 0.2s;
}

.user-card:active {
  opacity: 0.8;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--border);
}

.username {
  font-weight: bold;
  font-size: 16px;
  color: var(--fg);
}

.user-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.user-info p {
  margin: 0;
  font-size: 13px;
  color: var(--placeholder);
}

.popup-content {
  padding-top: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  text-align: center;
  margin-bottom: 16px;
  font-weight: bold;
  font-size: 18px;
  color: var(--fg);
}

.form-actions {
  padding: 24px 16px;
  margin-top: auto;
}

/* Dark mode adjustments */
:global(html.dark) .user-card {
  background-color: var(--surface-1);
}
</style>
