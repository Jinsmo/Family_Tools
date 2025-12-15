<template>
  <div class="password-home">
    <!-- Header Area -->
    <div class="page-header animate-fade-in-down">
      <div class="header-content">
        <h1 class="page-title">密码助手</h1>
        <p class="page-subtitle">安全管理您的所有账号</p>
      </div>
      <div class="header-decoration">
        <van-icon name="shield-o" size="48" color="rgba(25, 137, 250, 0.1)" />
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container animate-fade-in-down delay-1">
      <van-search 
        v-model="keyword" 
        placeholder="搜索名称、账号或备注" 
        shape="round"
        @search="onSearch"
        @clear="onSearch"
        background="transparent"
      />
    </div>

    <!-- Tabs -->
    <van-tabs 
      v-model:active="activeTab" 
      sticky 
      offset-top="0" 
      @change="onTabChange" 
      background="transparent"
      line-width="20px"
      line-height="3px"
      color="#1989fa"
      class="custom-tabs animate-fade-in-down delay-2"
    >
      <van-tab title="全部" name="all"></van-tab>
      <van-tab title="收藏" name="favorite"></van-tab>
      <van-tab v-for="cat in categories" :key="cat.id" :title="cat.name" :name="cat.id"></van-tab>
    </van-tabs>

    <!-- List -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="list-container">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div 
          v-for="(item, index) in list" 
          :key="item.id" 
          class="list-item-wrapper"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <van-swipe-cell class="password-card">
            <van-cell center :border="false" class="password-cell" @click="showDetail(item)">
              <template #icon>
                <div class="avatar-icon shadow-sm" :style="{ background: getRandomColor(item.title) }">
                  {{ item.title.charAt(0).toUpperCase() }}
                </div>
              </template>
              <template #title>
                <span class="cell-title">{{ item.title }}</span>
              </template>
              <template #label>
                <span class="cell-label">{{ item.account }}</span>
              </template>
              <template #right-icon>
                <div class="cell-right">
                  <div class="icon-btn-wrapper" @click.stop="toggleFavorite(item)">
                    <van-icon 
                      :name="item.is_favorite ? 'star' : 'star-o'" 
                      :color="item.is_favorite ? '#ffd21e' : '#c8c9cc'" 
                      class="action-icon star-icon" 
                      :class="{ 'is-active': item.is_favorite }"
                    />
                  </div>
                  <div class="icon-btn-wrapper" @click.stop="toEdit(item.id)">
                    <van-icon name="edit" class="action-icon edit-icon" />
                  </div>
                </div>
              </template>
            </van-cell>
            <template #right>
              <div class="swipe-actions">
                <van-button square icon="edit" type="primary" class="swipe-btn edit-swipe" @click.stop="toEdit(item.id)" />
                <van-button square icon="delete" type="danger" class="swipe-btn delete-swipe" @click.stop="onDelete(item)" />
              </div>
            </template>
          </van-swipe-cell>
        </div>
      </van-list>
    </van-pull-refresh>

    <!-- Floating Action Button -->
    <div class="add-btn hover-scale" @click="toAdd">
      <van-icon name="plus" />
    </div>

    <!-- 详情弹窗 -->
    <van-dialog 
      v-model:show="showDetailDialog" 
      :title="currentItem?.title" 
      show-cancel-button 
      confirm-button-text="复制密码" 
      cancel-button-text="关闭"
      @confirm="copyPassword"
      class="custom-dialog"
    >
        <div class="detail-content">
            <div class="detail-item">
              <span class="label">账号</span>
              <div class="value-row">
                <span class="value">{{ currentItem?.account }}</span>
                <van-icon name="description" class="copy-btn" @click="copyText(currentItem?.account || '')" />
              </div>
            </div>
            
            <div class="detail-item">
                <span class="label">密码</span>
                <div class="value-row">
                  <div class="password-display" :class="{ 'is-hidden': !passwordVisible }">
                    <span v-if="passwordVisible">{{ currentPassword }}</span>
                    <span v-else>••••••••</span>
                  </div>
                  <van-icon 
                    :name="passwordVisible ? 'eye-o' : 'closed-eye'" 
                    @click="togglePassword" 
                    class="action-btn"
                  />
                </div>
            </div>

            <div v-if="currentItem?.url" class="detail-item">
              <span class="label">网址</span>
              <div class="value-row">
                <a :href="formatUrl(currentItem?.url)" target="_blank" class="link-value">{{ currentItem?.url }}</a>
              </div>
            </div>

            <div v-if="currentItem?.remark" class="detail-item">
              <span class="label">备注</span>
              <div class="value-row">
                <span class="value text-wrap">{{ currentItem?.remark }}</span>
              </div>
            </div>
            
            <div class="detail-item">
              <span class="label">收藏</span>
              <div class="value-row">
                 <van-icon 
                    :name="currentItem?.is_favorite ? 'star' : 'star-o'" 
                    :color="currentItem?.is_favorite ? '#ffd21e' : '#969799'" 
                    size="22"
                    class="star-btn"
                    @click="toggleDetailFavorite"
                  />
              </div>
            </div>
        </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showDialog } from 'vant';
import { getCategories, getEntries, deleteEntry, updateEntry, getEntryPassword, type Category, type Entry } from '../../api/password';

const router = useRouter();
const keyword = ref('');
const activeTab = ref<string | number>('all');
const categories = ref<Category[]>([]);
const list = ref<Entry[]>([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);

const showDetailDialog = ref(false);
const currentItem = ref<Entry | null>(null);
const currentPassword = ref('');
const passwordVisible = ref(false);

const colors = ['#1989fa', '#07c160', '#ff976a', '#ee0a24', '#7232dd', '#ffc300', '#00b578', '#fa8c16'];
const getRandomColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

const initCategories = async () => {
  try {
    categories.value = await getCategories();
  } catch (error) {
    console.error(error);
  }
};

const loadList = async () => {
  loading.value = true;
  try {
    const params: any = { keyword: keyword.value };
    if (activeTab.value === 'favorite') {
      params.is_favorite = true;
    } else if (activeTab.value !== 'all') {
      params.category_id = activeTab.value;
    }

    const res = await getEntries(params);
    if (refreshing.value) {
      list.value = res;
      refreshing.value = false;
    } else {
      list.value = res; // 由于没有分页，直接覆盖
    }
    finished.value = true;
  } catch (error) {
    console.error(error);
    finished.value = true;
  } finally {
    loading.value = false;
  }
};

const onLoad = () => {
  // 首次加载由 onMounted 触发，这里主要用于 van-list 逻辑，但因为是一次性拉取，所以直接结束
  if (list.value.length === 0) {
    loadList();
  } else {
    loading.value = false;
    finished.value = true;
  }
};

const onRefresh = () => {
  finished.value = false;
  loading.value = true;
  refreshing.value = true;
  loadList();
};

const onSearch = () => {
  onRefresh();
};

const onTabChange = () => {
  onRefresh();
};

const toAdd = () => {
  router.push('/password/edit');
};

const toEdit = (id: number) => {
  router.push(`/password/edit?id=${id}`);
};

const toggleFavorite = async (item: Entry) => {
  try {
    const newStatus = !item.is_favorite;
    await updateEntry(item.id, {
      ...item,
      is_favorite: newStatus ? 1 : 0
    });
    item.is_favorite = newStatus ? 1 : 0;
    showToast(newStatus ? '已收藏' : '已取消收藏');
  } catch (error) {
    console.error(error);
    showToast('操作失败');
  }
};

const toggleDetailFavorite = async () => {
  if (currentItem.value) {
    await toggleFavorite(currentItem.value);
  }
};

const onDelete = (item: Entry) => {
  showDialog({
    title: '确认删除',
    message: `确定要删除“${item.title}”吗？`,
    showCancelButton: true,
  }).then(async () => {
    try {
      await deleteEntry(item.id);
      showToast('删除成功');
      onRefresh();
    } catch (error) {
      // error handled by request interceptor
    }
  }).catch(() => {});
};

const showDetail = (item: Entry) => {
  currentItem.value = item;
  currentPassword.value = '';
  passwordVisible.value = false;
  showDetailDialog.value = true;
};

const togglePassword = async () => {
  if (passwordVisible.value) {
    passwordVisible.value = false;
  } else {
    if (currentPassword.value) {
      passwordVisible.value = true;
    } else if (currentItem.value) {
      try {
        const res = await getEntryPassword(currentItem.value.id);
        currentPassword.value = res.password;
        passwordVisible.value = true;
      } catch (error) {
        // error
      }
    }
  }
};

const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    showToast('复制成功');
  }).catch(() => {
    showToast('复制失败');
  });
};

const copyPassword = async () => {
  if (!currentPassword.value && currentItem.value) {
     try {
        const res = await getEntryPassword(currentItem.value.id);
        currentPassword.value = res.password;
     } catch (e) {
       return;
     }
  }
  copyText(currentPassword.value);
};

const formatUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://${url}`;
};

onMounted(() => {
  initCategories();
  loadList();
});
</script>

<style scoped>
.password-home {
  padding-bottom: 90px;
  min-height: 100vh;
  background-color: #f7f8fa;
}

/* Header */
.page-header {
  padding: 24px 20px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #323233;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 14px;
  color: #969799;
  margin: 0;
}

.header-decoration {
  opacity: 0.8;
  transform: rotate(15deg);
}

/* Search */
.search-container {
  padding: 0 12px;
}

/* List Item */
.list-item-wrapper {
  animation: slideUp 0.5s ease backwards;
}

.password-card {
  margin: 12px 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  background: #ffffff;
  transition: transform 0.2s, box-shadow 0.2s;
}

.password-card:active {
  transform: scale(0.98);
}

.password-cell {
  padding: 16px;
  background: transparent;
}

.avatar-icon {
    width: 44px;
    height: 44px;
    color: white;
    border-radius: 12px;
    text-align: center;
    line-height: 44px;
    margin-right: 16px;
    font-size: 20px;
    font-weight: bold;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.cell-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.cell-label {
  font-size: 13px;
  color: #969799;
  margin-top: 4px;
}

.cell-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.icon-btn-wrapper:active {
  background-color: #f2f3f5;
}

.action-icon {
  font-size: 20px;
  color: #c8c9cc;
}

.edit-icon {
  color: #1989fa;
}

.star-icon.is-active {
  animation: pulse 0.3s;
}

/* Swipe Actions */
.swipe-actions {
  height: 100%;
  display: flex;
}

.swipe-btn {
  height: 100%;
  border: none;
  border-radius: 0;
}

/* FAB */
.add-btn {
    position: fixed;
    bottom: 80px;
    right: 24px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #1989fa, #0570db);
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    box-shadow: 0 8px 24px rgba(25, 137, 250, 0.4);
    z-index: 99;
    transition: transform 0.2s, box-shadow 0.2s;
}

.hover-scale:active {
  transform: scale(0.9) rotate(90deg);
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
}

/* Detail Dialog */
.detail-content {
  padding: 24px 20px;
}

.detail-item {
  margin-bottom: 20px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.label {
  display: block;
  font-size: 12px;
  color: #969799;
  margin-bottom: 6px;
}

.value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f7f8fa;
  padding: 10px 12px;
  border-radius: 8px;
}

.value {
  font-size: 15px;
  color: #323233;
  font-weight: 500;
  word-break: break-all;
}

.text-wrap {
  white-space: pre-wrap;
}

.link-value {
  color: #1989fa;
  text-decoration: none;
}

.password-display {
  font-family: monospace;
  font-size: 16px;
  color: #323233;
}

.password-display.is-hidden {
  color: #969799;
  letter-spacing: 2px;
}

.copy-btn, .action-btn {
  padding: 4px;
  font-size: 18px;
  color: #969799;
  cursor: pointer;
}

.copy-btn:active, .action-btn:active {
  color: #323233;
}

/* Animations */
.animate-fade-in-down {
  animation: fadeInDown 0.6s ease-out;
}

.delay-1 { animation-delay: 0.1s; animation-fill-mode: backwards; }
.delay-2 { animation-delay: 0.2s; animation-fill-mode: backwards; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* Dark Mode */
/* Moved to global style block below */

/* Vant Overrides */
:deep(.van-search__content) {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
</style>

<style>
/* Dark Mode Styles - Global Scope to ensure correct application */
html.dark .password-home {
  background-color: var(--bg) !important;
}

html.dark .password-home .page-title {
  color: var(--fg) !important;
}

html.dark .password-home .page-subtitle {
  color: rgba(255, 255, 255, 0.6) !important;
}

html.dark .password-home .password-card {
  background-color: var(--surface-2) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
}

html.dark .password-home .cell-title {
  color: var(--fg) !important;
}

html.dark .password-home .cell-label {
  color: rgba(255, 255, 255, 0.6) !important;
}

html.dark .password-home .value-row {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

html.dark .password-home .value,
html.dark .password-home .password-display {
  color: var(--fg) !important;
}

html.dark .password-home .label {
  color: rgba(255, 255, 255, 0.6) !important;
}

html.dark .password-home .copy-btn,
html.dark .password-home .action-btn {
  color: rgba(255, 255, 255, 0.6) !important;
}

html.dark .password-home .copy-btn:active,
html.dark .password-home .action-btn:active {
  color: var(--fg) !important;
}

html.dark .password-home .icon-btn-wrapper:active {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

html.dark .password-home .van-search__content {
  background-color: var(--surface-2) !important;
  box-shadow: none !important;
}

html.dark .password-home .van-search__field .van-field__control {
  color: var(--fg) !important;
}

html.dark .password-home .van-tabs__nav {
  background-color: transparent !important;
}

html.dark .password-home .van-tab {
  color: rgba(255, 255, 255, 0.6) !important;
}

html.dark .password-home .van-tab--active {
  color: #1989fa !important;
}

/* Dialog Dark Mode - Dialog is appended to body, so we target it globally but specific to this context if possible, or just general dark mode override */
html.dark .van-dialog {
  background-color: var(--surface-2) !important;
}

html.dark .van-dialog__header {
  color: var(--fg) !important;
}

html.dark .van-dialog__message {
  color: rgba(255, 255, 255, 0.8) !important;
}
</style>