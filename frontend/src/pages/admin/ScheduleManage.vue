<template>
  <div class="schedule-manage">
    <!-- 顶部日历卡片 -->
    <div class="calendar-card animate-fade-in-down">
      <!-- 日历头部 -->
      <div class="calendar-header">
        <div class="month-selector">
          <div class="nav-btn" @click="prevMonth">
            <Icon icon="ph:caret-left-bold" />
          </div>
          <span class="current-month">{{ currentYear }}年 {{ currentMonth + 1 }}月</span>
          <div class="nav-btn" @click="nextMonth">
            <Icon icon="ph:caret-right-bold" />
          </div>
        </div>
        <div class="header-actions">
          <div class="today-btn" @click="jumpToToday">今天</div>
        </div>
      </div>

      <!-- 日历主体 -->
      <div class="calendar-body">
        <div class="weekdays">
          <div v-for="day in weekDays" :key="day" class="weekday-item">{{ day }}</div>
        </div>
        <div class="days-grid">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="day-item"
            :class="{
              'is-current-month': day.isCurrentMonth,
              'is-today': day.isToday,
              'is-selected': isSelected(day)
            }"
            @click="selectDay(day)"
          >
            <div class="day-content">
              <span class="day-number">{{ day.date.date() }}</span>
              <span class="lunar-text" :class="{ 'is-festival': day.isFestival }">{{ day.lunarText }}</span>
              <div class="event-dots" v-if="day.hasEvent">
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中日期的日程列表 -->
    <div class="schedule-list-container animate-fade-in-up delay-1">
      <div class="list-header">
        <span class="selected-date-title">
          <Icon icon="ph:calendar-check-bold" class="header-icon" />
          {{ selectedDateStr }}
        </span>
        <span class="schedule-count">{{ currentDaySchedules.length }} 个日程</span>
      </div>
      
      <div v-if="currentDaySchedules.length === 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <Icon icon="ph:calendar-blank-duotone" width="48" />
        </div>
        <p>今天暂无安排，享受生活吧</p>
        <van-button size="small" type="primary" class="add-btn-empty" @click="showAddPopup">
          添加日程
        </van-button>
      </div>
      
      <div v-else class="schedule-items">
        <transition-group name="list">
          <van-swipe-cell 
            v-for="(item, index) in currentDaySchedules" 
            :key="item.id" 
            class="schedule-card-wrapper"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div class="schedule-card" @click="editSchedule(item)">
              <div class="card-left-bar" :style="{ background: item.color || 'var(--accent)' }"></div>
              <div class="card-content">
                <div class="card-main">
                  <h3 class="card-title" :class="{ 'is-completed': item.is_completed }">{{ item.title }}</h3>
                  <div class="card-time">
                    <Icon icon="ph:clock" class="time-icon" />
                    {{ formatTimeRange(item) }}
                  </div>
                </div>
                <div class="card-location" v-if="item.location">
                  <Icon icon="ph:map-pin" class="location-icon" />
                  {{ item.location }}
                </div>
              </div>
              <div class="card-action">
                <Icon icon="ph:caret-right" />
              </div>
            </div>
            <template #right>
              <div class="swipe-actions">
                <div class="swipe-btn delete" @click="onDelete(item)">
                  <Icon icon="ph:trash-bold" />
                </div>
              </div>
            </template>
          </van-swipe-cell>
        </transition-group>
      </div>
    </div>

    <!-- 悬浮新增按钮 -->
    <div class="fab-button animate-bounce-in" @click="showAddPopup">
      <Icon icon="ph:plus-bold" width="24" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <van-popup 
      v-model:show="showPopup" 
      position="bottom" 
      round 
      style="height: 85%"
      class="styled-popup"
    >
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-btn cancel" @click="showPopup = false">取消</div>
          <div class="popup-title">{{ isEdit ? '编辑日程' : '新建日程' }}</div>
          <div class="popup-btn save" @click="saveSchedule">保存</div>
        </div>
        
        <van-form class="schedule-form">
          <div class="form-section">
            <van-field
              v-model="form.title"
              name="title"
              placeholder="日程标题"
              class="title-input"
              :rules="[{ required: true, message: '请填写标题' }]"
            >
              <template #left-icon>
                 <div class="color-dot-trigger" :style="{ background: form.color }" @click="showColorPicker = true"></div>
              </template>
            </van-field>
          </div>

          <div class="form-section card-style">
             <van-cell center title="全天">
              <template #right-icon>
                <van-switch v-model="form.is_all_day" size="22" active-color="var(--accent)" />
              </template>
            </van-cell>
            
            <van-cell 
              :title="form.is_all_day ? '日期' : '开始时间'" 
              :value="form.is_all_day ? form.start_time_str.split(' ')[0] : form.start_time_str"
              is-link 
              @click="openTimePicker('start')" 
            >
              <template #icon>
                <Icon icon="ph:clock-bold" class="form-icon" />
              </template>
            </van-cell>

            <van-cell 
              v-if="!form.is_all_day"
              title="结束时间" 
              :value="form.end_time_str"
              is-link 
              @click="openTimePicker('end')"
            >
              <template #icon>
                <Icon icon="ph:clock-bold" class="form-icon" style="opacity: 0" />
              </template>
            </van-cell>
          </div>

          <div class="form-section card-style">
            <van-field
              v-model="form.location"
              name="location"
              placeholder="添加地点"
            >
              <template #left-icon>
                <Icon icon="ph:map-pin-bold" class="form-icon" />
              </template>
            </van-field>
            
            <van-field
              v-model="form.description"
              name="description"
              type="textarea"
              placeholder="添加备注"
              rows="3"
              autosize
            >
              <template #left-icon>
                <Icon icon="ph:text-align-left-bold" class="form-icon" />
              </template>
            </van-field>
          </div>
          
          <div class="color-picker-section" v-if="showColorPicker">
             <div class="section-title">选择颜色标记</div>
             <div class="color-options">
                <div 
                  v-for="color in colors" 
                  :key="color" 
                  class="color-option-item"
                  :style="{ background: color }"
                  :class="{ active: form.color === color }"
                  @click="form.color = color; showColorPicker = false"
                >
                  <Icon icon="ph:check-bold" v-if="form.color === color" />
                </div>
             </div>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 时间选择器 -->
    <van-popup v-model:show="showDateTimePicker" position="bottom" round class="picker-popup">
      <van-picker-group
        title="选择时间"
        :tabs="['选择日期', '选择时间']"
        @confirm="onDateTimeConfirm"
        @cancel="showDateTimePicker = false"
        v-if="!form.is_all_day"
      >
        <van-date-picker v-model="tempDate" />
        <van-time-picker v-model="tempTime" />
      </van-picker-group>
      <van-date-picker
        v-else
        v-model="tempDate"
        title="选择日期"
        @confirm="onDateConfirm"
        @cancel="showDateTimePicker = false"
      />
    </van-popup>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import dayjs from 'dayjs';
import { Solar, Lunar } from 'lunar-javascript';
import { showToast, showDialog } from 'vant';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, type Schedule } from '../../api/schedule';

const router = useRouter();

// 日历相关
const currentDate = ref(dayjs());
const selectedDate = ref(dayjs());
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const schedules = ref<Schedule[]>([]);

const currentYear = computed(() => currentDate.value.year());
const currentMonth = computed(() => currentDate.value.month());
const selectedDateStr = computed(() => selectedDate.value.format('M月D日 dddd'));

// 获取农历和节日信息
const getLunarInfo = (date: dayjs.Dayjs) => {
  const solar = Solar.fromYmd(date.year(), date.month() + 1, date.date());
  const lunar = solar.getLunar();
  
  let text = '';
  let isFestival = false;
  
  // 优先级：公历节日 > 农历节日 > 节气 > 农历日期
  
  // 公历节日 (取第一个)
  const solarFestivals = solar.getFestivals();
  if (solarFestivals.length > 0) {
    text = solarFestivals[0];
    isFestival = true;
    // 简化过长的节日名称
    if (text.length > 4) text = text.substring(0, 4);
    return { text, isFestival };
  }
  
  // 农历节日 (取第一个)
  const lunarFestivals = lunar.getFestivals();
  if (lunarFestivals.length > 0) {
    text = lunarFestivals[0];
    isFestival = true;
    if (text.length > 4) text = text.substring(0, 4);
    return { text, isFestival };
  }
  
  // 节气
  const jieQi = lunar.getJieQi();
  if (jieQi) {
    text = jieQi;
    isFestival = true;
    return { text, isFestival };
  }
  
  // 农历日期 (初一显示月份)
  if (lunar.getDay() === 1) {
    text = lunar.getMonthInChinese() + '月';
    isFestival = false;
  } else {
    text = lunar.getDayInChinese();
    isFestival = false;
  }
  
  return { text, isFestival };
};

// 生成日历网格
const calendarDays = computed(() => {
  const startOfMonth = currentDate.value.startOf('month');
  const endOfMonth = currentDate.value.endOf('month');
  const startDayOfWeek = startOfMonth.day();
  
  const days = [];
  
  // 上个月的日期
  for (let i = startDayOfWeek; i > 0; i--) {
    const d = startOfMonth.subtract(i, 'day');
    const lunarInfo = getLunarInfo(d);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: d.isSame(dayjs(), 'day'),
      hasEvent: hasEvent(d),
      lunarText: lunarInfo.text,
      isFestival: lunarInfo.isFestival
    });
  }
  
  // 当月的日期
  for (let i = 0; i < endOfMonth.date(); i++) {
    const d = startOfMonth.add(i, 'day');
    const lunarInfo = getLunarInfo(d);
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: d.isSame(dayjs(), 'day'),
      hasEvent: hasEvent(d),
      lunarText: lunarInfo.text,
      isFestival: lunarInfo.isFestival
    });
  }
  
  // 下个月的日期（补齐42格或35格）
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = endOfMonth.add(i, 'day');
    const lunarInfo = getLunarInfo(d);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: d.isSame(dayjs(), 'day'),
      hasEvent: hasEvent(d),
      lunarText: lunarInfo.text,
      isFestival: lunarInfo.isFestival
    });
  }
  
  return days;
});

// 判断某天是否有日程
const hasEvent = (date: dayjs.Dayjs) => {
  return schedules.value.some(s => {
    const start = dayjs(s.start_time);
    const end = dayjs(s.end_time);
    return date.isSame(start, 'day') || (date.isAfter(start, 'day') && date.isBefore(end, 'day')) || date.isSame(end, 'day');
  });
};

// 获取选中日期的日程
const currentDaySchedules = computed(() => {
  return schedules.value.filter(s => {
    const date = selectedDate.value;
    const start = dayjs(s.start_time);
    const end = dayjs(s.end_time);
    return date.isSame(start, 'day') || (date.isAfter(start, 'day') && date.isBefore(end, 'day')) || date.isSame(end, 'day');
  });
});

const isSelected = (day: any) => {
  return day.date.isSame(selectedDate.value, 'day');
};

const selectDay = (day: any) => {
  selectedDate.value = day.date;
  if (!day.isCurrentMonth) {
    currentDate.value = day.date;
  }
};

const prevMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month');
  fetchSchedules();
};

const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month');
  fetchSchedules();
};

const jumpToToday = () => {
  const today = dayjs();
  currentDate.value = today;
  selectedDate.value = today;
  fetchSchedules();
};

// 数据获取
const fetchSchedules = async () => {
  const start = currentDate.value.startOf('month').subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss');
  const end = currentDate.value.endOf('month').add(14, 'day').format('YYYY-MM-DD HH:mm:ss');
  try {
    const res = await getSchedules(start, end);
    schedules.value = res;
  } catch (error) {
    console.error(error);
  }
};

// 表单相关
const showPopup = ref(false);
const isEdit = ref(false);
const showColorPicker = ref(false);
const form = ref<any>({
  title: '',
  description: '',
  is_all_day: false,
  location: '',
  color: '#007AFF',
  start_time_str: '',
  end_time_str: ''
});
const colors = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#AF52DE', '#5856D6', '#FFCC00'];

// 时间选择器状态
const showDateTimePicker = ref(false);
const activeTimeField = ref<'start' | 'end'>('start');
const tempDate = ref<string[]>([]);
const tempTime = ref<string[]>([]);

const formatTimeRange = (item: Schedule) => {
  if (item.is_all_day) return '全天';
  const start = dayjs(item.start_time);
  const end = dayjs(item.end_time);
  if (start.isSame(end, 'day')) {
    return `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
  }
  return `${start.format('MM-DD HH:mm')} - ${end.format('MM-DD HH:mm')}`;
};

const showAddPopup = () => {
  isEdit.value = false;
  showColorPicker.value = false;
  const now = dayjs();
  // 默认选中日期的当前时间
  const start = selectedDate.value.hour(now.hour()).minute(now.minute());
  
  form.value = {
    title: '',
    description: '',
    is_all_day: false,
    location: '',
    color: '#007AFF',
    start_time_str: start.format('YYYY-MM-DD HH:mm'),
    end_time_str: start.add(1, 'hour').format('YYYY-MM-DD HH:mm'),
    _raw_start: start,
    _raw_end: start.add(1, 'hour')
  };
  showPopup.value = true;
};

const editSchedule = (item: Schedule) => {
  isEdit.value = true;
  showColorPicker.value = false;
  form.value = {
    ...item,
    start_time_str: dayjs(item.start_time).format('YYYY-MM-DD HH:mm'),
    end_time_str: dayjs(item.end_time).format('YYYY-MM-DD HH:mm'),
    _raw_start: dayjs(item.start_time),
    _raw_end: dayjs(item.end_time)
  };
  showPopup.value = true;
};

const onDelete = (item: Schedule) => {
  showDialog({
    title: '确认删除',
    message: '确定要删除这个日程吗？',
    showCancelButton: true,
  }).then(async (action) => {
    if (action === 'confirm') {
      try {
        await deleteSchedule(item.id);
        showToast('删除成功');
        fetchSchedules();
      } catch (e) {
        // error handled
      }
    }
  });
};

// 打开时间选择器
watch(() => showDateTimePicker.value, (val) => {
  if (val) {
    const targetTime = activeTimeField.value === 'start' ? form.value._raw_start : form.value._raw_end;
    tempDate.value = [targetTime.year().toString(), (targetTime.month() + 1).toString().padStart(2, '0'), targetTime.date().toString().padStart(2, '0')];
    tempTime.value = [targetTime.hour().toString().padStart(2, '0'), targetTime.minute().toString().padStart(2, '0')];
  }
});

const openTimePicker = (type: 'start' | 'end') => {
  activeTimeField.value = type;
  showDateTimePicker.value = true;
};

// 确认日期时间
const onDateTimeConfirm = () => {
  const dateStr = tempDate.value.join('-');
  const timeStr = tempTime.value.join(':');
  const fullStr = `${dateStr} ${timeStr}`;
  const dayObj = dayjs(fullStr);
  
  if (activeTimeField.value === 'start') {
    form.value.start_time_str = dayObj.format('YYYY-MM-DD HH:mm');
    form.value._raw_start = dayObj;
    // 如果结束时间早于开始时间，自动推后1小时
    if (form.value._raw_end.isBefore(dayObj)) {
        const newEnd = dayObj.add(1, 'hour');
        form.value.end_time_str = newEnd.format('YYYY-MM-DD HH:mm');
        form.value._raw_end = newEnd;
    }
  } else {
    form.value.end_time_str = dayObj.format('YYYY-MM-DD HH:mm');
    form.value._raw_end = dayObj;
  }
  showDateTimePicker.value = false;
};

// 确认日期 (全天模式)
const onDateConfirm = () => {
  const dateStr = tempDate.value.join('-');
  const dayObj = dayjs(dateStr).startOf('day'); 
  
  if (activeTimeField.value === 'start') {
    form.value.start_time_str = dayObj.format('YYYY-MM-DD');
    form.value._raw_start = dayObj;
  } else {
    form.value.end_time_str = dayObj.format('YYYY-MM-DD');
    form.value._raw_end = dayObj;
  }
  showDateTimePicker.value = false;
};

const saveSchedule = async () => {
  if (!form.value.title) {
    showToast('请输入标题');
    return;
  }
  
  const data = {
    title: form.value.title,
    description: form.value.description,
    is_all_day: form.value.is_all_day,
    location: form.value.location,
    color: form.value.color,
    start_time: form.value._raw_start.format('YYYY-MM-DD HH:mm:ss'),
    end_time: form.value._raw_end.format('YYYY-MM-DD HH:mm:ss')
  };
  
  try {
    if (isEdit.value) {
      await updateSchedule(form.value.id, data);
      showToast('更新成功');
    } else {
      await createSchedule(data);
      showToast('创建成功');
    }
    showPopup.value = false;
    fetchSchedules();
  } catch (e) {
    // error handled
  }
};

onMounted(() => {
  fetchSchedules();
});

</script>

<style scoped>
.schedule-manage {
  min-height: 100vh;
  background-color: var(--bg);
  padding: 16px;
  padding-bottom: 80px; /* 留出底部空间 */
}

/* 日历卡片样式 */
.calendar-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.dark .calendar-card {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg);
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-btn:active {
  background-color: var(--surface-2);
}

.current-month {
  font-size: 18px;
  font-weight: 700;
  color: var(--fg);
}

.today-btn {
  font-size: 13px;
  color: var(--accent);
  font-weight: 600;
  padding: 4px 12px;
  background: rgba(var(--bg-card-rgb), 0.1);
  border-radius: 12px;
  cursor: pointer;
}

/* 日历网格 */
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  color: var(--placeholder);
  margin-bottom: 8px;
  font-weight: 500;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 8px;
}

.day-item {
  height: 52px; /* Increased height */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

.day-content {
  width: 42px; /* Increased width */
  height: 42px; /* Increased height */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px; /* Changed from 50% to rounded rect for better fit */
  position: relative;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.day-number {
  font-size: 15px;
  color: var(--fg);
  font-weight: 500;
  z-index: 2;
  line-height: 1.2;
}

.lunar-text {
  font-size: 10px;
  color: var(--placeholder);
  transform: scale(0.9);
  line-height: 1.2;
  margin-top: 1px;
}

.lunar-text.is-festival {
  color: var(--accent);
  font-weight: 600;
}

.day-item:not(.is-current-month) .day-number,
.day-item:not(.is-current-month) .lunar-text {
  opacity: 0.5;
}

/* 选中状态 */
.is-selected .day-content {
  background: var(--surface-2);
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.is-today .day-content {
  background: var(--accent);
  box-shadow: 0 4px 12px rgba(var(--accent-rgb), 0.3);
}

.is-today .day-number,
.is-today .lunar-text {
  color: #fff;
}

.is-today .lunar-text.is-festival {
  color: #fff;
}

.is-today.is-selected .day-content {
  background: var(--accent);
  opacity: 0.9;
}

/* 事件点 */
.event-dots {
  position: absolute;
  bottom: 2px; /* Adjusted bottom */
  display: flex;
  justify-content: center;
  width: 100%;
}

.dot {
  width: 4px;
  height: 4px;
  background: var(--accent);
  border-radius: 50%;
  opacity: 0.8;
}

.is-today .dot {
  background: #fff;
}

/* 日程列表 */
.schedule-list-container {
  margin-top: 8px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.selected-date-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg);
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--accent);
  font-size: 20px;
}

.schedule-count {
  font-size: 12px;
  color: var(--placeholder);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: var(--placeholder);
}

.empty-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--placeholder);
}

.add-btn-empty {
  margin-top: 20px;
  border-radius: 20px;
  padding: 0 24px;
}

/* 日程卡片 */
.schedule-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-card-wrapper {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.dark .schedule-card-wrapper {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.schedule-card {
  background: var(--bg-card);
  padding: 16px;
  display: flex;
  align-items: center;
  position: relative;
  min-height: 80px;
  transition: transform 0.2s;
}

.schedule-card:active {
  background: var(--surface-2);
}

.card-left-bar {
  width: 4px;
  height: 24px;
  border-radius: 2px;
  margin-right: 16px;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--fg);
  margin: 0;
  line-height: 1.4;
}

.card-time {
  font-size: 13px;
  color: var(--placeholder);
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-location {
  font-size: 12px;
  color: var(--placeholder);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.time-icon, .location-icon {
  font-size: 14px;
  opacity: 0.8;
}

.card-action {
  color: var(--placeholder);
  opacity: 0.5;
}

/* 滑动删除按钮 */
.swipe-actions {
  height: 100%;
}

.swipe-btn {
  height: 100%;
  width: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.swipe-btn.delete {
  background-color: #ff3b30;
}

/* FAB 按钮 */
.fab-button {
  position: fixed;
  right: 24px;
  bottom: 90px;
  width: 56px;
  height: 56px;
  background: var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(var(--accent-rgb), 0.4);
  z-index: 100;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-button:active {
  transform: scale(0.9);
}

/* 弹窗样式 */
.styled-popup {
  background: var(--bg);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  overflow: hidden;
}

.popup-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}

.popup-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--fg);
}

.popup-btn {
  font-size: 15px;
  cursor: pointer;
}

.popup-btn.cancel {
  color: var(--placeholder);
}

.popup-btn.save {
  color: var(--accent);
  font-weight: 600;
}

.schedule-form {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.form-section {
  background: var(--bg-card);
  border-radius: 16px;
  margin-bottom: 20px;
  overflow: hidden;
}

.title-input {
  font-size: 18px;
  font-weight: 600;
  padding: 20px;
}

.title-input :deep(.van-field__control) {
  color: var(--fg);
}

.color-dot-trigger {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 12px;
  border: 2px solid var(--bg-card);
  box-shadow: 0 0 0 1px var(--border);
}

.form-icon {
  font-size: 20px;
  color: var(--placeholder);
  margin-right: 8px;
}

.color-picker-section {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
}

.section-title {
  font-size: 14px;
  color: var(--placeholder);
  margin-bottom: 16px;
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.color-option-item {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: transform 0.2s;
  cursor: pointer;
}

.color-option-item.active {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* 动画类 */
.animate-fade-in-down {
  animation: fadeInDown 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
}

.animate-bounce-in {
  animation: bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.delay-1 { animation-delay: 0.1s; }

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

/* 列表过渡动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Vant 样式覆盖 */
:deep(.van-cell) {
  background: transparent;
  padding: 16px;
}

:deep(.van-cell::after) {
  left: 56px;
  right: 16px;
  border-bottom-color: var(--border);
}

:deep(.card-style .van-cell::after):last-child {
  display: none;
}

</style>
