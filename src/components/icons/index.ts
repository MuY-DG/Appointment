import { Search, Menu, Calendar, Check, Clock } from '@element-plus/icons-vue'
import type { App } from 'vue'

// 注册全局图标组件
export function setupIcons(app: App) {
  // 使用更直接的方式注册图标组件
  const icons = {
    'el-icon-search': Search,
    'el-icon-menu': Menu,
    'el-icon-calendar': Calendar,
    'el-icon-check': Check,
    'el-icon-clock': Clock,
  }

  // 注册所有图标
  Object.entries(icons).forEach(([name, component]) => {
    app.component(name, component)
  })
}
