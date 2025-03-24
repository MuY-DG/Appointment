import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'client',
      component: () => import('../views/ClientLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/client/HomeView.vue'),
        },
        {
          path: 'pets',
          name: 'pets',
          component: () => import('../views/client/PetListView.vue'),
        },
        {
          path: 'pets/:id',
          name: 'pet-detail',
          component: () => import('../views/client/PetDetailView.vue'),
        },
        {
          path: 'appointments',
          name: 'appointments',
          component: () => import('../views/client/AppointmentListView.vue'),
          meta: { requiresAuth: true },
        },
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          redirect: { name: 'admin-pets' }
        },
        {
          path: 'pets',
          name: 'admin-pets',
          component: () => import('../views/admin/PetManageView.vue'),
        },
        {
          path: 'appointments',
          name: 'admin-appointments',
          component: () => import('../views/admin/AppointmentManageView.vue'),
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: () => import('../views/admin/CategoryManageView.vue'),
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 如果用户已登录且要访问登录页，重定向到首页或管理页
  if (to.path === '/login' && userStore.isLoggedIn) {
    if (userStore.isAdmin) {
      next('/admin')
    } else {
      next('/')
    }
    return
  }

  // 需要权限的页面检查
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath } // 保存原目标路径
    })
  } else if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/')
  } else {
    next()
  }
})

export default router
