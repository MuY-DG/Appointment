<template>
  <el-container class="admin-container">
    <div v-if="isMobile && !isCollapsed" class="mobile-overlay" @click="toggleSidebar"></div>
    <el-aside :width="isMobile ? '220px' : (isCollapsed ? '64px' : '220px')" class="admin-aside" :class="{ 'mobile-aside': isMobile, 'mobile-aside-open': isMobile && !isCollapsed }" v-show="!isMobile || (isMobile && !isCollapsed)">
      <div class="logo-container" :class="{ 'logo-collapsed': isCollapsed && !isMobile }">
        <img src="/favicon.ico" alt="Logo" class="logo-image" />
        <span v-if="!isCollapsed || isMobile" class="logo-text">宠物管理系统</span>
      </div>

      <el-menu
        :router="true"
        :default-active="route.path"
        :collapse="isCollapsed && !isMobile"
        class="admin-menu"
        :class="{ 'menu-mobile': isMobile }"
        background-color="#ffffff"
        text-color="#666"
        active-text-color="#1890ff"
      >
        <el-menu-item index="/" class="menu-item">
          <el-icon><HomeFilled /></el-icon>
          <template #title>
            <span>返回主页</span>
          </template>
        </el-menu-item>

        <div class="menu-divider"></div>
        <el-menu-item index="/admin/pets" class="menu-item">
          <el-icon><PetIcon /></el-icon>
          <template #title>
            <span>宠物管理</span>
          </template>
        </el-menu-item>

        <el-menu-item index="/admin/categories" class="menu-item">
          <el-icon><Grid /></el-icon>
          <template #title>
            <span>分类管理</span>
          </template>
        </el-menu-item>

        <el-menu-item index="/admin/appointments" class="menu-item">
          <el-icon><Calendar /></el-icon>
          <template #title>
            <span>预约管理</span>
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container" :class="{ 'collapsed': isCollapsed && !isMobile }">
      <el-header class="admin-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click.stop="toggleSidebar">
            <Fold v-if="!isMobile" />
            <Expand v-else />
          </el-icon>
          <NavBreadcrumb />
        </div>
      </el-header>

      <el-main class="admin-main">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, h, defineComponent, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Calendar, Grid, Fold, Expand, ArrowDown, HomeFilled } from '@element-plus/icons-vue'

// 自定义宠物图标组件
const PetIcon = defineComponent({
  name: 'PetIcon',
  render() {
    return h(
      'svg',
      {
        viewBox: '0 0 1024 1024',
        width: '1.2em',
        height: '1.2em',
      },
      [
        h('path', {
          fill: 'currentColor',
          d: 'M512 196.8c-12.8 0-25.6 3.2-38.4 9.6-51.2 25.6-80 80-80 137.6v48c0 54.4 41.6 99.2 96 105.6v48c-54.4 6.4-96 51.2-96 105.6v48c0 57.6 28.8 112 80 137.6 12.8 6.4 25.6 9.6 38.4 9.6s25.6-3.2 38.4-9.6c51.2-25.6 80-80 80-137.6v-48c0-54.4-41.6-99.2-96-105.6v-48c54.4-6.4 96-51.2 96-105.6v-48c0-57.6-28.8-112-80-137.6-12.8-6.4-25.6-9.6-38.4-9.6z',
        }),
      ],
    )
  },
})

// 面包屑导航组件
const NavBreadcrumb = defineComponent({
  name: 'NavBreadcrumb',
  setup() {
    const route = useRoute()
    const pathNames: {
      '/admin/pets': string
      '/admin/categories': string
      '/admin/appointments': string
      [key: string]: string // Add index signature
    } = {
      '/admin/pets': '宠物管理',
      '/admin/categories': '分类管理',
      '/admin/appointments': '预约管理',
    }

    return () =>
      h('el-breadcrumb', { separator: '/' }, [
        h('el-breadcrumb-item', null, { default: () => '首页' }),
        h('el-breadcrumb-item', null, { default: () => pathNames[route.path] || '管理系统' }),
      ])
  },
})

const route = useRoute()
const isMobile = ref(window.innerWidth <= 768)
const isCollapsed = ref(true) // 默认收起状态

// 监听路由变化，在移动端下自动收起侧边栏
watch(route, () => {
  if (isMobile.value && !isCollapsed.value) {
    isCollapsed.value = true
  }
})

// 监听移动端点击事件，关闭侧边栏
const handleClickOutside = (event: MouseEvent) => {
  // 如果点击的是折叠按钮，不处理
  const collapseBtn = document.querySelector('.collapse-btn')
  if (collapseBtn && collapseBtn.contains(event.target as Node)) {
    return
  }
  
  if (isMobile.value && !isCollapsed.value) {
    const aside = document.querySelector('.mobile-aside')
    if (aside && !aside.contains(event.target as Node)) {
      isCollapsed.value = true
    }
  }
}

function toggleSidebar() {
  if (isMobile.value) {
    // 移动端下只控制显示/隐藏，不改变菜单展开状态
    isCollapsed.value = !isCollapsed.value
  } else {
    // 桌面端下正常切换菜单展开/折叠状态
    isCollapsed.value = !isCollapsed.value
  }
}

function handleResize() {
  const newIsMobile = window.innerWidth <= 768
  isMobile.value = newIsMobile
  // 在切换到移动端时自动收起侧边栏
  if (newIsMobile && !isCollapsed.value) {
    isCollapsed.value = true
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  // 延迟添加点击监听，避免初始化时的冲突
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.admin-container {
  height: 100vh;
  background: var(--background-light);
  display: flex;
  width: 100%;
  max-width: 100vw;
  position: relative;
  overflow-x: hidden;
}

/* 侧边栏样式 */
.admin-aside {
  height: 100vh;
  background: var(--background-white);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: none;
  z-index: 10;
  border-right: 1px solid var(--border-color);
  margin: 0;
  padding: 0;
  position: relative;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(4px);
  opacity: 1;
  transition: opacity 0.3s ease;
}

.mobile-overlay-enter-active,
.mobile-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.mobile-overlay-enter-from,
.mobile-overlay-leave-to {
  opacity: 0;
}

.mobile-aside {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  height: 100vh;
  transform: translateX(-100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-lg);
  background: var(--background-white);
  width: 220px !important;
  display: flex;
  flex-direction: column;
}

.mobile-aside-open {
  transform: translateX(0) !important;
}

.mobile-aside .admin-menu {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.menu-mobile {
  width: 220px !important;
}

.menu-mobile.el-menu {
  border-right: none !important;
}

.menu-mobile .el-menu-item {
  width: calc(100% - 16px) !important;
  margin: 4px 8px !important;
  padding: 0 16px !important;
  border-radius: 6px !important;
}

.menu-mobile:not(.el-menu--collapse) {
  width: 220px !important;
}

.mobile-aside .logo-container {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .admin-aside {
    position: fixed;
    box-shadow: var(--shadow-lg);
  }
  
  .main-container {
    margin-left: 0 !important;
    width: 100%;
    min-height: 100vh;
    padding-left: 0;
  }

  .admin-container {
    padding-left: 0;
  }

  :deep(.el-menu) {
    width: 100%;
  }

  :deep(.el-menu--collapse) {
    width: 64px;
  }
}

/* LOGO 区域样式 */
.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  overflow: hidden;
  white-space: nowrap;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  transition: all 0.3s;
  position: relative;
}

.logo-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    var(--border-color) 20%, 
    var(--border-color) 80%, 
    transparent 100%);
}

.logo-collapsed {
  padding: 0;
  justify-content: center;
}

.logo-image {
  width: 28px;
  height: 28px;
  margin-right: 12px;
  transition: all 0.3s;
  filter: brightness(0) invert(1);
  animation: pulse 2s infinite;
}

@media (max-width: 768px) {
  .logo-image {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.logo-text {
  color: white;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: all 0.3s;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .logo-text {
    font-size: 16px;
  }
}

/* 菜单分隔线 */
.menu-divider {
  margin: 8px 16px;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    var(--border-color) 20%, 
    var(--border-color) 80%, 
    transparent 100%);
  opacity: 0.6;
}

/* 菜单样式 */
.admin-menu {
  border: none;
  height: calc(100% - 64px);
  padding: 16px 8px;
  background: var(--background-white) !important;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
}

:deep(.el-menu-item) {
  height: 50px !important;
  line-height: 50px !important;
  margin: 4px 8px;
  border-radius: var(--radius-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-primary) !important;
  width: calc(100% - 16px);
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 12px;
  font-size: 20px;
  transition: all 0.3s;
}

@media (max-width: 768px) {
  :deep(.el-menu-item .el-icon) {
    margin-right: 8px;
    font-size: 16px;
  }
}

:deep(.el-menu-item.is-active) {
  background: var(--primary-color) !important;
  color: white !important;
  font-weight: 500;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

:deep(.el-menu-item.is-active .el-icon) {
  transform: scale(1.1);
}

:deep(.el-menu-item:not(.is-active):hover) {
  background: rgba(99, 102, 241, 0.1) !important;
  transform: translateX(4px);
}

:deep(.el-menu-item[data-index="/"]) {
  margin-bottom: 4px;
}

:deep(.el-menu-item[data-index="/"].is-active) {
  background: var(--primary-color) !important;
  color: white !important;
}

/* 折叠状态样式 */
:deep(.el-menu--collapse) {
  transition: all 0.3s;
}

:deep(.el-menu--collapse .el-menu-item) {
  padding: 0 !important;
  justify-content: center;
  text-align: center;
  margin: 4px auto;
  width: 36px;
}

:deep(.el-menu--collapse .el-icon) {
  margin: 0;
  font-size: 18px;
}

:deep(.el-menu--collapse) {
  width: 48px;
}

:deep(.el-menu--collapse .el-menu-item) {
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
}

/* 主内容区样式 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--background-light);
  transition: margin-left 0.3s;
}

.admin-header {
  height: 64px;
  background: var(--background-white);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  padding: 0 24px;
  flex-shrink: 0;
  position: relative;
  backdrop-filter: blur(8px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.collapse-btn {
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--text-primary);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  position: relative;
  z-index: 1001; /* 确保按钮在遮罩层之上 */
}

.collapse-btn:hover {
  color: var(--primary-color);
  background: rgba(99, 102, 241, 0.1);
}

.admin-main {
  padding: 24px;
  background: var(--background-light);
  flex: 1;
  overflow-y: auto;
  position: relative;
  width: 100%;
  max-width: 100%;
}

.admin-main::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(180deg, 
    rgba(99, 102, 241, 0.05) 0%, 
    transparent 100%);
  pointer-events: none;
}

/* 面包屑样式 */
:deep(.el-breadcrumb) {
  line-height: 1;
}

:deep(.el-breadcrumb__item) {
  display: flex;
  align-items: center;
}

:deep(.el-breadcrumb__inner) {
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.3s;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--primary-color);
  font-weight: 600;
}

/* 移动端样式覆盖 */
@media (max-width: 768px) {
  .admin-container {
    overflow-x: hidden;
  }
  .admin-aside {
    width: 220px !important;
  }
  
  .mobile-aside {
    width: 220px !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .mobile-aside-open {
    transform: translateX(0) !important;
  }

  .el-menu:not(.el-menu--collapse) {
    width: 220px !important;
  }

  .mobile-aside .admin-menu {
    width: 100% !important;
    height: calc(100vh - 64px) !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-aside .logo-container {
    width: 100% !important;
    height: 64px !important;
  }

  :deep(.el-menu) {
    border-right: none !important;
  }

  :deep(.el-menu-item) {
    padding-left: 20px !important;
    margin: 4px 8px !important;
    border-radius: 6px !important;
  }
  .admin-main {
    padding: 16px;
  }

  :deep(.el-menu-item) {
    margin: 4px auto;
    width: calc(100% - 8px);
  }

  .logo-container {
    padding: 0 12px;
    justify-content: center;
  }

  .logo-container.logo-collapsed {
    padding: 0;
  }

  .admin-header {
    padding: 0 16px;
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .main-container {
    margin-left: 0 !important;
    width: 100%;
    position: relative;
    z-index: 1;
    min-height: 100vh;
  }

  .mobile-aside {
    background: var(--background-white);
  }

  .mobile-aside .admin-menu {
    width: 100%;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .logo-container {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  }

  .logo-image {
    filter: brightness(0) invert(1);
  }

  :deep(.el-menu-item:not(.is-active):hover) {
    background: rgba(99, 102, 241, 0.2) !important;
  }

  .admin-main::before {
    background: linear-gradient(180deg, 
      rgba(99, 102, 241, 0.1) 0%, 
      transparent 100%);
  }
}
</style>
