<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="mobile-header" v-if="isMobile">
        <el-button 
          class="menu-toggle"
          @click="isMenuOpen = !isMenuOpen"
          :icon="isMenuOpen ? 'el-icon-close' : 'el-icon-menu'"
        >
          <el-icon v-if="!isMenuOpen"><Menu /></el-icon>
          <el-icon v-else><Close /></el-icon>
        </el-button>
        <h1 class="mobile-title">宠物预约</h1>
      </div>
      <el-menu
        :mode="isMobile ? 'vertical' : 'horizontal'"
        :collapse="false"
        :router="true"
        :default-active="route.path"
        :class="{ 'el-menu--collapse': isMenuOpen }"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/pets">宠物列表</el-menu-item>
        <template v-if="userStore.isLoggedIn">
          <el-menu-item index="/appointments">我的预约</el-menu-item>
          <el-menu-item v-if="userStore.isAdmin" index="/admin">后台管理</el-menu-item>
        </template>
        <div v-if="!isMobile" class="flex-grow" />
        <template v-if="userStore.isLoggedIn">
          <el-menu-item>
            <span>欢迎，{{ userStore.currentUser?.username }}</span>
          </el-menu-item>
          <el-menu-item @click="handleLogout">退出</el-menu-item>
        </template>
        <el-menu-item v-else index="/login">登录</el-menu-item>
      </el-menu>
    </el-header>

    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Menu, Close } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isMobile = ref(window.innerWidth <= 768)
const isMenuOpen = ref(false)

function handleResize() {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    isMenuOpen.value = false
  }
}

// 监听路由变化，在移动端时关闭菜单
watch(route, () => {
  if (isMobile.value) {
    isMenuOpen.value = false
  }
})

onMounted(() => {
  userStore.initialize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function handleLogout() {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style>
.app-container {
  min-height: 100vh;
  background: var(--background-light);
}

.app-header {
  padding: 0;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  transition: var(--transition-base);
}

.mobile-header {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  height: 64px;
}

.mobile-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-left: 1rem;
}

.menu-toggle {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-base);
  border-radius: var(--radius-md);
}

.menu-toggle:hover {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
}

.app-header:hover {
  box-shadow: var(--shadow-md);
}

.el-menu {
  border: none !important;
  background: transparent !important;
  transition: var(--transition-base);
}

.el-menu-item {
  font-weight: 500;
  transition: var(--transition-base) !important;
  margin: 0 0.25rem;
  position: relative;
  color: var(--text-secondary) !important;
}

.el-menu-item:hover {
  color: var(--primary-color) !important;
  background: transparent !important;
}

.el-menu-item.is-active {
  color: var(--primary-color) !important;
  background: transparent !important;
  font-weight: 600;
}

.el-menu-item.is-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: var(--primary-color);
  border-radius: 2px;
  transition: var(--transition-base);
}

.el-menu-item:hover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 2px;
  background: var(--primary-color);
  opacity: 0.5;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0;
    position: fixed;
    width: 100%;
    z-index: 1000;
  }

  .el-main {
    padding-top: 64px !important;
  }

  .el-menu {
    position: fixed;
    top: 64px;
    left: -100%;
    width: 240px;
    height: calc(100vh - 64px);
    background: var(--background-white) !important;
    box-shadow: var(--shadow-lg);
    transition: left 0.3s ease;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  .el-menu.el-menu--collapse {
    left: 0;
  }

  .el-menu-item {
    margin: 0.25rem 0;
    border-radius: var(--radius-md);
  }

  .el-menu-item:hover,
  .el-menu-item.is-active {
    background: rgba(99, 102, 241, 0.1) !important;
  }

  .el-menu-item::after,
  .el-menu-item:hover::after,
  .el-menu-item.is-active::after {
    display: none;
  }
}

@media (min-width: 769px) {
  .el-menu {
    display: flex;
    padding: 0 2rem;
  }

  .flex-grow {
    flex-grow: 1;
  }
}

.el-main {
  padding: 0;
  max-width: var(--max-width);
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 640px) {
  .el-main {
    padding: 1rem;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .app-header {
    background: rgba(31, 41, 55, 0.8);
  }

  .el-menu-item {
    color: var(--text-primary) !important;
  }

  .el-menu-item:hover:not(.is-active) {
    background: rgba(99, 102, 241, 0.1) !important;
  }
}
</style>