<template>
  <div class="wishlist-home">
    <van-nav-bar
      title="种草清单"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="plus" size="18" @click="$router.push('/wishlist/edit')" />
      </template>
    </van-nav-bar>

    <van-tabs v-model:active="activeTab" sticky offset-top="46px" swipeable>
      <van-tab title="全部" name="all" />
      <van-tab title="美食" name="food" />
      <van-tab title="店铺" name="shop" />
      <van-tab title="旅行" name="travel" />
      <van-tab title="好物" name="goods" />
      <van-tab title="其他" name="other" />
    </van-tabs>

    <div class="list-container">
      <van-empty v-if="filteredList.length === 0" description="暂无种草记录，快去添加吧" />
      
      <div class="grid-container">
        <transition-group name="list">
          <div
            v-for="item in filteredList"
            :key="item.id"
            class="wish-card"
            @click="handleEdit(item)"
          >
            <div class="card-header">
              <div class="type-tag" :class="item.type">
                <Icon :icon="getTypeIcon(item.type)" />
                <span>{{ getTypeLabel(item.type) }}</span>
              </div>
              <div class="status-tag" :class="{ completed: item.is_completed }">
                {{ item.is_completed ? '已拔草' : '想去' }}
              </div>
            </div>

            <div class="card-content">
              <h3 class="title" :class="{ completed: item.is_completed }">{{ item.name }}</h3>
              
              <div v-if="item.location" class="info-row">
                <van-icon name="location-o" />
                <span>{{ item.location }}</span>
              </div>
              
              <div v-if="item.remark" class="info-row remark">
                <van-icon name="notes-o" />
                <span>{{ item.remark }}</span>
              </div>
            </div>

            <div class="card-footer">
              <div class="user-info" v-if="item.user_nickname">
                <van-image
                  round
                  width="20"
                  height="20"
                  :src="item.user_avatar || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'"
                />
                <span class="nickname">{{ item.user_nickname }}</span>
              </div>
              <span class="time">{{ formatDate(item.created_at) }}</span>
            </div>
          </div>
        </transition-group>
      </div>
    </div>

    <!-- 悬浮新增按钮 -->
    <div class="fab-btn" @click="$router.push('/wishlist/edit')">
      <van-icon name="plus" size="24" color="#fff" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { showToast } from 'vant';
import dayjs from 'dayjs';
import { getWishlist, type WishlistItem } from '../../api/wishlist';

const router = useRouter();
const list = ref<WishlistItem[]>([]);
const activeTab = ref('all');

const typeMap: Record<string, { label: string; icon: string }> = {
  food: { label: '美食', icon: 'ph:hamburger' },
  shop: { label: '店铺', icon: 'ph:storefront' },
  travel: { label: '旅行', icon: 'ph:airplane' },
  goods: { label: '好物', icon: 'ph:gift' },
  other: { label: '其他', icon: 'ph:dots-three-circle' },
};

const loadData = async () => {
  try {
    const res = await getWishlist();
    list.value = res;
  } catch (error) {
    showToast('加载失败');
  }
};

const filteredList = computed(() => {
  if (activeTab.value === 'all') return list.value;
  return list.value.filter(item => item.type === activeTab.value);
});

const getTypeIcon = (type: string) => typeMap[type]?.icon || 'ph:star';
const getTypeLabel = (type: string) => typeMap[type]?.label || '未知';

const formatDate = (date: string) => dayjs(date).format('MM-DD HH:mm');

const handleEdit = (item: WishlistItem) => {
  router.push(`/wishlist/edit?id=${item.id}`);
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.wishlist-home {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 20px;
}

.list-container {
  padding: 16px;
  padding-bottom: 80px; /* 为悬浮按钮留出空间 */
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* ... existing styles ... */
.wish-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 12px;
  /* margin-bottom: 16px; 移除底部margin，由grid gap控制 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.wish-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.type-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.type-tag.food { background: rgba(255, 159, 67, 0.15); color: #ff9f43; }
.type-tag.shop { background: rgba(84, 160, 255, 0.15); color: #54a0ff; }
.type-tag.travel { background: rgba(95, 39, 205, 0.15); color: #5f27cd; }
.type-tag.goods { background: rgba(255, 107, 107, 0.15); color: #ff6b6b; }
.type-tag.other { background: rgba(131, 149, 167, 0.15); color: #8395a7; }

.status-tag {
  font-size: 12px;
  color: var(--placeholder);
  background: var(--surface-2);
  padding: 2px 8px;
  border-radius: 10px;
}

.status-tag.completed {
  background: rgba(46, 213, 115, 0.15);
  color: #2ed573;
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--fg);
  line-height: 1.4;
  /* 限制标题行数 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.title.completed {
  color: var(--placeholder);
  /* 移除删除线 */
}

.card-content {
  flex: 1;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  margin-bottom: 4px;
}

.info-row.remark {
  /* 备注最多显示3行 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--placeholder);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 悬浮按钮 */
.fab-btn {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  background: var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s;
}

.fab-btn:active {
  transform: scale(0.9);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}
</style>
