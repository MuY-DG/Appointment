import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types/api'
import { ApiService } from '@/services/api'

interface LoginResult {
  success: boolean
  message?: string
  user?: User
}

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const isLoggedIn = computed(() => !!currentUser.value)
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

  // 登录或注册功能
  async function loginOrRegister(username: string): Promise<LoginResult> {
    try {
      const response = await ApiService.loginOrRegister(username)

      if (response.data) {
        const user = response.data
        currentUser.value = user
        // 保存到本地存储，实现持久化登录状态
        localStorage.setItem('currentUser', JSON.stringify(user))
        return {
          success: true,
          user,
        }
      }
      return {
        success: false,
        message: '登录失败，请稍后重试',
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      return {
        success: false,
        message: error.response?.data?.message || '登录失败，请稍后重试',
      }
    }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }

  // 初始化时从本地存储恢复用户状态
  function initialize() {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      try {
        currentUser.value = JSON.parse(storedUser)
      } catch (e) {
        localStorage.removeItem('currentUser')
      }
    }
  }

  return { currentUser, isLoggedIn, isAdmin, loginOrRegister, logout, initialize }
})
