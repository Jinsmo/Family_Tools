<template>
  <GlobalNavBar />
  <router-view />
  <GlobalTabBar />
  <GlobalMessage />
</template>

<script setup lang="ts">
import GlobalNavBar from '../components/GlobalNavBar.vue';
import GlobalTabBar from '../components/GlobalTabBar.vue';
import GlobalMessage from '../components/GlobalMessage.vue';
</script>

<style>
html, body, #app { height: 100%; }
</style>
