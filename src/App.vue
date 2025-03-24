<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

onMounted(() => {
  // 初始化用户状态
  userStore.initialize()
})
</script>

<template>
  <router-view />
</template>

<style>
/* 全局样式 */
:root {
  --max-width: 1280px;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --primary-color: rgb(99, 102, 241);
  --text-primary: rgb(17, 24, 39);
  --text-secondary: rgb(55, 65, 81);
  --background-light: rgb(249, 250, 251);
  --background-white: rgb(255, 255, 255);
  --transition-base: all 0.3s ease;
}

@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: rgb(243, 244, 246);
    --text-secondary: rgb(209, 213, 219);
    --background-light: rgb(17, 24, 39);
    --background-white: rgb(31, 41, 55);
  }
}

body {
  margin: 0;
  color: var(--text-primary);
  background: var(--background-light);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>