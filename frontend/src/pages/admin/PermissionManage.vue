<template>
  <div class="page-container">
    <van-nav-bar title="权限管理" left-arrow @click-left="router.back()" fixed placeholder />
    <van-empty description="权限管理功能开发中..." />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--bg);
}
</style>
