<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>游戏登录</h2>
      </template>
      <el-form @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="username" placeholder="请输入用户名" autofocus></el-input>
          <div class="form-tip">首次登录将自动完成注册</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" class="submit-btn">
            {{ loading ? '正在登录...' : '登录游戏' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value) {
    ElMessage.warning('请输入用户名')
    return
  }

  loading.value = true
  try {
    const result = await userStore.loginOrRegister(username.value)
    if (result.success) {
      ElMessage.success('登录成功')
      
      // 获取重定向路径
      const redirect = router.currentRoute.value.query.redirect as string
      
      // 根据角色和重定向路径决定跳转目标
      if (redirect) {
        router.push(redirect)
      } else if (result.user?.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } else {
      ElMessage.error(result.message || '登录失败，请稍后重试')
    }
  } catch (error) {
    console.error('Login error:', error)
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.1) 0%,
    rgba(99, 102, 241, 0.05) 100%);
  padding: 20px;
  animation: fadeIn 0.5s ease;
}

.login-card {
  width: 100%;
  max-width: 440px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  background: var(--background-white);
  border: 1px solid var(--border-color);
  overflow: hidden;
  animation: slideUp 0.5s ease;
}

:deep(.el-card__header) {
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, 
    var(--primary-color) 0%, 
    var(--primary-hover) 100%);
}

.login-card h2 {
  margin: 0;
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-card__body) {
  padding: 32px;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-size: 0.875rem;
}

:deep(.el-input__wrapper) {
  box-shadow: none !important;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
  background: var(--background-light);
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--primary-color);
}

:deep(.el-input__wrapper:focus-within) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
}

:deep(.el-input__inner) {
  height: 44px;
  font-size: 1rem;
  color: var(--text-primary);
}

:deep(.el-input__inner::placeholder) {
  color: var(--text-light);
}

.form-tip {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 8px;
  padding-left: 4px;
}

.submit-btn {
  width: 100%;
  margin-top: 16px;
  height: 48px;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  background: var(--primary-color);
  border-color: var(--primary-color);
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

/* 响应式适配 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card h2 {
    font-size: 1.5rem;
  }

  :deep(.el-card__body) {
    padding: 24px;
  }

  :deep(.el-input__inner) {
    height: 40px;
  }

  .submit-btn {
    height: 44px;
    font-size: 1rem;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .login-container {
    background: linear-gradient(135deg, 
      rgba(99, 102, 241, 0.15) 0%,
      rgba(99, 102, 241, 0.1) 100%);
  }

  :deep(.el-input__wrapper) {
    background: var(--background-white);
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
