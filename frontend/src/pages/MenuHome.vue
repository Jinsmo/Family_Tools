<template>
  <div class="menu-home">
    <van-nav-bar
      title="家庭菜单"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
      z-index="100"
    >
      <template #right>
         <div class="right-actions">
           <button class="icon-btn" @click="handleLogout" aria-label="退出登录">
             <Icon icon="ph:sign-out-bold" width="24" height="24" />
           </button>
           <button class="icon-btn" @click="toggleTheme" aria-label="切换主题">
             <Icon 
               :icon="isDark ? 'material-symbols:dark-mode-rounded' : 'material-symbols:light-mode-rounded'" 
               width="24" 
               height="24" 
             />
           </button>
         </div>
      </template>
    </van-nav-bar>
    
    <div class="search-box-wrapper">
      <van-search
        v-model="menuStore.searchValue"
        placeholder="搜索美食..."
        shape="round"
        background="transparent"
      />
    </div>

    <!-- Sub Category Filter -->
    <div class="sub-category-bar" v-if="currentSubCategories.length > 0">
       <div 
         class="sub-cat-item" 
         :class="{ active: activeSubCategory === null }"
         @click="scrollToCategory(activeCategoryIndex)"
       >
         全部
       </div>
       <div 
         v-for="sub in currentSubCategories" 
         :key="sub.id" 
         class="sub-cat-item"
         :class="{ active: activeSubCategory === sub.id }"
         @click="scrollToSubCategory(sub)"
       >
         {{ sub.name }}
       </div>
    </div>

    <div class="menu-container">
      <!-- Left Sidebar -->
      <div class="menu-sidebar">
        <van-sidebar v-model="activeCategoryIndex" @change="onCategoryChange">
          <van-sidebar-item 
            v-for="cat in menuStore.filteredCategories" 
            :key="cat.id" 
            :title="cat.name" 
          />
        </van-sidebar>
      </div>

      <!-- Right Content -->
      <div class="menu-content" ref="contentRef" @scroll="onContentScroll">
        <div 
          v-for="(cat, index) in menuStore.filteredCategories" 
          :key="cat.id"
          class="category-section"
          :id="'category-' + index"
          v-show="index === activeCategoryIndex && cat.items && cat.items.length > 0"
        >
          <div class="category-title">{{ cat.name }}</div>
          <div 
            v-for="item in cat.items"
            :key="item.id"
            class="menu-item-card animate-scale-in"
            @click="openItemDetail(item)"
            v-show="!activeSubCategory || item.category_id === activeSubCategory"
          >
            <div class="menu-item-thumb">
              <van-image :src="item.image_url" fit="cover" radius="12px" width="100%" height="100%" />
              <div v-if="item.sales" class="sales-badge">月售 {{ item.sales }}</div>
            </div>
            <div class="menu-item-info">
              <div class="menu-item-name">{{ item.name }}</div>
              <div class="menu-item-desc van-multi-ellipsis--l2">{{ item.description }}</div>
              <div class="menu-item-bottom">
                <div class="menu-item-price">
                  <span class="currency">💗</span>
                  <span class="value">{{ item.price_points }}</span>
                </div>
                <div class="menu-item-action" @click.stop>
                  <van-button 
                    v-if="item.specs && item.specs.length > 0" 
                    size="mini" 
                    color="linear-gradient(to right, #ff6034, #ee0a24)"
                    round
                    class="spec-btn"
                    @click.stop="openItemDetail(item)"
                  >
                    选规格
                  </van-button>
                  <div 
                    v-else 
                    class="add-btn-wrapper"
                    @click.stop="addToCart(item)"
                  >
                    <Icon icon="ph:plus-bold" class="add-icon" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Cart Bar -->
    <div class="cart-bar-container">
      <van-submit-bar
        :price="menuStore.totalPoints * 100"
        button-text="去结算"
        @submit="onSubmit"
        currency="💗"
        :decimal-length="0"
        :disabled="menuStore.totalCount === 0"
        class="custom-submit-bar"
        safe-area-inset-bottom
      >
        <div class="cart-icon-container" @click="showCart = !showCart">
          <div 
            class="cart-icon-circle" 
            :class="{ 'has-items': menuStore.totalCount > 0, 'anim-bounce': cartAnim }"
          >
            <Icon 
              :icon="menuStore.totalCount > 0 ? 'ph:shopping-cart-fill' : 'ph:shopping-cart-bold'" 
              width="28" 
              height="28" 
              :color="menuStore.totalCount > 0 ? '#fff' : '#888'"
            />
            <div class="cart-badge" v-if="menuStore.totalCount > 0">{{ menuStore.totalCount }}</div>
          </div>
        </div>
        <div class="cart-tip" v-if="menuStore.totalCount === 0">
           未选购商品
        </div>
      </van-submit-bar>
    </div>
    
    <!-- Item Detail Popup -->
    <van-popup
      v-model:show="showDetail"
      position="bottom"
      round
      :style="{ height: '80%' }"
      closeable
    >
      <div class="detail-popup" v-if="currentDetailItem">
        <van-image
          width="100%"
          height="200"
          fit="cover"
          :src="currentDetailItem.image_url"
        />
        <div class="detail-content">
          <h2 class="detail-title">{{ currentDetailItem.name }}</h2>
          <div class="detail-price">💗 {{ currentDetailItem.price_points }}</div>
          <div class="detail-desc">{{ currentDetailItem.description }}</div>

          <div class="detail-loading" v-if="loadingDetail">
            <van-loading type="spinner" /> 加载详情中...
          </div>

          <template v-else-if="currentDetailData">
            <!-- Spec Selection Section (Merged) -->
            <div class="detail-section" v-if="currentDetailItem.specs && currentDetailItem.specs.length > 0">
              <h3 class="section-title">✨ 选择规格</h3>
              <div v-for="spec in currentDetailItem.specs" :key="spec.name" class="spec-group">
                <div class="spec-title">
                  {{ spec.name }} 
                  <span v-if="spec.is_multiple" style="font-size: 12px; color: #888; font-weight: normal">(多选)</span>
                </div>
                <div class="spec-options">
                  <div
                    v-for="opt in spec.options"
                    :key="opt"
                    class="spec-option-item"
                    :class="{ active: isSpecSelected(spec, opt) }"
                    @click="selectSpec(spec, opt)"
                  >
                    {{ opt }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Ingredients -->
            <div class="detail-section" v-if="currentDetailData.ingredients && currentDetailData.ingredients.length > 0">
              <h3 class="section-title">🥗 配料表</h3>
              <div class="ingredients-grid">
                <div v-for="(ing, idx) in currentDetailData.ingredients" :key="idx" class="ingredient-item">
                  <span class="ing-name">{{ ing.name }}</span>
                  <span class="ing-amount">{{ ing.amount }}</span>
                </div>
              </div>
            </div>

            <!-- Steps -->
            <div class="detail-section" v-if="currentDetailData.recipe_steps">
              <h3 class="section-title">👨‍🍳 制作方法</h3>
              <div class="recipe-text">{{ currentDetailData.recipe_steps }}</div>
            </div>

            <!-- Tips -->
            <div class="detail-section tips-section" v-if="currentDetailData.tips">
              <h3 class="section-title">💡 小贴士</h3>
              <div class="tips-text">{{ currentDetailData.tips }}</div>
            </div>
          </template>
          
          <div class="detail-empty" v-else>
            暂无详细制作信息
          </div>
        </div>
        
        <div class="detail-footer">
           <van-button 
              color="linear-gradient(to right, #ff6034, #ee0a24)"
              round 
              block 
              @click="addToCartFromDetail"
           >
             加入购物车
           </van-button>
        </div>
      </div>
    </van-popup>

<!-- Spec Selection Sheet removed -->

    <!-- Cart Details Popup -->
    <van-action-sheet v-model:show="showCart" title="购物车">
      <div class="cart-list">
        <div v-if="menuStore.cart.length === 0" class="empty-cart">
          购物车是空的
        </div>
        <div v-for="item in menuStore.cart" :key="item.specKey" class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">{{ item.name }}</div>
            <div class="cart-item-specs" v-if="Object.keys(item.selectedSpecs).length">
              {{ Object.values(item.selectedSpecs).join('/') }}
            </div>
          </div>
          <div class="cart-item-price">💗 {{ item.price_points }}</div>
          <van-stepper 
            v-model="item.quantity" 
            min="0" 
            theme="round" 
            button-size="22" 
            disable-input
            @change="(val) => onQuantityChange(item, val)"
          />
        </div>
        <div class="cart-clear" v-if="menuStore.cart.length > 0" @click="menuStore.clearCart">
          <van-icon name="delete-o" /> 清空购物车
        </div>
        
        <!-- Add Checkout Button inside Cart Popup -->
        <div class="cart-footer" v-if="menuStore.cart.length > 0">
          <van-button 
            type="primary" 
            round 
            block 
            color="linear-gradient(to right, #ff6034, #ee0a24)"
            @click="onSubmit"
          >
            去结算 (共{{ menuStore.totalCount }}件)
          </van-button>
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useMenuStore, type MenuItem, type CartItem, type ItemDetail } from '../app/store/menu';
import { useRouter } from 'vue-router';
import { Loading as VanLoading, showDialog } from 'vant';
import { Icon } from '@iconify/vue';
import { useMessageStore } from '../app/store/message';
import { useThemeStore } from '../app/store/theme';
import { useAuthStore } from '../app/store/auth';

const router = useRouter();
const menuStore = useMenuStore();
const themeStore = useThemeStore();
const authStore = useAuthStore();
const messageStore = useMessageStore();

const isDark = computed(() => themeStore.mode === 'dark');
const toggleTheme = () => themeStore.toggle();

const handleLogout = () => {
  showDialog({
    title: '确认退出',
    message: '您确定要退出登录吗？',
    showCancelButton: true,
    confirmButtonText: '退出',
  }).then(() => {
    authStore.logout();
  });
};

const activeCategoryIndex = ref(0);
const activeSubCategory = ref<number | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const showCart = ref(false);
const cartAnim = ref(false);
const showDetail = ref(false);
const currentDetailItem = ref<MenuItem | null>(null);
const currentDetailData = ref<ItemDetail | null>(null);
const loadingDetail = ref(false);
const selectedSpecs = reactive<Record<string, string | string[]>>({});
const searchValue = ref('');

onMounted(() => {
  menuStore.fetchMenu();
});

const openItemDetail = async (item: MenuItem) => {
  currentDetailItem.value = item;
  showDetail.value = true;
  loadingDetail.value = true;
  currentDetailData.value = null;
  
  // Initialize Specs
  for (const key in selectedSpecs) delete selectedSpecs[key];
  if (item.specs && item.specs.length > 0) {
    item.specs.forEach(s => {
      if (s.is_multiple) {
        selectedSpecs[s.name] = []; // Default empty for multiple
      } else if (s.options.length > 0) {
        selectedSpecs[s.name] = s.options[0]; // Default first for single
      }
    });
  }
  
  const detail = await menuStore.fetchItemDetails(item.id);
  // If detail is null (no backend data), provide a default empty object so we can still show specs
  currentDetailData.value = detail || { id: 0, item_id: item.id, ingredients: [], recipe_steps: '', tips: '' };
  loadingDetail.value = false;
};

const triggerCartAnim = () => {
  cartAnim.value = true;
  setTimeout(() => {
    cartAnim.value = false;
  }, 300);
};

const addToCartFromDetail = () => {
  if (currentDetailItem.value) {
    if (currentDetailItem.value.specs && currentDetailItem.value.specs.length > 0) {
      menuStore.addToCart(currentDetailItem.value, { ...selectedSpecs });
    } else {
      menuStore.addToCart(currentDetailItem.value);
    }
    showDetail.value = false;
    messageStore.show('已加入购物车', 'success');
    triggerCartAnim();
  }
};

const currentSubCategories = computed(() => {
  const currentCat = menuStore.filteredCategories[activeCategoryIndex.value];
  if (!currentCat) return [];
  return currentCat.children || [];
});

const onCategoryChange = (index: number) => {
  activeCategoryIndex.value = index;
  activeSubCategory.value = null;
  // Scroll content to top when category changes
  if (contentRef.value) {
    contentRef.value.scrollTop = 0;
  }
};

const scrollToCategory = (index: number) => {
  activeCategoryIndex.value = index;
  activeSubCategory.value = null;
  // Already handled by onCategoryChange if triggered by sidebar, 
  // but if triggered by sub-cat "All" button:
  if (contentRef.value) {
    contentRef.value.scrollTop = 0;
  }
};

const scrollToSubCategory = (sub: any) => {
  activeSubCategory.value = sub.id;
  if (contentRef.value) {
    contentRef.value.scrollTop = 0;
  }
};

const onContentScroll = (e: Event) => {
  // Disable scroll spy as we are now showing only one category
};

const addToCart = (item: MenuItem) => {
  menuStore.addToCart(item);
  messageStore.show('已加入购物车', 'success');
  triggerCartAnim();
};

const openSpec = (item: MenuItem) => {
  // Deprecated: Merged into openItemDetail
};

const selectSpec = (spec: any, option: string) => {
  if (spec.is_multiple) {
    const current = selectedSpecs[spec.name] as string[];
    const idx = current.indexOf(option);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(option);
    }
  } else {
    selectedSpecs[spec.name] = option;
  }
};

const isSpecSelected = (spec: any, option: string) => {
  const val = selectedSpecs[spec.name];
  if (spec.is_multiple && Array.isArray(val)) {
    return val.includes(option);
  }
  return val === option;
};

const addSpecItemToCart = () => {
  // Deprecated: Merged into addToCartFromDetail
};

const onQuantityChange = (item: CartItem, val: number | string) => { // Fix type
  if (Number(val) === 0) {
    menuStore.removeFromCart(item.specKey);
  }
};

const onSubmit = () => {
  if (menuStore.totalCount === 0) {
    messageStore.show('请先选择商品', 'warning');
    return;
  }
  router.push('/menu/confirm');
  };
</script>

<style scoped>
/* Animation Keyframes */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out forwards;
}

.anim-bounce {
  animation: bounce 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg);
}

/* Sub Category Bar */
.sub-category-bar {
  display: flex;
  overflow-x: auto;
  padding: 8px 16px;
  background: var(--surface-1);
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 90;
  border-bottom: 1px solid var(--border);
}

.sub-cat-item {
  padding: 4px 12px;
  border-radius: 16px;
  background: var(--surface-2);
  color: var(--text-2);
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.2s;
}

.sub-cat-item.active {
  background: var(--accent);
  color: #fff;
  font-weight: bold;
}

.menu-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding-bottom: 100px; /* Space for submit bar */
}

/* Sidebar Customization */
.menu-sidebar {
  width: 90px;
  overflow-y: auto;
  background-color: var(--surface-1);
  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.menu-sidebar::-webkit-scrollbar {
  display: none;
}

/* Content Customization */
.menu-content {
  flex: 1;
  overflow-y: auto;
  background-color: var(--bg);
  padding: 0 12px 110px 12px;
  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.menu-content::-webkit-scrollbar {
  display: none;
}

.category-title {
  padding: 16px 4px 12px;
  font-weight: bold;
  font-size: 15px;
  color: var(--fg);
  position: sticky;
  top: 0;
  background-color: var(--bg);
  z-index: 10;
}

/* New Menu Item Card Styles */
.menu-item-card {
  display: flex;
  margin-bottom: 16px;
  background-color: var(--surface-2); /* Card background */
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s;
}

.menu-item-card:active {
  transform: scale(0.98);
}

.menu-item-thumb {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  margin-right: 12px;
}

.sales-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 10px;
  text-align: center;
  padding: 2px 0;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  backdrop-filter: blur(4px);
}

.menu-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0; /* Enable text truncate */
}

.menu-item-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--fg);
  margin-bottom: 4px;
}

.menu-item-desc {
  font-size: 12px;
  color: var(--placeholder);
  line-height: 1.4;
  margin-bottom: 8px;
  height: 34px; /* Limit height for 2 lines */
}

.menu-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-item-price {
  color: #ff4d4f;
  font-weight: bold;
  display: flex;
  align-items: baseline;
}

.menu-item-price .currency {
  font-size: 12px;
  margin-right: 2px;
}

.menu-item-price .value {
  font-size: 18px;
}

.add-btn-wrapper {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #ff6034, #ee0a24);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 6px rgba(238, 10, 36, 0.3);
  transition: transform 0.2s;
}

.add-btn-wrapper:active {
  transform: scale(0.9);
}

.add-icon {
  font-size: 16px;
}

/* Cart Bar Customization */
.cart-bar-container {
  position: relative;
  z-index: 100;
}

.custom-submit-bar {
  bottom: 50px;
  z-index: 100;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
}

:deep(.van-submit-bar__bar) {
  padding-left: 16px;
  background-color: var(--bg);
}

.cart-icon-container {
  position: relative;
  width: 48px;
  height: 48px;
  margin-right: 12px;
  flex-shrink: 0;
  z-index: 101;
}

.cart-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: absolute;
  bottom: 0;
  transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  border: 1px solid var(--border);
}

.cart-icon-circle.has-items {
  background: linear-gradient(135deg, #ff6034, #ee0a24);
  box-shadow: 0 4px 12px rgba(238, 10, 36, 0.4);
  border: none;
  bottom: 12px; /* Float up when active */
  transform: scale(1.1);
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(to right, #ff6034, #ee0a24);
  color: white;
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg);
  padding: 0 4px;
  font-weight: bold;
}

.cart-tip {
  font-size: 12px;
  color: var(--placeholder);
  margin-left: 4px;
}

/* Animation classes reused */
.anim-bounce {
  animation: bounce 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

/* ... existing styles below ... */
.point-symbol {
  font-size: 12px;
  margin-right: 2px;
}

.sales-tag {
  font-size: 10px;
  color: var(--placeholder);
  margin-top: 4px;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* Spec Sheet */
.spec-content {
  padding: 16px;
  background-color: var(--bg);
}

.spec-group {
  margin-bottom: 16px;
}

.spec-title {
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--fg);
}

/* Detail Popup */
.detail-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.detail-title {
  margin: 16px 0 8px 0; /* Add top margin */
  font-size: 22px;
  color: var(--fg);
  font-weight: 800;
}

.detail-price {
  font-size: 24px;
  color: #ee0a24;
  font-weight: bold;
  margin-bottom: 12px;
}

.detail-desc {
  font-size: 14px;
  color: var(--placeholder);
  margin-bottom: 24px;
  line-height: 1.6;
}

.detail-loading, .detail-empty {
  text-align: center;
  padding: 40px 0;
  color: var(--placeholder);
}

.detail-section {
  margin-bottom: 24px;
  background-color: var(--surface-1);
  padding: 16px;
  border-radius: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 16px 0;
  color: var(--fg);
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: none; /* Removed border */
  padding-left: 0;
}

.ingredients-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  background-color: var(--bg); /* Contrast with surface-1 section */
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid var(--border);
}

.ing-name {
  color: var(--fg);
  font-weight: 500;
}

.ing-amount {
  color: var(--placeholder);
}

.recipe-text, .tips-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--fg);
  white-space: pre-wrap;
}

.tips-section {
  background-color: rgba(255, 151, 106, 0.1); /* Soft orange bg */
}

.tips-section .tips-text {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  color: #ff6034;
}

.detail-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background-color: var(--bg);
  box-shadow: 0 -4px 12px rgba(0,0,0,0.05);
}

.spec-option-item {
  display: inline-block;
  padding: 8px 20px;
  margin: 0 10px 10px 0;
  border-radius: 20px;
  background-color: var(--bg);
  color: var(--fg);
  font-size: 13px;
  border: 1px solid var(--border);
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.spec-option-item.active {
  background-color: #fff0ed;
  color: #ee0a24;
  border-color: #ee0a24;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(238, 10, 36, 0.2);
}

/* Dark mode active state */
:deep(html.dark) .spec-option-item.active {
  background-color: rgba(238, 10, 36, 0.2);
}

.spec-footer {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.spec-price {
  font-size: 20px;
  color: #ee0a24;
  font-weight: bold;
}

/* Add Button Styles */
.add-btn {
  /* Deprecated, see add-btn-wrapper */
}

.search-box-wrapper {
  position: sticky;
  top: 46px; /* Navbar height default */
  z-index: 90;
  background-color: var(--bg);
  padding: 8px 12px;
}
:deep(.van-search) {
  padding: 0;
}
:deep(.van-search__content) {
  background-color: var(--surface-2);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(128, 128, 128, 0.1); /* Subtle bg */
  color: var(--fg);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
}
.icon-btn:active {
  background: rgba(128, 128, 128, 0.2);
}

/* Cart List */
.cart-list {
  padding: 16px 16px 80px 16px;
  max-height: 60vh;
  overflow-y: auto;
  background-color: var(--bg);
}

.empty-cart {
  text-align: center;
  color: var(--placeholder);
  padding: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--surface-1);
  border-radius: 12px;
}

.cart-item-info {
  flex: 1;
}

.cart-item-name {
  font-size: 15px;
  font-weight: bold;
  color: var(--fg);
  margin-bottom: 4px;
}

.cart-item-specs {
  font-size: 12px;
  color: var(--placeholder);
  background: var(--bg);
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
}

.cart-item-price {
  margin: 0 16px;
  color: #ee0a24;
  font-weight: bold;
  font-size: 16px;
}

.cart-clear {
  text-align: center;
  color: var(--placeholder);
  font-size: 13px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

/* Dark Mode Overrides for Vant Components */
:deep(.van-sidebar-item) {
  background-color: var(--surface-1);
  color: var(--placeholder);
  padding: 20px 12px;
  font-size: 13px;
}

:deep(.van-sidebar-item--select) {
  background-color: var(--bg);
  color: var(--fg);
  font-weight: bold;
  font-size: 14px;
  position: relative;
}
:deep(.van-sidebar-item--select)::before {
  background-color: #ee0a24;
  height: 20px;
  width: 4px;
  border-radius: 0 4px 4px 0;
}

:deep(.van-submit-bar) {
  background-color: var(--surface-2); /* Slight contrast */
  border-top: 1px solid var(--border);
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

:deep(.van-submit-bar__bar) {
  background-color: transparent;
}

:deep(.van-submit-bar__text) {
  color: var(--fg);
}

:deep(.van-action-sheet) {
  background-color: var(--bg);
  color: var(--fg);
}

:deep(.van-action-sheet__header) {
  color: var(--fg);
}

:deep(.van-action-sheet__cancel) {
  background-color: var(--bg);
  color: var(--fg);
}

:deep(.van-stepper__minus), :deep(.van-stepper__plus) {
  background-color: var(--bg); /* Contrast with item bg surface-1 */
  color: var(--fg);
  border: 1px solid var(--border);
}

:deep(.van-stepper__input) {
  background-color: transparent;
  color: var(--fg);
}
.cart-footer {
  margin-top: 24px;
  padding-top: 16px;
}
</style>
