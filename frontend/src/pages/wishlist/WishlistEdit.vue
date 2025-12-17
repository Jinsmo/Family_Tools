<template>
  <div class="wishlist-edit">
    <van-nav-bar
      :title="isEdit ? '编辑种草' : '新增种草'"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <div class="form-content">
      <div class="section-title">种草类型</div>
      <div class="type-grid">
        <div
          v-for="(conf, key) in typeMap"
          :key="key"
          class="type-item"
          :class="{ active: form.type === key }"
          @click="form.type = key"
        >
          <div class="icon-box">
            <Icon :icon="conf.icon" width="24" />
          </div>
          <span>{{ conf.label }}</span>
        </div>
      </div>

      <van-cell-group inset>
        <van-field
          v-model="form.name"
          label="名称"
          placeholder="请输入种草名称"
          required
        />
        
        <!-- 位置相关 (仅特定类型显示) -->
        <template v-if="['food', 'shop', 'travel'].includes(form.type)">
          <van-field
            v-model="locationState.areaText"
            is-link
            readonly
            label="所在地区"
            placeholder="请选择省市区"
            @click="showArea = true"
            @click-input="showArea = true"
          />

          <van-field
            v-model="locationState.detail"
            label="详细位置"
            placeholder="街道/门牌号或粘贴链接"
            right-icon="aim"
            @click-right-icon="getLocation"
          />
        </template>

        <van-field
          v-model="form.remark"
          rows="2"
          autosize
          label="备注"
          type="textarea"
          placeholder="记录推荐理由、价格预算等..."
        />

        <van-cell center title="已拔草" v-if="isEdit">
          <template #right-icon>
            <van-switch v-model="isCompletedBool" size="20" />
          </template>
        </van-cell>
      </van-cell-group>

      <div class="action-bar">
        <van-button
          v-if="isEdit"
          type="danger"
          block
          class="delete-btn"
          @click="handleDelete"
        >
          删除
        </van-button>
        <van-button
          type="primary"
          block
          :loading="loading"
          @click="handleSubmit"
        >
          保存
        </van-button>
      </div>
    </div>

    <!-- Area Popup -->
    <van-popup v-model:show="showArea" round position="bottom" teleport="body">
      <van-area
        :area-list="areaList"
        title="选择地区"
        @confirm="onAreaConfirm"
        @cancel="showArea = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { showToast, showDialog, showLoadingToast, closeToast } from 'vant';
import { areaList } from '@vant/area-data';
import { createWishlist, updateWishlist, getWishlistItem, deleteWishlist } from '../../api/wishlist';
import request from '../../app/request';

const route = useRoute();
const router = useRouter();
const id = route.query.id as string;
const isEdit = !!id;

const loading = ref(false);
const showArea = ref(false);

const typeMap: any = {
  food: { label: '美食', icon: 'ph:hamburger' },
  shop: { label: '店铺', icon: 'ph:storefront' },
  travel: { label: '旅行', icon: 'ph:airplane' },
  goods: { label: '好物', icon: 'ph:gift' },
  other: { label: '其他', icon: 'ph:dots-three-circle' },
};

const form = reactive({
  name: '',
  type: 'food',
  remark: '',
  is_completed: 0
});

// 位置状态分离，最终拼接存入 location 字段
const locationState = reactive({
  areaText: '',
  detail: ''
});

const isCompletedBool = computed({
  get: () => form.is_completed === 1,
  set: (val) => form.is_completed = val ? 1 : 0
});

const onAreaConfirm = ({ selectedOptions }: any) => {
  showArea.value = false;
  locationState.areaText = selectedOptions.map((item: any) => item.text).join('/');
};

const getLocation = () => {
  console.log('点击定位按钮');
  if (!navigator.geolocation) {
    showToast('浏览器不支持定位');
    return;
  }
  
  showLoadingToast({
    message: '定位中...',
    forbidClick: true,
  });
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // 调用后端代理接口 (支持高德地图 API)
        const response = await request.get<any, any>(`/api/location/regeo?latitude=${latitude}&longitude=${longitude}`);
        closeToast();

        if (response && response.formatted_address) {
          const addrComp = response.addressComponent;
          
          // 1. 更新省市区
          // 注意：高德返回的 city 可能是空数组（如果是直辖市），此时用 province
          let province = addrComp.province;
          let city = addrComp.city;
          let district = addrComp.district;

          if (Array.isArray(city) || !city) {
            city = province; // 直辖市逻辑
          }
          
          locationState.areaText = `${province}/${city}/${district}`;

          // 2. 更新详细地址
          let detail = '';
          if (addrComp.streetNumber && addrComp.streetNumber.street) {
             detail += addrComp.streetNumber.street;
             if (addrComp.streetNumber.number) {
                detail += addrComp.streetNumber.number;
             }
          }
          if (addrComp.building && addrComp.building.name && addrComp.building.name.length > 0) {
             const bName = Array.isArray(addrComp.building.name) ? '' : addrComp.building.name;
             if (bName) detail += ' ' + bName;
          }
          
          // 如果没有详细街道信息，使用 formatted_address 减去省市区前缀
          if (!detail) {
             detail = response.formatted_address;
             if (province && detail.startsWith(province)) detail = detail.replace(province, '');
             if (city && typeof city === 'string' && detail.startsWith(city)) detail = detail.replace(city, '');
             if (district && typeof district === 'string' && detail.startsWith(district)) detail = detail.replace(district, '');
          }
          
          locationState.detail = detail || response.formatted_address;
          showToast('已自动获取位置');
        } else {
          // 接口返回异常，降级处理
          throw new Error('地址解析失败');
        }
      } catch (error) {
        closeToast();
        console.error('Reverse Geocoding error:', error);
        // 降级：只填坐标
        locationState.detail = `[坐标] ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        showToast('地址解析失败，已填入坐标');
      }
    },
    (err) => {
      closeToast();
      let msg = '定位失败';
      switch(err.code) {
        case err.PERMISSION_DENIED: msg = '定位权限被拒绝'; break;
        case err.POSITION_UNAVAILABLE: msg = '位置信息不可用'; break;
        case err.TIMEOUT: msg = '定位超时'; break;
      }
      showToast(msg);
      console.error('Geolocation error:', err);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};

const loadDetail = async () => {
  if (!isEdit) return;
  try {
    showLoadingToast('加载中...');
    const res = await getWishlistItem(Number(id));
    form.name = res.name;
    form.type = res.type;
    form.remark = res.remark || '';
    form.is_completed = res.is_completed;
    
    // 解析 location
    if (res.location) {
      // 简单假设用空格或特定符号分隔，或者直接全部填入 detail
      // 这里简单处理：如果包含 / 则尝试分割，否则全放 detail
      if (res.location.includes(' ')) {
        const parts = res.location.split(' ');
        locationState.areaText = parts[0];
        locationState.detail = parts.slice(1).join(' ');
      } else {
        locationState.detail = res.location;
      }
    }
    closeToast();
  } catch (error) {
    closeToast();
    showToast('加载详情失败');
    router.back();
  }
};

const handleSubmit = async () => {
  if (!form.name) return showToast('请输入名称');
  
  loading.value = true;
  try {
    // 拼接位置
    let location = '';
    if (['food', 'shop', 'travel'].includes(form.type)) {
      location = [locationState.areaText, locationState.detail].filter(Boolean).join(' ');
    }

    const data = {
      ...form,
      location
    };

    if (isEdit) {
      await updateWishlist(Number(id), data);
      showToast('更新成功');
    } else {
      await createWishlist(data);
      showToast('创建成功');
    }
    router.back();
  } catch (error) {
    showToast('操作失败');
  } finally {
    loading.value = false;
  }
};

const handleDelete = () => {
  showDialog({
    title: '确认删除',
    message: '删除后无法恢复，确定要删除吗？',
    showCancelButton: true
  }).then(async (action) => {
    if (action === 'confirm') {
      try {
        await deleteWishlist(Number(id));
        showToast('已删除');
        router.back();
      } catch (error) {
        showToast('删除失败');
      }
    }
  });
};

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
.wishlist-edit {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 40px;
}

.form-content {
  padding: 16px;
}

.section-title {
  font-size: 14px;
  color: var(--placeholder);
  margin-bottom: 12px;
  margin-left: 4px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.3s;
}

.type-item.active {
  opacity: 1;
  transform: scale(1.05);
}

.type-item .icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg);
  transition: all 0.3s;
}

.type-item.active .icon-box {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.type-item span {
  font-size: 12px;
  color: var(--fg);
}

.action-bar {
  margin-top: 32px;
  display: flex;
  gap: 16px;
}

.delete-btn {
  flex: 0 0 30%;
}
</style>
