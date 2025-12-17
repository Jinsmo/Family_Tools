<template>
  <div class="order-confirm">
    <div class="content animate-fade-in-up">
      <!-- Order Type Selection -->
      <div class="section-card type-selection">
        <van-tabs v-model:active="activeType" type="card" class="custom-tabs" @change="handleTypeChange">
          <van-tab name="pickup">
            <template #title>
              <div class="tab-title">
                <Icon icon="ph:bag-simple-bold" class="tab-icon" /> 自提
              </div>
            </template>
          </van-tab>
          <van-tab name="home">
            <template #title>
              <div class="tab-title">
                <Icon icon="ph:house-line-bold" class="tab-icon" /> 在家吃
              </div>
            </template>
          </van-tab>
          <van-tab name="delivery">
            <template #title>
              <div class="tab-title">
                <Icon icon="ph:moped-bold" class="tab-icon" /> 外送
              </div>
            </template>
          </van-tab>
        </van-tabs>
      </div>

      <!-- Time Selection (Pickup) -->
      <div class="section-card" v-if="activeType === 'pickup'">
        <div class="card-header">
          <Icon icon="ph:clock-bold" class="header-icon" />
          <span class="header-title">自提时间</span>
        </div>
        <van-cell-group :border="false">
          <van-cell 
            title="选择日期" 
            :value="selectedDate.join('-')" 
            is-link 
            @click="showDatePicker = true" 
            class="custom-cell"
          />
          <van-cell 
            title="选择时间" 
            :value="selectedTime.join(':')" 
            is-link 
            @click="showTimePicker = true" 
            class="custom-cell"
          />
        </van-cell-group>
        <div class="time-tip">
          <Icon icon="ph:info-bold" class="tip-icon" />
          自提时间可选下单后1小时~一周内
        </div>
      </div>

      <!-- Home Delivery Time (Home/Delivery) -->
      <div class="section-card" v-if="activeType === 'delivery'">
        <div class="card-header">
          <Icon icon="ph:clock-afternoon-bold" class="header-icon" />
          <span class="header-title">送达时间</span>
        </div>
        <van-cell-group :border="false">
          <van-cell 
            title="期望时间" 
            :value="deliveryTimeType === 'now' ? '立即送出 (做好即送)' : customDeliveryTime" 
            is-link 
            @click="showDeliveryTimePicker = true" 
            class="custom-cell"
          />
        </van-cell-group>
      </div>

      <!-- Home Dining Time (Home) -->
      <div class="section-card" v-if="activeType === 'home'">
        <div class="card-header">
          <Icon icon="ph:cooking-pot-bold" class="header-icon" />
          <span class="header-title">用餐时间</span>
        </div>
        <van-cell-group :border="false">
          <van-cell 
            title="期望时间" 
            value="尽快制作 (在家吃)" 
            class="custom-cell"
          >
            <template #right-icon>
              <Icon icon="ph:lightning-fill" color="#f59e0b" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- Address Selection (Only for Delivery) -->
      <div class="section-card" v-if="activeType === 'delivery'">
        <div class="card-header">
          <Icon icon="ph:map-pin-bold" class="header-icon" />
          <span class="header-title">配送地址</span>
        </div>
        <van-cell-group :border="false">
          <van-cell
            is-link
            @click="onSelectAddress"
            class="address-cell"
          >
            <template #title>
              <div v-if="addressInfo" class="address-info">
                <div class="address-main">{{ addressInfo.address }}</div>
                <div class="address-sub">{{ addressInfo.name }} {{ addressInfo.tel }}</div>
              </div>
              <div v-else class="address-placeholder">请选择配送地址</div>
            </template>
            <template #icon>
               <div class="address-icon-bg">
                 <Icon icon="ph:map-pin-fill" color="#fff" width="16" />
               </div>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- Order Items -->
      <div class="section-card">
        <div class="card-header">
          <Icon icon="ph:receipt-bold" class="header-icon" />
          <span class="header-title">菜品清单</span>
        </div>
        <div class="order-items-list">
          <div 
            v-for="item in menuStore.cart" 
            :key="item.specKey"
            class="order-item"
          >
            <van-image 
              :src="item.image_url" 
              width="48" 
              height="48" 
              radius="8" 
              fit="cover" 
              class="item-thumb"
            />
            <div class="item-content">
              <div class="item-row">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-price">💗 {{ item.price_points * item.quantity }}</span>
              </div>
              <div class="item-row sub">
                <span class="item-specs">
                  {{ Object.keys(item.selectedSpecs).length ? `(${Object.values(item.selectedSpecs).join('/')})` : '' }}
                </span>
                <span class="item-quantity">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="order-total">
          <span class="total-label">合计</span>
          <span class="total-value">
            <span class="currency">💗</span>
            {{ menuStore.totalPoints }}
          </span>
        </div>
      </div>

      <!-- Remarks -->
      <div class="section-card">
        <div class="card-header">
          <Icon icon="ph:pencil-line-bold" class="header-icon" />
          <span class="header-title">备注</span>
        </div>
        <van-field
          v-model="remark"
          rows="2"
          autosize
          type="textarea"
          placeholder="请输入口味偏好等要求 (例如: 不要葱, 少辣)"
          class="remark-field"
          :border="false"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <van-submit-bar
      :price="menuStore.totalPoints * 100"
      button-text="确认下单"
      @submit="onSubmit"
      currency="💗"
      :decimal-length="0"
      :loading="menuStore.isLoading"
      button-color="linear-gradient(to right, #ff6034, #ee0a24)"
      class="custom-submit-bar"
    />

    <!-- Date Picker Popup -->
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="selectedDate"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="showDatePicker = false"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <!-- Time Picker Popup -->
    <van-popup v-model:show="showTimePicker" position="bottom">
      <van-time-picker
        v-model="selectedTime"
        title="选择时间"
        :min-hour="minHour"
        :max-hour="23"
        @confirm="showTimePicker = false"
        @cancel="showTimePicker = false"
      />
    </van-popup>

    <!-- Delivery Time Picker (Scroll Wheel) -->
    <van-popup v-model:show="showDeliveryTimePicker" position="bottom">
      <van-picker
        title="选择送达时间"
        :columns="deliveryTimeColumns"
        @confirm="onDeliveryTimeConfirm"
        @cancel="showDeliveryTimePicker = false"
      />
    </van-popup>

    <!-- Address Popup (Simplification: using a mock list or just navigating to address list page) -->
    <!-- For simplicity, let's assume we navigate to a separate address selection page or popup. -->
    <!-- Here we will use a simple popup with mock data or empty state for now as db table just created -->
    <van-popup v-model:show="showAddressList" position="bottom" :style="{ height: '60%' }">
      <van-address-list
        v-model="chosenAddressId"
        :list="addressList"
        default-tag-text="默认"
        @add="onAddAddress"
        @edit="onEditAddress"
        @select="onAddressSelect"
      />
    </van-popup>

    <!-- Address Edit Popup -->
    <van-popup v-model:show="showAddAddress" position="bottom" :style="{ height: '100%' }">
      <van-nav-bar
        title="新增地址"
        left-text="取消"
        left-arrow
        @click-left="showAddAddress = false"
      />
      <van-address-edit
        :area-list="areaList"
        :address-info="editingAddress"
        show-set-default
        show-search-result
        :search-result="[]"
        :area-columns-placeholder="['请选择', '请选择', '请选择']"
        @save="onSaveAddress"
      >
        <template #default>
           <div class="geo-btn-wrapper">
             <van-button icon="location-o" type="primary" size="small" plain block @click="onGeoLocate">
               自动获取当前定位
             </van-button>
           </div>
        </template>
      </van-address-edit>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMenuStore } from '../app/store/menu';
import { useRouter } from 'vue-router';
import { showToast, showDialog } from 'vant';
import { useMessageStore } from '../app/store/message';
import { useAuthStore } from '../app/store/auth';

const router = useRouter();
const menuStore = useMenuStore();
const authStore = useAuthStore();
const messageStore = useMessageStore();

const activeType = ref('home'); // Default to home
const remark = ref('');

// Address Logic
const showAddressList = ref(false);
const chosenAddressId = ref('');
const addressList = ref<any[]>([]); // To be populated from API
const addressInfo = ref<any>(null);

// Date/Time Logic
const now = new Date();
const showDatePicker = ref(false);
const showTimePicker = ref(false);

const selectedDate = ref([
  now.getFullYear().toString(),
  (now.getMonth() + 1).toString().padStart(2, '0'),
  now.getDate().toString().padStart(2, '0')
]);

const selectedTime = ref([
  now.getHours().toString().padStart(2, '0'),
  now.getMinutes().toString().padStart(2, '0')
]);

// Limits for DatePicker
const minDate = new Date();
const maxDate = new Date(new Date().setDate(now.getDate() + 7)); // +1 week

// Dynamic minHour based on selected date
const minHour = computed(() => {
  const selDateStr = selectedDate.value.join('-');
  const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  
  if (selDateStr === todayStr) {
    // If today, min hour is current hour + 1 (for pickup/reserve logic)
    return activeType.value === 'pickup' ? now.getHours() + 1 : 0;
  }
  return 0;
});

// Delivery Time Logic
const showDeliveryTimePicker = ref(false);
const deliveryTimeType = ref('now'); // 'now' or 'custom' (but simplified for now)
const customDeliveryTime = ref('');
const deliveryTimeColumns = computed(() => {
  const columns = [
    { text: '立即送出', value: 'now', children: [{ text: '做好即送', value: 'asap' }] }
  ];
  
  const start = new Date();
  start.setMinutes(start.getMinutes() + 30); // Start from 30 mins later
  // Round to nearest 30 mins
  const remainder = start.getMinutes() % 30;
  if (remainder !== 0) {
    start.setMinutes(start.getMinutes() + (30 - remainder));
  }
  start.setSeconds(0);
  start.setMilliseconds(0);

  const end = new Date();
  end.setDate(end.getDate() + 7); // Until 1 week later

  const current = new Date(start);
  const nowDay = new Date().getDate();

  // Helper to find or create date group
  const getDateGroup = (dateStr: string, text: string) => {
    let group = columns.find(c => c.value === dateStr);
    if (!group) {
      group = { text, value: dateStr, children: [] };
      columns.push(group);
    }
    return group;
  };

  while (current < end) {
    const h = current.getHours();
    // Removed business hours restriction (was 9-21)
    
    const month = (current.getMonth() + 1).toString().padStart(2, '0');
    const day = current.getDate().toString().padStart(2, '0');
    const hour = h.toString().padStart(2, '0');
    const min = current.getMinutes().toString().padStart(2, '0');
    
    const dateValue = `${current.getFullYear()}-${month}-${day}`;
    let dateText = `${month}月${day}日`;
    
    if (current.getDate() === nowDay) {
      dateText = '今天';
    } else if (current.getDate() === nowDay + 1) {
      dateText = '明天';
    }

    const group = getDateGroup(dateValue, dateText);
    
    const timeText = `${hour}:${min}`;
    // Full datetime as value for easy parsing
    const timeValue = `${dateValue} ${timeText}:00`;
    
    group.children.push({ text: timeText, value: timeValue });

    current.setMinutes(current.getMinutes() + 30);
  }

  return columns;
});

const onDeliveryTimeConfirm = ({ selectedOptions }: any) => {
  const dateOpt = selectedOptions[0];
  const timeOpt = selectedOptions[1];

  if (dateOpt.value === 'now') {
    deliveryTimeType.value = 'now';
    customDeliveryTime.value = '';
  } else {
    deliveryTimeType.value = 'custom';
    customDeliveryTime.value = `${dateOpt.text} ${timeOpt.text} 送达`;
  }
  showDeliveryTimePicker.value = false;
};

import request from '../app/request';
import { areaList } from '@vant/area-data';

// ... (other imports)

// ...

// Address Methods
const onSelectAddress = () => {
  showAddressList.value = true;
};

const onAddressSelect = (item: any) => {
  addressInfo.value = item;
  showAddressList.value = false;
};

// Add Address Logic
const showAddAddress = ref(false);
const editingAddress = ref<any>({});
// areaList imported from @vant/area-data

const onAddAddress = () => {
  editingAddress.value = {
    name: authStore.user?.nickname || '',
    tel: authStore.user?.phone || '',
  };
  showAddAddress.value = true;
};

const onEditAddress = (item: any) => {
  // Not implemented yet fully, focus on add
  // editingAddress.value = item;
  // showAddAddress.value = true;
  messageStore.show('编辑功能暂未开放', 'info');
};

const onGeoLocate = () => {
  if (!navigator.geolocation) {
    messageStore.show('浏览器不支持地理定位', 'error');
    return;
  }
  
  const toast = showToast({
    message: '定位中...',
    forbidClick: true,
    loadingType: 'spinner',
    duration: 0
  });

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        
        // 调用后端代理接口 (支持高德地图 API)
        const response = await request.get<any, any>(`/api/location/regeo?latitude=${latitude}&longitude=${longitude}`);
        
        toast.close();

        // 高德 API 返回结构
        if (response && response.formatted_address) {
          const addrComp = response.addressComponent;
          
          // 提取地址组件 (Amap format)
          // adcode 是区县代码，可以直接用于 areaCode
          const areaCode = addrComp.adcode;
          
          // 详细地址 = 街道 + 门牌 + 建筑
          let detail = '';
          if (addrComp.streetNumber && addrComp.streetNumber.street) {
             detail += addrComp.streetNumber.street;
             if (addrComp.streetNumber.number) {
                detail += addrComp.streetNumber.number;
             }
          }
          if (addrComp.building && addrComp.building.name && addrComp.building.name.length > 0) {
             // 如果 building 是个数组，取第一个？通常是 string 吗？
             // Amap API building.name 可以是 [] 或 string
             const bName = Array.isArray(addrComp.building.name) ? '' : addrComp.building.name;
             if (bName) detail += ' ' + bName;
          }
          
          // 如果没有详细街道信息，使用 formatted_address 减去省市区
          if (!detail) {
             // 简单的截取逻辑，或者直接用 formatted_address
             // Vant address-edit 会自动拼装 Province+City+County+AddressDetail
             // 为了避免重复，我们尽量提取
             detail = response.formatted_address;
             // 移除省市区前缀 (简单尝试)
             if (addrComp.province && detail.startsWith(addrComp.province)) {
                detail = detail.replace(addrComp.province, '');
             }
             if (addrComp.city && typeof addrComp.city === 'string' && detail.startsWith(addrComp.city)) {
                detail = detail.replace(addrComp.city, '');
             }
             if (addrComp.district && typeof addrComp.district === 'string' && detail.startsWith(addrComp.district)) {
                detail = detail.replace(addrComp.district, '');
             }
          }

          editingAddress.value = {
            ...editingAddress.value,
            areaCode: areaCode,
            addressDetail: detail || response.formatted_address
          };
          
          messageStore.show('定位成功并解析地址', 'success');
        } else {
          throw new Error('地址解析失败');
        }
      } catch (error: any) {
        toast.close();
        console.error(error);
        
        // 降级处理
        const { latitude, longitude } = position.coords;
        let errorMsg = '地址解析失败，仅获取经纬度';
        if (error.response && error.response.status === 503) {
             errorMsg = '请在服务器配置地图 API Key';
        }
        
        editingAddress.value = {
          ...editingAddress.value,
          addressDetail: `(定位成功) 经度:${longitude.toFixed(4)}, 纬度:${latitude.toFixed(4)}`
        };
        messageStore.show(errorMsg, 'warning');
      }
    },
    (error) => {
      toast.close();
      console.error(error);
      messageStore.show('定位失败，请手动输入', 'error');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

const onSaveAddress = async (content: any) => {
  try {
    const fullAddress = `${content.province}${content.city}${content.county}${content.addressDetail}`;
    await request.post('/api/menu/address/add', {
      name: content.name,
      phone: content.tel,
      address: fullAddress,
      is_default: content.isDefault,
    });
    messageStore.show('添加成功', 'success');
    showAddAddress.value = false;
    fetchAddresses();
  } catch (error) {
    console.error(error);
    messageStore.show('添加失败', 'error');
  }
};

const fetchAddresses = async () => {
  try {
    const res = await request.get('/api/menu/address/list');
    // Map backend fields to Vant format
    addressList.value = (res as any).map((addr: any) => ({
      id: addr.id,
      name: addr.name,
      tel: addr.phone,
      address: addr.address,
      isDefault: !!addr.is_default,
    }));
    
    // Auto select default
    const defaultAddr = addressList.value.find(a => a.isDefault);
    if (defaultAddr) {
      chosenAddressId.value = defaultAddr.id;
      addressInfo.value = defaultAddr;
    } else if (addressList.value.length > 0) {
      // If no default, select first
      chosenAddressId.value = addressList.value[0].id;
      addressInfo.value = addressList.value[0];
    }
  } catch (error) {
    console.error('Failed to fetch addresses', error);
  }
};

onMounted(() => {
  fetchAddresses();
});

const handleTypeChange = (name: string) => {
  // Reset fields if needed when switching types
  if (name === 'home') {
    // Maybe set default home address logic
  }
};

const onSubmit = async () => {
  if (menuStore.cart.length === 0) {
    messageStore.show('购物车为空', 'warning');
    return;
  }

  if (activeType.value === 'delivery' && !addressInfo.value) {
    messageStore.show('请选择配送地址', 'warning');
    return;
  }

  // Construct scheduled_time string
  let orderTime = '';
  if (activeType.value === 'delivery') {
    if (deliveryTimeType.value === 'now') {
      orderTime = '立即送出';
    } else {
      // For custom time, we extract the actual datetime value from our logic if needed, 
      // but here customDeliveryTime is just display text. 
      // Ideally we should store the value chosen in onDeliveryTimeConfirm.
      // Let's improve onDeliveryTimeConfirm to store the value.
      
      // Re-using the display text is fine for now as per previous logic, 
      // but if we want structured data we should use a separate ref.
      orderTime = customDeliveryTime.value; 
    }
  } else if (activeType.value === 'home') {
     // For "home", defaulting to "now" for simplicity or could reuse picker
     orderTime = '在家吃 - 尽快'; 
  } else {
    // Pickup
    orderTime = `${selectedDate.value.join('-')} ${selectedTime.value.join(':')}:00`;
  }

  try {
    await menuStore.placeOrder({
      order_type: activeType.value,
      scheduled_time: orderTime, // Note: Backend might need to adjust schema if it strictly expects datetime
      address: activeType.value === 'delivery' ? addressInfo.value.address : '',
      remark: remark.value,
      items: menuStore.cart
    });

    showDialog({
      title: '下单成功',
      message: '您的订单已提交，等待家人接单制作！',
    }).then(() => {
      router.push('/orders');
    });
  } catch (e: any) {
    const errorMsg = e.response?.data?.error || e.message || '下单失败';
    messageStore.show(errorMsg, 'error');
  }
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

.order-confirm {
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

/* Force transparent background for Vant components inside card */
.section-card :deep(.van-cell),
.section-card :deep(.van-cell-group) {
  background-color: transparent;
}

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

/* Custom Tabs */
.type-selection {
  padding: 8px;
  background-color: var(--surface-2); /* Slightly darker for contrast */
}

:deep(.custom-tabs .van-tabs__nav--card) {
  background-color: transparent;
  border: none;
  margin: 0;
  height: 40px;
}

:deep(.custom-tabs .van-tab--card) {
  border: none;
  background-color: transparent;
  color: var(--placeholder);
  transition: all 0.3s;
  border-radius: 8px;
  margin: 0 2px;
}

:deep(.custom-tabs .van-tab--card.van-tab--active) {
  background-color: var(--bg);
  color: #ee0a24;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.tab-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tab-icon {
  font-size: 16px;
}

/* Custom Cells */
.custom-cell {
  background-color: transparent;
  padding: 12px 0;
}

:deep(.custom-cell) {
  background-color: transparent;
}

:deep(.custom-cell .van-cell__title) {
  color: var(--fg);
  font-size: 14px;
}

:deep(.custom-cell .van-cell__value) {
  color: var(--fg); /* Darker text for values */
  font-weight: 500;
}

/* Time Tip */
.time-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 8px;
}

/* Address Cell */
.address-cell {
  background-color: transparent;
  padding: 8px 0;
  align-items: center;
}

.address-icon-bg {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6034, #ee0a24);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 2px 6px rgba(238, 10, 36, 0.2);
}

.address-info {
  display: flex;
  flex-direction: column;
}

.address-main {
  font-weight: bold;
  font-size: 15px;
  color: var(--fg);
  margin-bottom: 4px;
}

.address-sub {
  font-size: 13px;
  color: var(--placeholder);
}

.address-placeholder {
  color: var(--placeholder);
  font-size: 14px;
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
  align-items: flex-start;
}

.item-thumb {
  flex-shrink: 0;
  margin-right: 12px;
  border: 1px solid var(--border);
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 48px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.item-row.sub {
  margin-bottom: 0;
}

.item-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--fg);
}

.item-price {
  font-size: 14px;
  color: var(--fg);
  font-weight: 600;
}

.item-specs {
  font-size: 12px;
  color: var(--placeholder);
}

.item-quantity {
  font-size: 13px;
  color: var(--placeholder);
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

/* Remarks */
.remark-field {
  background-color: var(--bg);
  border-radius: 8px;
  padding: 12px;
}

/* Custom Submit Bar */
:deep(.custom-submit-bar) {
  bottom: 0;
  border-top: 1px solid var(--border);
  box-shadow: 0 -4px 16px rgba(0,0,0,0.05);
  background-color: var(--surface-1);
}

:deep(.custom-submit-bar .van-submit-bar__bar) {
  background-color: var(--surface-1);
  padding-left: 16px;
}

:deep(.custom-submit-bar .van-submit-bar__text) {
  color: var(--fg);
}

:deep(.custom-submit-bar .van-submit-bar__price) {
  color: #ee0a24;
  font-weight: 800;
}

/* Reused Styles */
.geo-btn-wrapper {
  padding: 10px 16px;
}

:deep(.van-button--plain.van-button--primary) {
  background-color: var(--bg);
  border-color: var(--accent);
  color: var(--accent);
}

:deep(.van-address-item) {
  background-color: var(--surface-1);
  border-bottom: 1px solid var(--border);
}

:deep(.van-address-item:last-child) {
  border-bottom: none;
}

:deep(.van-address-item__name) {
  color: var(--fg);
  font-weight: bold;
}

:deep(.van-address-item__address) {
  color: var(--placeholder);
}

:deep(.van-address-list__bottom) {
  background-color: var(--bg);
}

:deep(.van-address-list__add) {
  background: linear-gradient(to right, #ff6034, #ee0a24);
  border: none;
}

/* Dark Mode specific overrides if needed */
:deep(html.dark) .section-card {
  background-color: var(--surface-1);
}
</style>
