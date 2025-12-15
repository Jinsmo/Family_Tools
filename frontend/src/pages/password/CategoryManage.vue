<template>
  <div class="category-manage page-container">
    <!-- 将新增按钮集成到 GlobalNavBar -->
    <teleport to=".right-actions" v-if="mounted">
       <button class="icon-btn" @click="showAddDialog" aria-label="新增分类">
          <van-icon name="plus" size="20" />
       </button>
    </teleport>

    <div class="header-section animate-fade-in-down">
      <h2 class="page-title">分类管理</h2>
      <p class="page-subtitle">管理您的密码分类标签</p>
    </div>

    <van-empty v-if="list.length === 0" description="暂无分类" class="animate-fade-in" />
    
    <div class="list-container" v-else>
      <van-swipe-cell 
        v-for="(item, index) in list" 
        :key="item.id" 
        class="category-item animate-slide-up"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="category-card">
          <div class="category-info">
            <div class="category-icon">
              <van-icon name="label-o" />
            </div>
            <span class="category-name">{{ item.name }}</span>
          </div>
          <div class="swipe-hint">
            <van-icon name="arrow-left" size="12" />
            <span>左滑编辑</span>
          </div>
        </div>
        <template #right>
          <div class="action-buttons">
            <button class="action-btn edit" @click="showEditDialog(item)">
              <van-icon name="edit" />
            </button>
            <button class="action-btn delete" @click="onDelete(item)">
              <van-icon name="delete-o" />
            </button>
          </div>
        </template>
      </van-swipe-cell>
    </div>

    <van-dialog 
      v-model:show="showDialog" 
      :title="isEdit ? '编辑分类' : '新增分类'" 
      show-cancel-button 
      @confirm="onConfirm"
      class="custom-dialog"
    >
      <div class="dialog-content">
        <van-field 
          v-model="form.name" 
          label="名称" 
          placeholder="请输入分类名称" 
          input-align="left" 
          border 
          class="custom-field"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { showToast, showDialog as showVantDialog } from 'vant';
import { getCategories, createCategory, updateCategory, deleteCategory, type Category } from '../../api/password';

const list = ref<Category[]>([]);
const showDialog = ref(false);
const isEdit = ref(false);
const currentId = ref<number | null>(null);
const mounted = ref(false);
const form = ref({
  name: '',
});

const loadList = async () => {
  try {
    list.value = await getCategories();
  } catch (error) {
    console.error(error);
  }
};

const showAddDialog = () => {
  isEdit.value = false;
  form.value.name = '';
  showDialog.value = true;
};

const showEditDialog = (item: Category) => {
  isEdit.value = true;
  currentId.value = item.id;
  form.value.name = item.name;
  showDialog.value = true;
};

const onConfirm = async () => {
  if (!form.value.name) {
    showToast('请输入名称');
    return;
  }
  try {
    if (isEdit.value && currentId.value) {
      await updateCategory(currentId.value, { name: form.value.name });
      showToast('更新成功');
    } else {
      await createCategory({ name: form.value.name, sort_order: 0 });
      showToast('创建成功');
    }
    loadList();
  } catch (error) {
    // error
  }
};

const onDelete = (item: Category) => {
  showVantDialog({
    title: '确认删除',
    message: `确定要删除分类“${item.name}”吗？`,
    showCancelButton: true,
  }).then(async () => {
    try {
      await deleteCategory(item.id);
      showToast('删除成功');
      loadList();
    } catch (error) {
      // error
    }
  }).catch(() => {});
};

onMounted(() => {
  mounted.value = true;
  loadList();
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--bg);
  padding-bottom: 40px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface);
  color: var(--fg);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.icon-btn:active {
  transform: scale(0.92);
  background-color: var(--surface-2);
}

.header-section {
  padding: 24px 20px;
  background: linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%);
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

.list-container {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.category-card {
  background-color: var(--surface);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: rgba(25, 137, 250, 0.1);
  color: #1989fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg);
}

.swipe-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--placeholder);
  opacity: 0.6;
}

.action-buttons {
  height: 100%;
  display: flex;
}

.action-btn {
  height: 100%;
  border: none;
  padding: 0 24px;
  color: white;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.action-btn.edit {
  background-color: #1989fa;
}

.action-btn.delete {
  background-color: #ff4d4f;
}

.dialog-content {
  padding: 24px 16px;
}

.custom-field {
  background-color: var(--surface-2);
  border-radius: 8px;
  padding: 8px 12px;
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

<style>
/* 非 scoped 样式，处理暗色模式适配 */
html.dark .category-manage {
  background-color: var(--bg) !important;
}

html.dark .category-manage .van-cell {
  background-color: var(--surface-2) !important;
  color: var(--fg) !important;
}

html.dark .category-manage .van-cell::after {
  border-bottom-color: #3a3a3c !important;
}

html.dark .icon-btn {
  background-color: var(--surface-2) !important;
  color: var(--fg) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}
</style>
