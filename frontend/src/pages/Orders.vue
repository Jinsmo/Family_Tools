<template>
  <div class="orders-page">
    <van-nav-bar
      title="我的订单"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
      z-index="100"
      class="custom-navbar"
    />

    <div class="content">
      <van-tabs v-model:active="activeTab" sticky offset-top="46" class="order-tabs">
        <van-tab title="全部" name="all"></van-tab>
        <van-tab title="进行中" name="pending"></van-tab>
        <van-tab title="已完成" name="completed"></van-tab>
      </van-tabs>

      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div v-if="orderList.length === 0 && !loading && finished" class="empty-state">
          <Icon icon="ph:receipt-x" class="empty-icon" />
          <div class="empty-text">暂无订单</div>
        </div>
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
          class="order-list"
        >
          <div 
            v-for="order in orderList" 
            :key="order.id"
            class="order-card animate-scale-in"
            @click="router.push(`/orders/${order.id}`)"
          >
            <div class="card-header">
              <div class="header-left">
                <span class="order-type-tag" :class="order.order_type">
                  {{ getOrderTypeName(order.order_type) }}
                </span>
                <span class="order-time">{{ formatDate(order.created_at) }}</span>
              </div>
              <div class="header-right">
                <span class="user-nickname" v-if="order.user_nickname">
                  {{ order.user_nickname }}
                </span>
                <span class="order-status" :class="order.status">
                  {{ getStatusName(order.status) }}
                </span>
              </div>
            </div>

            <div class="card-body">
              <div 
                v-for="item in order.items" 
                :key="item.id"
                class="order-item"
              >
                <div class="item-name">{{ item.item_name }}</div>
                <div class="item-specs" v-if="item.specs">
                  {{ parseSpecs(item.specs) }}
                </div>
                <div class="item-right">
                  <span class="item-quantity">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="order-info">
                <span class="total-count">共 {{ calculateTotalCount(order.items) }} 件</span>
                <span class="total-price">
                  合计: <span class="currency">💗</span>
                  <span class="value">{{ order.total_points }}</span>
                </span>
              </div>
              <div class="action-buttons">
                <!-- Admin Actions -->
                <template v-if="isAdmin">
                  <van-button 
                    v-if="order.status === 'pending'"
                    size="small" 
                    round 
                    type="primary" 
                    class="action-btn"
                    @click.stop="updateStatus(order, 'processing')"
                  >
                    接单
                  </van-button>
                  
                  <van-button 
                    v-if="order.status === 'processing'"
                    size="small" 
                    round 
                    type="success" 
                    class="action-btn"
                    @click.stop="updateStatus(order, 'completed')"
                  >
                    完成
                  </van-button>
                  
                  <van-button 
                    v-if="['pending', 'processing'].includes(order.status)"
                    size="small" 
                    round 
                    plain 
                    type="danger" 
                    class="action-btn"
                    @click.stop="cancelOrder(order)"
                  >
                    取消
                  </van-button>
                </template>

                <!-- User Actions -->
                <van-button 
                  v-else-if="order.status === 'pending'"
                  size="small" 
                  round 
                  plain 
                  type="danger" 
                  class="action-btn"
                  @click.stop="cancelOrder(order)"
                >
                  取消订单
                </van-button>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showDialog } from 'vant';
import request from '../app/request';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '../app/store/auth';

const router = useRouter();
const authStore = useAuthStore();
const isAdmin = computed(() => !!authStore.user?.is_admin);

// Ensure profile is fresh to get latest admin status
onMounted(() => {
  if (authStore.token) {
    authStore.fetchProfile();
  }
  fetchOrders(true);
});

const activeTab = ref('all');
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const orderList = ref<any[]>([]);
const page = ref(1);
const pageSize = 10;

const getOrderTypeName = (type: string) => {
  const map: Record<string, string> = {
    pickup: '自提',
    home: '在家吃',
    delivery: '外送'
  };
  return map[type] || type;
};

const getStatusName = (status: string) => {
  const map: Record<string, string> = {
    pending: '待接单',
    processing: '制作中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return map[status] || status;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
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

const calculateTotalCount = (items: any[]) => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

const fetchOrders = async (isRefresh = false) => {
  try {
    if (isRefresh) {
      page.value = 1;
      finished.value = false;
      // Do not clear list here to prevent flash, handle in response
    }

    // Mock API call - replace with actual endpoint
    // Assuming GET /api/menu/orders?page=1&status=activeTab
    const res: any = await request.get('/api/menu/orders/list', {
      params: {
        page: page.value,
        limit: pageSize,
        status: activeTab.value === 'all' ? undefined : activeTab.value
      }
    });

    const newOrders = res.list || []; // Adjust based on actual API response structure
    
    console.log('Fetched orders:', newOrders); // Debug log

    if (isRefresh) {
      orderList.value = newOrders;
    } else {
      orderList.value = [...orderList.value, ...newOrders];
    }

    if (newOrders.length < pageSize) {
      finished.value = true;
    } else {
      page.value++; // Only increment page if we got full page
    }
  } catch (error) {
    console.error(error);
    finished.value = true;
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const onLoad = () => {
  // If refreshing, do not trigger load more
  if (refreshing.value) return;
  fetchOrders();
};

const onRefresh = () => {
  finished.value = false;
  loading.value = true;
  fetchOrders(true);
};

const updateStatus = (order: any, status: string) => {
  const actionText = status === 'processing' ? '接单' : '完成订单';
  showDialog({
    title: '提示',
    message: `确定要${actionText}吗？`,
    showCancelButton: true
  }).then(async (action) => {
    if (action === 'confirm') {
      try {
        await request.post('/api/menu/orders/status', { id: order.id, status });
        showToast('操作成功');
        onRefresh();
      } catch (e) {
        showToast('操作失败');
      }
    }
  });
};

const cancelOrder = (order: any) => {
  showDialog({
    title: '提示',
    message: '确定要取消该订单吗？',
    showCancelButton: true
  }).then(async (action) => {
    if (action === 'confirm') {
      try {
        await request.post('/api/menu/orders/cancel', { id: order.id });
        showToast('订单已取消');
        onRefresh();
      } catch (e) {
        showToast('取消失败');
      }
    }
  });
};

// Watch tab change
watch(activeTab, () => {
  orderList.value = [];
  page.value = 1;
  finished.value = false;
  loading.value = true;
  fetchOrders(true);
});

</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  background-color: var(--bg);
}

.content {
  padding-bottom: 20px;
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

/* Tabs */
:deep(.van-tabs__nav) {
  background-color: var(--bg);
}
:deep(.van-tab) {
  color: var(--placeholder);
}
:deep(.van-tab--active) {
  color: var(--fg);
  font-weight: bold;
}
:deep(.van-tabs__line) {
  background-color: #ee0a24;
}

/* Order List */
.order-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background-color: var(--surface-1);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.02);
  border: 1px solid var(--border);
  transition: transform 0.2s;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-nickname {
  font-size: 12px;
  color: var(--placeholder);
  background: var(--surface-2);
  padding: 2px 6px;
  border-radius: 4px;
}

.order-type-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.order-type-tag.pickup {
  background-color: rgba(255, 151, 106, 0.1);
  color: #ff6034;
}
.order-type-tag.home {
  background-color: rgba(25, 137, 250, 0.1);
  color: #1989fa;
}
.order-type-tag.delivery {
  background-color: rgba(7, 193, 96, 0.1);
  color: #07c160;
}

.order-time {
  font-size: 12px;
  color: var(--placeholder);
}

.order-status {
  font-size: 13px;
  font-weight: bold;
}
.order-status.pending { color: #ff976a; }
.order-status.processing { color: #1989fa; }
.order-status.completed { color: #07c160; }
.order-status.cancelled { color: var(--placeholder); }

.card-body {
  margin-bottom: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.item-name {
  color: var(--fg);
  font-weight: 500;
  flex: 1;
}

.item-specs {
  font-size: 12px;
  color: var(--placeholder);
  margin-right: 8px;
}

.item-quantity {
  color: var(--placeholder);
  font-size: 13px;
}

.card-footer {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.order-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.total-count {
  font-size: 12px;
  color: var(--placeholder);
}

.total-price {
  font-size: 14px;
  color: var(--fg);
}

.total-price .currency {
  font-size: 12px;
  color: #ee0a24;
  margin-left: 4px;
}

.total-price .value {
  font-size: 18px;
  font-weight: bold;
  color: #ee0a24;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  height: 32px;
  padding: 0 16px;
}

/* Animations */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out forwards;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--placeholder);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

/* Dark mode overrides */
:deep(html.dark) .order-card {
  background-color: var(--surface-1);
}
</style>