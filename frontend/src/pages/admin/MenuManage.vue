<template>
  <div class="page-container">
    <van-tabs v-model:active="activeTab" sticky>
      <!-- 菜品列表 Tab -->
      <van-tab title="菜品列表" name="items">
        <div class="content-list" :class="{ 'has-bottom-bar': isSelectionMode }">
          <div class="search-bar-wrapper">
            <van-search v-model="searchText" placeholder="搜索菜品" />
            <div class="batch-btn" @click="toggleSelectionMode">
              {{ isSelectionMode ? '取消' : '批量' }}
            </div>
          </div>
          
          <div class="item-grid">
            <van-checkbox-group v-model="selectedItems">
              <transition-group name="list">
                <div v-for="item in filteredItems" :key="item.id" class="menu-item-wrapper" @click="toggleItemSelection(item.id)">
                  <div v-if="isSelectionMode" class="checkbox-wrapper">
                    <van-checkbox :name="item.id" @click.stop />
                  </div>
                  <div class="menu-item-card">
                    <van-image :src="item.image_url" width="80" height="80" radius="8" fit="cover" class="item-img" />
                    <div class="item-info">
                      <div class="item-header">
                        <span class="item-name">{{ item.name }}</span>
                        <van-tag :type="item.status === 1 ? 'success' : 'danger'" plain round>{{ item.status === 1 ? '上架' : '下架' }}</van-tag>
                      </div>
                      <div class="item-meta">
                        <span class="category-tag">
                          <Icon icon="ph:tag-simple-bold" class="tag-icon"/>
                          {{ item.category_name }}
                        </span>
                        <span class="price">
                          <Icon icon="ph:diamond-bold" class="price-icon"/>
                          {{ item.price_points }}
                        </span>
                      </div>
                      <div class="item-actions" v-if="!isSelectionMode">
                        <van-button size="mini" round plain type="primary" @click.stop="editItem(item)">
                          <Icon icon="ph:pencil-simple-bold" />
                        </van-button>
                        <van-button size="mini" round plain type="danger" @click.stop="deleteItem(item)">
                          <Icon icon="ph:trash-bold" />
                        </van-button>
                      </div>
                    </div>
                  </div>
                </div>
              </transition-group>
            </van-checkbox-group>
          </div>
          <van-empty v-if="filteredItems.length === 0" description="暂无菜品" />
        </div>
        
        <div class="fab-btn" @click="showAddItem" v-if="!isSelectionMode">
          <Icon icon="ph:plus-bold" />
        </div>
      </van-tab>

      <!-- 分类管理 Tab -->
      <van-tab title="分类管理" name="categories">
        <div class="content-list">
          <van-cell-group inset class="category-list">
            <template v-for="cat in categoryTree" :key="cat.id">
              <!-- 父分类 -->
              <van-swipe-cell>
                <van-cell 
                  :title="cat.name" 
                  center 
                  @click="editCategory(cat)"
                  class="parent-category"
                >
                  <template #icon>
                    <Icon icon="ph:folder-open-fill" class="cat-icon" />
                  </template>
                  <template #value>
                    <span class="sort-val">排序: {{ cat.sort }}</span>
                  </template>
                  <template #right-icon>
                    <div class="cat-actions">
                      <van-icon name="add-o" class="action-icon success" @click.stop="addSubCategory(cat)" />
                      <van-icon name="edit" class="action-icon primary" @click.stop="editCategory(cat)" />
                      <van-icon name="delete-o" class="action-icon danger" @click.stop="deleteCategory(cat)" />
                    </div>
                  </template>
                </van-cell>
                <template #right>
                  <van-button square text="添加子类" type="success" class="swipe-btn" @click.stop="addSubCategory(cat)" />
                  <van-button square text="编辑" type="primary" class="swipe-btn" @click.stop="editCategory(cat)" />
                  <van-button square text="删除" type="danger" class="swipe-btn" @click.stop="deleteCategory(cat)" />
                </template>
              </van-swipe-cell>

              <!-- 子分类 -->
              <van-swipe-cell v-for="sub in cat.children" :key="sub.id">
                <van-cell 
                  :title="sub.name" 
                  center 
                  @click="editCategory(sub)"
                  class="sub-category"
                >
                  <template #icon>
                    <Icon icon="ph:arrow-elbow-down-right" class="sub-icon" />
                  </template>
                  <template #value>
                    <span class="sort-val">排序: {{ sub.sort }}</span>
                  </template>
                  <template #right-icon>
                    <div class="cat-actions">
                      <van-icon name="edit" class="action-icon primary" @click.stop="editCategory(sub)" />
                      <van-icon name="delete-o" class="action-icon danger" @click.stop="deleteCategory(sub)" />
                    </div>
                  </template>
                </van-cell>
                <template #right>
                  <van-button square text="编辑" type="primary" class="swipe-btn" @click.stop="editCategory(sub)" />
                  <van-button square text="删除" type="danger" class="swipe-btn" @click.stop="deleteCategory(sub)" />
                </template>
              </van-swipe-cell>
            </template>
          </van-cell-group>
          <van-empty v-if="categories.length === 0" description="暂无分类" />
        </div>

        <div class="fab-btn" @click="showAddCategory">
          <Icon icon="ph:plus-bold" />
        </div>
      </van-tab>
    </van-tabs>

    <van-submit-bar
      v-if="isSelectionMode && activeTab === 'items'"
      :price="0"
      button-text="删除"
      @submit="deleteSelectedItems"
      class="batch-action-bar"
      :loading="batchDeleting"
    >
      <van-checkbox v-model="isAllSelected" @click="toggleSelectAll">全选</van-checkbox>
      <template #tip>
        已选择 {{ selectedItems.length }} 项
      </template>
    </van-submit-bar>

    <!-- Category Edit Popup -->
    <van-popup v-model:show="showCategoryDialog" position="bottom" round :style="{ height: '50%' }">
      <div class="popup-content">
        <div class="popup-header">
          <h3>{{ categoryForm.id ? '编辑分类' : '添加分类' }}</h3>
          <span class="close-btn" @click="showCategoryDialog = false"><Icon icon="ph:x-bold" /></span>
        </div>
        <div class="popup-body">
          <van-form @submit="saveCategory">
            <van-cell-group inset>
              <van-field v-model="categoryForm.name" label="分类名称" placeholder="请输入分类名称" :rules="[{ required: true }]" />
              <van-field v-model="categoryForm.sort" type="digit" label="排序权重" placeholder="数值越小越靠前" />
              
              <!-- 父级分类选择 -->
              <van-field name="parent_id" label="父级分类">
                <template #input>
                  <van-radio-group v-model="categoryForm.parent_id" direction="horizontal">
                    <van-radio :name="null">无 (一级分类)</van-radio>
                    <van-radio v-for="cat in rootCategories" :key="cat.id" :name="cat.id" v-show="cat.id !== categoryForm.id">
                      {{ cat.name }}
                    </van-radio>
                  </van-radio-group>
                </template>
              </van-field>
            </van-cell-group>
            
            <div style="margin: 16px;">
              <van-button round block type="primary" native-type="submit" :loading="saving">
                保存
              </van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>

    <!-- Item Edit Popup -->
    <van-popup v-model:show="showItemPopup" position="bottom" round :style="{ height: '90%' }">
      <div class="popup-content">
        <div class="popup-header">
          <h3>{{ itemForm.id ? '编辑菜品' : '添加菜品' }}</h3>
          <span class="close-btn" @click="showItemPopup = false"><Icon icon="ph:x-bold" /></span>
        </div>
        
        <div class="popup-body">
          <van-form @submit="saveItem">
            <van-tabs v-model:active="itemTab">
              <van-tab title="基本信息">
                <van-cell-group inset>
                  <van-field v-model="itemForm.name" label="菜名" placeholder="请输入菜名" :rules="[{ required: true }]" />
                  <van-field
                    v-model="categoryDisplayText"
                    is-link
                    readonly
                    label="分类"
                    placeholder="请选择分类"
                    @click="showCategoryPicker = true"
                    :rules="[{ required: true, message: '请选择分类' }]"
                  />
                  <van-popup v-model:show="showCategoryPicker" round position="bottom">
                    <van-cascader
                      v-model="itemForm.category_id"
                      title="请选择分类"
                      :options="categoryOptions"
                      :field-names="{ text: 'name', value: 'id', children: 'children' }"
                      @close="showCategoryPicker = false"
                      @finish="onFinishCategory"
                    />
                  </van-popup>
                  
                  <van-field name="imageType" label="图片来源">
                    <template #input>
                      <van-radio-group v-model="imageType" direction="horizontal">
                        <van-radio name="url">链接</van-radio>
                        <van-radio name="upload">上传</van-radio>
                      </van-radio-group>
                    </template>
                  </van-field>

                  <van-field v-if="imageType === 'url'" v-model="itemForm.image_url" label="图片URL" placeholder="http://..." />
                  
                  <van-field v-else name="uploader" label="图片上传">
                    <template #input>
                      <van-uploader v-model="fileList" :max-count="1" :after-read="afterRead" />
                    </template>
                  </van-field>

                  <van-field v-model.number="itemForm.price_points" label="价格" type="number" />
                  <van-field v-model="itemForm.description" label="描述" type="textarea" rows="2" autosize />
                  <van-field name="status" label="状态">
                    <template #input>
                      <van-switch v-model="itemForm.status" :active-value="1" :inactive-value="0" />
                      <span class="status-text">{{ itemForm.status === 1 ? '上架' : '下架' }}</span>
                    </template>
                  </van-field>
                </van-cell-group>
              </van-tab>
              
              <van-tab title="详情配方">
                <div class="detail-section">
                  <div class="section-title">配料表</div>
                  <div v-for="(ing, index) in itemForm.details.ingredients" :key="index" class="ingredient-row">
                    <van-field v-model="ing.name" placeholder="食材名" class="ing-input" />
                    <van-field v-model="ing.amount" placeholder="用量" class="ing-input" />
                    <Icon icon="ph:trash-simple-bold" class="del-icon" @click="removeIngredient(index)" />
                  </div>
                  <van-button size="small" block plain type="primary" @click="addIngredient" style="margin-top: 8px">+ 添加配料</van-button>
                  
                  <div class="section-title" style="margin-top: 16px">制作步骤</div>
                  <van-field v-model="itemForm.details.recipe_steps" type="textarea" rows="4" placeholder="每行一步骤..." autosize class="step-input" />
                  
                  <div class="section-title" style="margin-top: 16px">小贴士</div>
                  <van-field v-model="itemForm.details.tips" type="textarea" rows="2" placeholder="注意事项..." />
                </div>
              </van-tab>
              
              <van-tab title="规格选项">
                <div class="detail-section">
                  <div v-for="(spec, index) in itemForm.specs" :key="index" class="spec-card">
                    <div class="spec-header">
                      <span>规格 {{ index + 1 }}</span>
                      <Icon icon="ph:trash-simple-bold" class="del-icon" @click="removeSpec(index)" />
                    </div>
                    <van-field v-model="spec.spec_name" label="规格名" placeholder="如: 辣度" />
                    <van-field v-model="spec.optionsStr" label="选项" placeholder="逗号分隔，如: 微辣,特辣" />
                    <van-cell center title="支持多选" class="spec-switch-cell">
                      <template #right-icon>
                        <van-switch v-model="spec.is_multiple" size="20" :active-value="1" :inactive-value="0" />
                      </template>
                    </van-cell>
                  </div>
                  <van-button block plain type="primary" @click="addSpec" style="margin-top: 12px">+ 添加规格</van-button>
                </div>
              </van-tab>
            </van-tabs>
            
            <div class="form-footer">
              <van-button round block type="primary" native-type="submit" :loading="saving">保存</van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { showToast, showDialog } from 'vant';
import request from '../../app/request';

const router = useRouter();
const activeTab = ref('items');
const itemTab = ref(0);
const searchText = ref('');

// Batch Selection Logic
const isSelectionMode = ref(false);
const selectedItems = ref<number[]>([]);
const batchDeleting = ref(false);
const isAllSelected = ref(false);

const toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value;
  selectedItems.value = [];
  isAllSelected.value = false;
};

const toggleItemSelection = (id: number) => {
  if (!isSelectionMode.value) return;
  const index = selectedItems.value.indexOf(id);
  if (index === -1) {
    selectedItems.value.push(id);
  } else {
    selectedItems.value.splice(index, 1);
  }
  updateAllSelectedState();
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = filteredItems.value.map(i => i.id);
  } else {
    selectedItems.value = [];
  }
};

const updateAllSelectedState = () => {
  isAllSelected.value = selectedItems.value.length === filteredItems.value.length && filteredItems.value.length > 0;
};

const deleteSelectedItems = () => {
  if (selectedItems.value.length === 0) {
    showToast('请先选择菜品');
    return;
  }
  
  showDialog({
    title: '提示',
    message: `确定要删除选中的 ${selectedItems.value.length} 个菜品吗？`,
    showCancelButton: true
  }).then(async (action) => {
    if (action === 'confirm') {
      batchDeleting.value = true;
      try {
        await request.post('/api/menu/items/batch-delete', { ids: selectedItems.value });
        showToast('批量删除成功');
        selectedItems.value = [];
        isAllSelected.value = false;
        isSelectionMode.value = false;
        fetchItems();
      } catch (e: any) {
        showToast(e.response?.data?.error || '删除失败');
      } finally {
        batchDeleting.value = false;
      }
    }
  });
};

// Data
const categories = ref<any[]>([]);
const items = ref<any[]>([]);
const saving = ref(false);

// Upload logic
const imageType = ref('url');
const fileList = ref<any[]>([]);

const afterRead = async (file: any) => {
  file.status = 'uploading';
  file.message = '上传中...';

  try {
    const formData = new FormData();
    formData.append('file', file.file);
    
    const res: any = await request.post('/api/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    file.status = 'done';
    file.message = '上传成功';
    itemForm.value.image_url = res.url;
  } catch (e) {
    file.status = 'failed';
    file.message = '上传失败';
    showToast('上传失败');
  }
};

// Filtered Items
const filteredItems = computed(() => {
  if (!searchText.value) return items.value;
  return items.value.filter(i => i.name.includes(searchText.value));
});

// --- Category Logic ---
const showCategoryDialog = ref(false);
const categoryForm = ref<any>({});

const rootCategories = computed(() => categories.value.filter(c => !c.parent_id));

const categoryTree = computed(() => {
  const roots = categories.value.filter(c => !c.parent_id);
  return roots.map(root => ({
    ...root,
    children: categories.value.filter(c => c.parent_id === root.id)
  }));
});

const fetchCategories = async () => {
  try {
    const res: any = await request.get('/api/menu/categories');
    categories.value = res;
  } catch (e) { console.error(e); }
};

const showAddCategory = () => {
  categoryForm.value = { sort: 0, parent_id: null };
  showCategoryDialog.value = true;
};

const addSubCategory = (parent: any) => {
  categoryForm.value = { sort: 0, parent_id: parent.id };
  showCategoryDialog.value = true;
};

const editCategory = (cat: any) => {
  categoryForm.value = { ...cat };
  showCategoryDialog.value = true;
};

const saveCategory = async () => {
  try {
    if (categoryForm.value.id) {
      await request.put(`/api/menu/categories/${categoryForm.value.id}`, categoryForm.value);
    } else {
      await request.post('/api/menu/categories', categoryForm.value);
    }
    showToast('保存成功');
    showCategoryDialog.value = false;
    fetchCategories();
  } catch (e: any) {
    showToast(e.response?.data?.error || '保存失败');
  }
};

const deleteCategory = (cat: any) => {
  showDialog({
    title: '确认删除',
    message: `确定要删除分类“${cat.name}”吗？\n如果该分类下有菜品或子分类，将无法删除。`,
    showCancelButton: true
  }).then(async (action) => {
    if (action === 'confirm') {
      try {
        await request.delete(`/api/menu/categories/${cat.id}`);
        showToast('删除成功');
        fetchCategories();
      } catch (e: any) {
        showDialog({
          title: '无法删除',
          message: e.response?.data?.error || '删除失败，请重试'
        });
      }
    }
  });
};

// --- Item Logic ---
const showItemPopup = ref(false);
const itemForm = ref<any>({
  status: 1,
  price_points: 0,
  description: '',
  name: '',
  image_url: '',
  category_id: null,
  details: { ingredients: [] },
  specs: []
});

const fetchItems = async () => {
  try {
    const res: any = await request.get('/api/menu/admin/items');
    items.value = res;
  } catch (e) { console.error(e); }
};

const showCategoryPicker = ref(false);
const categoryDisplayText = ref('');

// Computed category options for Cascader
const categoryOptions = computed(() => {
  // Build a tree structure: Root -> Children
  const roots = categories.value.filter(c => !c.parent_id);
  return roots.map(root => {
    const children = categories.value.filter(c => c.parent_id === root.id);
    if (children.length > 0) {
      return { ...root, children };
    }
    return root;
  });
});

const onFinishCategory = ({ selectedOptions }: any) => {
  showCategoryPicker.value = false;
  categoryDisplayText.value = selectedOptions.map((option: any) => option.name).join(' / ');
};

const showAddItem = () => {
  itemForm.value = {
    status: 1,
    price_points: 0,
    description: '',
    name: '',
    image_url: '',
    category_id: null,
    details: { ingredients: [] },
    specs: []
  };
  categoryDisplayText.value = '';
  imageType.value = 'url';
  fileList.value = [];
  itemTab.value = 0;
  showItemPopup.value = true;
};

const editItem = async (item: any) => {
  try {
    const res: any = await request.get(`/api/menu/admin/item/${item.id}`);
    // Process specs for display (array to comma string)
    if (res.specs) {
      res.specs.forEach((s: any) => {
        if (Array.isArray(s.spec_options)) {
          s.optionsStr = s.spec_options.join(',');
        } else if (typeof s.spec_options === 'string') {
           // Should be parsed by backend or axios if JSON, but let's be safe
           try {
             s.optionsStr = JSON.parse(s.spec_options).join(',');
           } catch (e) { s.optionsStr = s.spec_options; }
        }
      });
    }
    // Process details
    if (!res.details) res.details = { ingredients: [] };
    if (typeof res.details.ingredients === 'string') {
      try { res.details.ingredients = JSON.parse(res.details.ingredients); } catch(e) {}
    }
    if (!res.details.ingredients) res.details.ingredients = [];

    itemForm.value = res;
    
    // Set category display text
    if (itemForm.value.category_id) {
      const cat = categories.value.find(c => c.id === itemForm.value.category_id);
      if (cat) {
        if (cat.parent_id) {
           const parent = categories.value.find(c => c.id === cat.parent_id);
           categoryDisplayText.value = parent ? `${parent.name} / ${cat.name}` : cat.name;
        } else {
           categoryDisplayText.value = cat.name;
        }
      }
    } else {
      categoryDisplayText.value = '';
    }

    // Set upload state
    if (itemForm.value.image_url && itemForm.value.image_url.startsWith('/uploads')) {
      imageType.value = 'upload';
      fileList.value = [{ url: itemForm.value.image_url, isImage: true }];
    } else {
      imageType.value = 'url';
      fileList.value = [];
    }

    itemTab.value = 0;
    showItemPopup.value = true;
  } catch (e) {
    showToast('获取详情失败');
  }
};

const deleteItem = (item: any) => {
  showDialog({
    title: '提示',
    message: `确定要删除“${item.name}”吗？`,
    showCancelButton: true
  }).then(async (action) => {
    if (action === 'confirm') {
      try {
        await request.delete(`/api/menu/items/${item.id}`);
        showToast('删除成功');
        fetchItems();
      } catch (e) {
        // error handled
      }
    }
  });
};

// Detail Helpers
const addIngredient = () => {
  if (!itemForm.value.details) itemForm.value.details = { ingredients: [] };
  itemForm.value.details.ingredients.push({ name: '', amount: '' });
};
const removeIngredient = (index: number) => {
  itemForm.value.details.ingredients.splice(index, 1);
};

// Spec Helpers
const addSpec = () => {
  if (!itemForm.value.specs) itemForm.value.specs = [];
  itemForm.value.specs.push({ spec_name: '', optionsStr: '', is_multiple: 0 });
};
const removeSpec = (index: number) => {
  itemForm.value.specs.splice(index, 1);
};

const saveItem = async () => {
  saving.value = true;
  try {
    const data = JSON.parse(JSON.stringify(itemForm.value)); // Deep clone
    
    // Process specs: string to array
    if (data.specs) {
      data.specs = data.specs.map((s: any) => ({
        spec_name: s.spec_name,
        spec_options: s.optionsStr.split(/[,，]/).map((o: string) => o.trim()).filter((o: string) => o),
        is_multiple: s.is_multiple
      })).filter((s: any) => s.spec_name && s.spec_options.length > 0);
    }
    
    // Filter empty ingredients
    if (data.details && data.details.ingredients) {
      data.details.ingredients = data.details.ingredients.filter((i: any) => i.name);
    }

    if (data.id) {
      await request.put(`/api/menu/items/${data.id}`, data);
    } else {
      await request.post('/api/menu/items', data);
    }
    showToast('保存成功');
    showItemPopup.value = false;
    fetchItems();
  } catch (e) {
    // error handled
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchCategories();
  fetchItems();
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--bg);
}

.content-list {
  padding-bottom: 80px;
}



.item-grid {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item-card {
  display: flex;
  background: var(--surface-1);
  padding: 12px;
  border-radius: 12px;
  gap: 12px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-name {
  font-weight: bold;
  font-size: 16px;
  color: var(--fg);
}

.item-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--placeholder);
  margin: 4px 0;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Category Tree Styles */
.parent-category {
  font-weight: bold;
  background-color: var(--surface-1);
}

.sub-category {
  background-color: var(--surface-2);
  padding-left: 32px;
}

.cat-icon {
  font-size: 20px;
  color: var(--accent);
  margin-right: 8px;
}

.sub-icon {
  font-size: 16px;
  color: var(--placeholder);
  margin-right: 8px;
}

.swipe-btn {
  height: 100%;
}

/* Popup Styles */
.popup-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-1);
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--fg);
}

.close-btn {
  font-size: 24px;
  color: var(--placeholder);
  cursor: pointer;
}

.popup-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.detail-section {
  padding: 16px;
  background: var(--surface-1);
  margin: 12px;
  border-radius: 12px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--fg);
}

.ingredient-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.ing-input {
  background: var(--bg);
  border-radius: 8px;
}

.del-icon {
  color: #ee0a24;
  font-size: 20px;
}

.spec-card {
  background: var(--bg);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px dashed var(--border);
}

.spec-switch-cell {
  background: transparent;
  padding: 10px 16px;
  border-radius: 8px;
}

.spec-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
}

.status-text {
  margin-left: 8px;
  font-size: 14px;
  color: var(--fg);
}

.form-footer {
  padding: 24px 16px;
}

/* Dark mode */
:global(html.dark) .menu-item-card,
:global(html.dark) .detail-section {
  background-color: var(--surface-1);
}
:global(html.dark) .ing-input,
:global(html.dark) .spec-card {
  background-color: #2c2c2e;
}

.search-bar-wrapper {
  display: flex;
  align-items: center;
  padding-right: 16px;
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  background-color: rgba(var(--bg-rgb), 0.8);
}
.search-bar-wrapper .van-search {
  flex: 1;
  background: transparent;
}
.batch-btn {
  font-size: 14px;
  color: var(--primary);
  padding: 6px 16px;
  cursor: pointer;
  background: var(--surface-2);
  border-radius: 20px;
  font-weight: 500;
  transition: all 0.2s;
}
.batch-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.menu-item-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface-1);
  border-radius: 16px;
  overflow: hidden;
  padding-right: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 12px;
}
.menu-item-wrapper:active {
  transform: scale(0.99);
}
.checkbox-wrapper {
  padding-left: 16px;
}
.menu-item-wrapper .menu-item-card {
  flex: 1;
  background: transparent;
  padding: 12px;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
}
.menu-item-card {
  display: flex;
  gap: 16px;
}
.item-img {
  flex-shrink: 0;
  border: 1px solid var(--border);
}
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.item-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--fg);
  line-height: 1.4;
  margin-right: 8px;
}
.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--placeholder);
  margin-bottom: 8px;
}
.category-tag, .price {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tag-icon, .price-icon {
  font-size: 14px;
}
.price {
  color: var(--accent);
  font-weight: 600;
}
.item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.item-actions .van-button {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-list.has-bottom-bar {
  padding-bottom: 100px;
}
/* Fix submit bar price hiding */
:deep(.van-submit-bar__price) {
  display: none;
}
/* Ensure submit bar is visible and above content */
.batch-action-bar {
  z-index: 9999 !important;
  bottom: 0 !important;
  position: fixed !important;
  width: 100%;
}

.fab-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 16px rgba(var(--primary-rgb), 0.4);
  z-index: 99;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.fab-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.4);
}

/* List Transitions */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-active {
  position: absolute;
}
.cat-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-left: 8px;
}
.action-icon {
  font-size: 18px;
  padding: 4px;
  cursor: pointer;
}
.action-icon.primary { color: var(--primary); }
.action-icon.danger { color: var(--danger); }
.action-icon.success { color: var(--success); }
.sort-val {
  font-size: 12px;
  color: var(--placeholder);
}

/* Fix submit bar dark mode */
:global(html.dark) .van-submit-bar {
  background-color: var(--surface-1);
}
:global(html.dark) .van-submit-bar__text {
  color: var(--fg);
}

/* Tabs Dark Mode */
:global(html.dark) .van-tabs__nav {
  background-color: var(--bg);
}
:global(html.dark) .van-tab {
  color: var(--placeholder);
}
:global(html.dark) .van-tab--active {
  color: var(--fg);
}

/* Search Dark Mode */
:global(html.dark) .van-search {
  background-color: var(--bg);
}
:global(html.dark) .van-search__content {
  background-color: var(--surface-2);
}
:global(html.dark) .van-search__field .van-field__control {
  color: var(--fg);
}

/* List Items Dark Mode */
:global(html.dark) .category-list .van-cell {
  background-color: var(--surface-1);
  color: var(--fg);
}
:global(html.dark) .category-list .van-cell::after {
  border-bottom-color: var(--border);
}

/* Buttons Dark Mode */
:global(html.dark) .van-button--plain {
  background-color: transparent !important;
}
:global(html.dark) .van-button--primary.van-button--plain {
  color: var(--accent);
  border-color: var(--accent);
}
:global(html.dark) .van-button--danger.van-button--plain {
  color: #ee0a24;
  border-color: #ee0a24;
}

/* Light Mode Buttons - ensure visibility */
:global(html:not(.dark)) .van-button--primary.van-button--plain {
  color: #1989fa;
  border-color: #1989fa;
  background-color: #fff;
}

/* Radio Dark Mode */
:global(html.dark) .van-radio__label {
  color: var(--fg);
}
</style>
