<template>
  <div class="admin-page">
    <van-nav-bar
      title="后台管理"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />
    
    <div class="content">
      <van-cell-group inset title="系统管理">
        <van-cell title="用户管理" is-link to="/admin/users">
          <template #icon>
            <div class="icon-wrapper blue">
              <Icon icon="ph:users-three-bold" />
            </div>
          </template>
        </van-cell>
        <van-cell title="菜品管理" is-link to="/admin/menus">
          <template #icon>
            <div class="icon-wrapper orange">
              <Icon icon="ph:cooking-pot-bold" />
            </div>
          </template>
        </van-cell>
        <van-cell title="权限管理" is-link to="/admin/permissions">
          <template #icon>
            <div class="icon-wrapper purple">
              <Icon icon="ph:lock-key-bold" />
            </div>
          </template>
        </van-cell>
        <van-cell title="日程安排" is-link to="/admin/schedule">
          <template #icon>
            <div class="icon-wrapper green">
              <Icon icon="ph:calendar-blank-bold" />
            </div>
          </template>
        </van-cell>
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

const router = useRouter();

const onClickLeft = () => {
  router.back();
};
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background-color: var(--bg);
}

.content {
  padding-top: 12px;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  margin-right: 12px;
  color: white;
  font-size: 18px;
}

.icon-wrapper.blue { background: linear-gradient(135deg, #00c6fb, #005bea); }
.icon-wrapper.orange { background: linear-gradient(135deg, #ff9a9e, #fecfef); }
.icon-wrapper.purple { background: linear-gradient(135deg, #a18cd1, #fbc2eb); }
.icon-wrapper.green { background: linear-gradient(135deg, #84fab0, #8fd3f4); }
</style>
