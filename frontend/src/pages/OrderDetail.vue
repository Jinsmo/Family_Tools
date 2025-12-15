<template>
  <div class="order-detail-page">
    <van-nav-bar
      title="订单详情"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
      z-index="100"
      class="custom-navbar"
    />

    <div class="content animate-fade-in-up" v-if="order">
      <!-- Status Card -->
      <div class="section-card status-card">
        <div class="status-header">
          <Icon :icon="getStatusIcon(order.status)" class="status-icon" :class="order.status" />
          <span class="status-text">{{ getStatusName(order.status) }}</span>
        </div>
        <div class="status-desc">
          {{ getStatusDesc(order.status) }}
        </div>
      </div>

      <!-- Order Items -->
      <div class="section-card">
        <div class="card-header">
          <Icon icon="ph:receipt-bold" class="header-icon" />
          <span class="header-title">菜品详情</span>
        </div>
        <div class="order-items-list">
          <div 
            v-for="item in order.items" 
            :key="item.id"
            class="order-item"
          >
            <div class="item-main">
              <div class="item-name">{{ item.item_name }}</div>
              <div class="item-specs" v-if="item.specs">
                {{ parseSpecs(item.specs) }}
              </div>
            </div>
            <div class="item-right">
              <span class="item-quantity">x{{ item.quantity }}</span>
              <span class="item-price">💗 {{ item.price_points * item.quantity }}</span>
            </div>
          </div>
        </div>
        <div class="order-total">
          <span class="total-label">合计支付</span>
          <span class="total-value">
            <span class="currency">💗</span>
            {{ order.total_points }}
          </span>
        </div>
      </div>

      <!-- Order Info -->
      <div class="section-card">
        <div class="card-header">
          <Icon icon="ph:info-bold" class="header-icon" />
          <span class="header-title">订单信息</span>
        </div>
        <van-cell-group :border="false" class="info-group">
          <van-cell title="订单编号" :value="order.id" />
          <van-cell v-if="order.user_nickname" title="下单人" :value="order.user_nickname" />
          <van-cell title="下单时间" :value="formatDate(order.created_at)" />
          <van-cell title="订单类型" :value="getOrderTypeName(order.order_type)" />
          <van-cell title="期望时间" :value="formatDate(order.scheduled_time)" />
          <van-cell v-if="order.address" title="配送地址" :label="order.address" class="address-cell" />
          <van-cell v-if="order.remark" title="备注" :label="order.remark" />
        </van-cell-group>
      </div>

      <!-- Actions -->
      <div class="bottom-actions">
        <!-- Admin Actions -->
        <template v-if="isAdmin">
          <van-button 
            v-if="order.status === 'pending'"
            round 
            block
            type="primary" 
            @click="updateStatus('processing')"
            class="action-btn"
          >
            接单
          </van-button>
          
          <van-button 
            v-if="order.status === 'processing'"
            round 
            block
            type="success" 
            @click="updateStatus('completed')"
            class="action-btn"
          >
            完成订单
          </van-button>
          
          <van-button 
            v-if="['pending', 'processing'].includes(order.status)"
            round 
            block
            type="danger" 
            plain
            @click="cancelOrder"
            class="action-btn"
          >
            取消订单
          </van-button>
        </template>

        <!-- User Actions -->
        <template v-else>
          <van-button 
            v-if="order.status === 'pending'"
            round 
            block 
            type="danger" 
            plain
            @click="cancelOrder"
          >
            取消订单
          </van-button>
        </template>
      </div>
    </div>
    
    <div v-else-if="loading" class="loading-state">
      <van-loading type="spinner" />
    </div>

    <div v-else class="error-state">
      <Icon icon="ph:warning-circle" class="error-icon" />
      <p>订单不存在或加载失败</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showDialog } from 'vant';
import request from '../app/request';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '../app/store/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isAdmin = computed(() => !!authStore.user?.is_admin);

const orderId = route.params.id;
const order = ref<any>(null);
const loading = ref(true);

// Ensure profile is fresh
onMounted(() => {
  if (authStore.token) {
    authStore.fetchProfile();
  }
  fetchOrderDetails();
});

const getStatusName = (status: string) => {
  const map: Record<string, string> = {
    pending: '待接单',
    processing: '制作中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return map[status] || status;
};

const getStatusDesc = (status: string) => {
  const map: Record<string, string> = {
    pending: '订单已提交，等待家人确认接单',
    processing: '家人正在用心制作中，请耐心等待',
    completed: '订单已完成，祝您用餐愉快',
    cancelled: '订单已取消'
  };
  return map[status] || '';
};

const getStatusIcon = (status: string) => {
  const map: Record<string, string> = {
    pending: 'ph:clock-bold',
    processing: 'ph:cooking-pot-bold',
    completed: 'ph:check-circle-bold',
    cancelled: 'ph:x-circle-bold'
  };
  return map[status] || 'ph:info-bold';
};

const getOrderTypeName = (type: string) => {
  const map: Record<string, string> = {
    pickup: '自提',
    home: '在家吃',
    delivery: '外送'
  };
  return map[type] || type;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const parseSpecs = (specs: any) => {
  if (!specs) return '';
  try {
    const specObj = typeof specs === 'string' ? JSON.parse(specs) : specs;
    return Object.values(specObj).join('/');
  } catch (e) {
    return '';
  }
};

const fetchOrderDetails = async () => {
  try {
    loading.value = true;
    const res: any = await request.get(`/api/menu/orders/${orderId}`);
    order.value = res;
  } catch (error) {
    console.error(error);
    showToast('加载失败');
  } finally {
    loading.value = false;
  }
};

const cancelOrder = () => {
  showDialog({
    title: '提示',
    message: '确定要取消该订单吗？',
    showCancelButton: true
  }).then(async (action) => {
    if (action === 'confirm') {
      try {
        await request.post('/api/menu/orders/cancel', { id: order.value.id });
        showToast('订单已取消');
        fetchOrderDetails(); // Refresh
      } catch (e) {
        showToast('取消失败');
      }
    }
  });
};

const updateStatus = (status: string) => {
  const actionText = status === 'processing' ? '接单' : '完成订单';
  showDialog({
    title: '提示',
    message: `确定要${actionText}吗？`,
    showCancelButton: true
  }).then(async (action) => {
    if (action === 'confirm') {
      try {
        await request.post('/api/menu/orders/status', { id: order.value.id, status });
        showToast('操作成功');
        fetchOrderDetails();
      } catch (e) {
        showToast('操作失败');
      }
    }
  });
};
</script>

<style scoped>
/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}

.order-detail-page {
  min-height: 100vh;
  background-color: var(--bg);
  padding-bottom: 80px;
}

.content {
  padding: 16px;
}

/* Custom Navbar */
:deep(.custom-navbar) {
  background-color: var(--bg);
}
:deep(.custom-navbar .van-nav-bar__title) {
  font-weight: 800;
  color: var(--fg);
}
:deep(.custom-navbar .van-icon) {
  color: var(--fg);
}

/* Section Card */
.section-card {
  background-color: var(--surface-1);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.02);
  border: 1px solid var(--border);
}

/* Status Card */
.status-card {
  text-align: center;
  padding: 32px 16px;
  background: linear-gradient(135deg, var(--surface-1), var(--surface-2));
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-icon {
  font-size: 28px;
}
.status-icon.pending { color: #ff976a; }
.status-icon.processing { color: #1989fa; }
.status-icon.completed { color: #07c160; }
.status-icon.cancelled { color: var(--placeholder); }

.status-text {
  font-size: 20px;
  font-weight: bold;
  color: var(--fg);
}

.status-desc {
  font-size: 14px;
  color: var(--placeholder);
}

/* Common Header */
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--border);
}

.header-icon {
  font-size: 20px;
  color: #ee0a24;
  margin-right: 8px;
}

.header-title {
  font-weight: bold;
  font-size: 15px;
  color: var(--fg);
}

/* Order Items */
.order-items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-main {
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--fg);
  margin-bottom: 4px;
}

.item-specs {
  font-size: 12px;
  color: var(--placeholder);
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.item-quantity {
  font-size: 13px;
  color: var(--placeholder);
  margin-bottom: 4px;
}

.item-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--fg);
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.total-label {
  font-size: 14px;
  color: var(--fg);
}

.total-value {
  font-size: 20px;
  color: #ee0a24;
  font-weight: 800;
}

.total-value .currency {
  font-size: 14px;
  margin-right: 2px;
}

/* Info Cells */
.info-group {
  --van-cell-group-background: transparent;
  --van-cell-background: transparent;
  background: transparent !important;
}

:deep(.info-group .van-cell),
:deep(.info-group .van-cell-group),
:deep(.info-group.van-cell-group) {
  background-color: transparent !important;
  background: transparent !important;
}

:deep(.info-group .van-cell::after) {
  border-bottom: 1px solid var(--border);
  display: none; /* Hide internal borders if desired, or keep them */
}

:deep(.info-group .van-cell) {
  padding: 10px 0;
}

:deep(.info-group .van-cell__title) {
  color: var(--placeholder);
  flex: 1;
}

:deep(.info-group .van-cell__value) {
  color: var(--fg);
  flex: 2;
  text-align: right;
}

.address-cell :deep(.van-cell__label) {
  margin-top: 4px;
  color: var(--fg);
  font-weight: 500;
}

/* Bottom Actions */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--surface-1);
  padding: 12px 16px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 99;
}

.bottom-actions .van-button {
  flex: 1;
  margin: 0;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
  color: var(--placeholder);
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* Dark mode overrides */
:deep(html.dark) .section-card {
  background-color: var(--surface-1);
}
</style>