<template>
  <div class="family-page">
    <div class="content">
      <!-- Summary Header -->
      <div class="summary-header animate-fade-in-down">
        <div class="summary-text">
          <span class="count">{{ familyStore.list.length }}</span>
          <span class="label">位家庭成员</span>
        </div>
        <van-button 
          round 
          size="small" 
          type="primary" 
          class="add-btn" 
          icon="plus"
          @click="showAddTip"
        >
          添加家人
        </van-button>
      </div>

      <!-- Loading State -->
      <div v-if="familyStore.loading" class="loading-state">
        <van-loading size="24px" vertical>正在寻找亲人...</van-loading>
      </div>

      <!-- Empty State -->
      <div v-else-if="familyStore.list.length === 0" class="empty-state animate-fade-in-up">
        <Icon icon="ph:users-three-duotone" width="64" class="empty-icon" />
        <p>暂无家庭成员，快去邀请吧</p>
      </div>

      <!-- Family List -->
      <div v-else class="family-list">
        <div 
          v-for="(member, index) in familyStore.list" 
          :key="member.id"
          class="family-card animate-fade-in-up"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="card-left">
            <div class="avatar-wrapper">
              <van-image
                round
                width="50"
                height="50"
                :src="getAvatar(member.username)"
                fit="cover"
              />
              <div class="gender-badge" :class="member.gender">
                <Icon :icon="getGenderIcon(member.gender)" width="12" />
              </div>
            </div>
          </div>
          
          <div class="card-center">
            <div class="name-row">
              <span class="nickname">{{ member.nickname }}</span>
              <span v-if="member.id === auth.user?.id" class="me-tag">我</span>
            </div>
            <div class="role-row">
              <span class="phone-text">
                <Icon icon="ph:phone-bold" width="12" class="phone-icon" />
                {{ member.phone || '未绑定手机' }}
              </span>
            </div>
          </div>

          <div class="card-right" @click="handleEditCall(member)">
            <div class="call-badge" :class="{ 'highlight': member.display_call && member.display_call !== '未设置' }">
              {{ member.display_call || '未设置' }}
              <Icon icon="ph:pencil-simple-bold" width="12" class="edit-icon" v-if="member.id !== auth.user?.id" />
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Call Dialog -->
      <van-dialog v-model:show="showEditDialog" title="修改称呼" show-cancel-button @confirm="onConfirmCall">
        <div class="edit-call-form">
          <van-field
            v-model="editingCall"
            label="称呼"
            placeholder="请输入您对TA的称呼"
            input-align="left"
          />
        </div>
      </van-dialog>

      <!-- Add Family Dialog -->
      <van-popup v-model:show="showAddDialog" position="bottom" round :style="{ height: '80%' }">
        <div class="add-family-content">
          <div class="popup-header">
            <h3>添加家人</h3>
            <span class="close-btn" @click="showAddDialog = false">
              <Icon icon="ph:x-bold" />
            </span>
          </div>
          
          <div class="search-section">
            <van-field
              v-model="searchKeyword"
              left-icon="search"
              placeholder="搜索手机号或用户名"
              @update:model-value="onSearch"
            />
          </div>

          <div v-if="searchResults.length > 0" class="search-results">
            <div 
              v-for="user in searchResults" 
              :key="user.id" 
              class="result-item"
              @click="selectUser(user)"
            >
              <van-image
                round
                width="40"
                height="40"
                :src="getAvatar(user.username)"
                fit="cover"
              />
              <div class="user-info">
                <div class="name">{{ user.nickname }}</div>
                <div class="phone">{{ user.phone }}</div>
              </div>
              <van-button 
                size="small" 
                type="primary" 
                v-if="!isAlreadyFamily(user.id)"
              >
                添加
              </van-button>
              <span v-else class="added-tag">已添加</span>
            </div>
          </div>
          
          <div v-else-if="searchKeyword" class="empty-search">
            未找到用户
          </div>
        </div>
      </van-popup>

      <!-- Relation Type Dialog -->
      <van-dialog v-model:show="showRelationDialog" title="确认关系" show-cancel-button @confirm="onConfirmAdd">
        <div class="relation-form">
          <p class="relation-tip">TA 是您的...</p>
          <van-radio-group v-model="selectedRelation">
            <van-cell-group inset>
              <van-cell title="配偶 (老公/老婆)" clickable @click="selectedRelation = 'spouse'">
                <template #right-icon>
                  <van-radio name="spouse" />
                </template>
              </van-cell>
              <van-cell title="父亲" clickable @click="selectedRelation = 'father'">
                <template #right-icon>
                  <van-radio name="father" />
                </template>
              </van-cell>
              <van-cell title="母亲" clickable @click="selectedRelation = 'mother'">
                <template #right-icon>
                  <van-radio name="mother" />
                </template>
              </van-cell>
              <van-cell title="孩子 (儿子/女儿)" clickable @click="selectedRelation = 'child'">
                <template #right-icon>
                  <van-radio name="child" />
                </template>
              </van-cell>
            </van-cell-group>
          </van-radio-group>
        </div>
      </van-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useFamilyStore } from '../app/store/family';
import { useAuthStore } from '../app/store/auth';
import { useMessageStore } from '../app/store/message';
import { Icon } from '@iconify/vue';
import { RadioGroup as VanRadioGroup, Radio as VanRadio } from 'vant';

const familyStore = useFamilyStore();
const auth = useAuthStore();
const msg = useMessageStore();

const showEditDialog = ref(false);
const editingMember = ref<any>(null);
const editingCall = ref('');

const showAddDialog = ref(false);
const searchKeyword = ref('');
const searchResults = ref<any[]>([]);
const showRelationDialog = ref(false);
const selectedUser = ref<any>(null);
const selectedRelation = ref('spouse');

onMounted(() => {
  familyStore.fetchFamilyList();
});

const getAvatar = (username: string) => {
  return 'https://api.dicebear.com/7.x/notionists/svg?seed=' + username + '&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';
};

const getGenderIcon = (gender: string) => {
  if (gender === 'male') return 'ph:gender-male-bold';
  if (gender === 'female') return 'ph:gender-female-bold';
  return 'ph:question-bold';
};

const showAddTip = () => {
  showAddDialog.value = true;
  searchKeyword.value = '';
  searchResults.value = [];
};

const handleEditCall = (member: any) => {
  if (member.id === auth.user?.id) return;
  editingMember.value = member;
  editingCall.value = member.display_call === '未设置' ? '' : member.display_call;
  showEditDialog.value = true;
};

const onConfirmCall = async () => {
  if (!editingMember.value) return;
  
  const success = await familyStore.updateCustomCall(editingMember.value.id, editingCall.value);
  if (success) {
    msg.show('称呼修改成功', 'success');
  } else {
    msg.show('修改失败，请重试', 'error');
  }
};

let searchTimer: any = null;
const onSearch = (val: string) => {
  if (searchTimer) clearTimeout(searchTimer);
  if (!val) {
    searchResults.value = [];
    return;
  }
  searchTimer = setTimeout(async () => {
    // 检查 familyStore.searchUser 是否存在且为函数
    if (typeof familyStore.searchUser === 'function') {
      searchResults.value = await familyStore.searchUser(val);
    } else {
      console.error('familyStore.searchUser is not a function. Check store definition.');
      // 临时降级处理，避免崩溃
      searchResults.value = [];
    }
  }, 500);
};

const isAlreadyFamily = (userId: number) => {
  if (userId === auth.user?.id) return true;
  return familyStore.list.some((m: any) => m.id === userId);
};

const selectUser = (user: any) => {
  if (isAlreadyFamily(user.id)) return;
  selectedUser.value = user;
  showRelationDialog.value = true;
};

const onConfirmAdd = async () => {
  if (!selectedUser.value) return;
  
  const success = await familyStore.addRelation(selectedUser.value.id, selectedRelation.value);
  if (success) {
    msg.show('添加家人成功', 'success');
    showRelationDialog.value = false;
    showAddDialog.value = false;
  } else {
    msg.show('添加失败，请重试', 'error');
  }
};
</script>

<style scoped>
.family-page {
  min-height: 100vh;
  background-color: var(--surface-2);
  padding-bottom: 90px; /* Space for tabbar */
  padding-top: 60px; /* Space for navbar */
}

.content {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 4px;
}

.summary-text {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.count {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
}

.label {
  font-size: 14px;
  color: var(--placeholder);
}

.add-btn {
  padding: 0 16px;
  height: 32px;
  line-height: 30px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  color: var(--placeholder);
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.family-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.family-card {
  display: flex;
  align-items: center;
  background: var(--bg);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s;
}

.family-card:active {
  transform: scale(0.98);
}

.card-left {
  margin-right: 16px;
}

.avatar-wrapper {
  position: relative;
  width: 50px;
  height: 50px;
}

.gender-badge {
  position: absolute;
  bottom: 0;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid var(--bg);
  font-size: 10px;
}

.gender-badge.male { background: #5ac8fa; }
.gender-badge.female { background: #ff2d55; }
.gender-badge.unknown { background: #8e8e93; }

.card-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg);
}

.me-tag {
  font-size: 10px;
  background: rgba(0, 122, 255, 0.1);
  color: var(--accent);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.role-row {
  display: flex;
}

.phone-text {
  font-size: 12px;
  color: var(--placeholder);
  display: flex;
  align-items: center;
  gap: 4px;
}

.phone-icon {
  opacity: 0.7;
}

.card-right {
  margin-left: 12px;
  cursor: pointer;
}

.call-badge {
  font-size: 13px;
  font-weight: 600;
  color: var(--placeholder);
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.call-badge.highlight {
  background: rgba(255, 45, 85, 0.1);
  color: #ff2d55;
}

.edit-icon {
  opacity: 0.5;
  font-size: 10px;
}

.call-badge:active {
  opacity: 0.7;
}

.edit-call-form {
  padding: 20px 16px;
}

/* New Styles for Add Family */
.add-family-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.popup-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--fg);
}

.close-btn {
  font-size: 20px;
  color: var(--placeholder);
  cursor: pointer;
}

.search-section {
  padding: 16px;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.result-item:active {
  background: var(--surface-2);
}

.user-info {
  flex: 1;
  margin-left: 12px;
}

.user-info .name {
  font-weight: 600;
  color: var(--fg);
}

.user-info .phone {
  font-size: 12px;
  color: var(--placeholder);
}

.added-tag {
  font-size: 12px;
  color: var(--placeholder);
}

.empty-search {
  padding: 40px;
  text-align: center;
  color: var(--placeholder);
}

.relation-form {
  padding: 16px 0;
}

.relation-tip {
  text-align: center;
  margin-bottom: 16px;
  color: var(--fg);
  font-weight: 600;
}
</style>
