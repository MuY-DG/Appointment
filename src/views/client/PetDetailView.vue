<template>
  <div class="pet-detail-container">
    <el-row :gutter="20">
      <el-col :xs="24" :md="12">
        <div class="pet-image-container">
          <img
            :src="pet?.petImageUrl || 'https://placehold.co/600x400?text=No+Image'"
            class="pet-image"
          />
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="pet-info">
          <h1>{{ pet?.petName }}</h1>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="分类">{{
              pet?.category?.categoryName
            }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(pet?.status || '')">
                {{ pet?.status }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="action-buttons" v-if="pet?.status === '可预约'">
            <el-button
              type="primary"
              @click="showAppointmentDialog"
              :disabled="!userStore.isLoggedIn"
            >
              立即预约
            </el-button>
            <p v-if="!userStore.isLoggedIn" class="login-tip">
              请先 <router-link to="/login">登录</router-link> 后再预约
            </p>
          </div>
          <div v-else class="unavailable-message">
            <el-alert
              :title="getUnavailableMessage(pet?.status)"
              :type="getStatusType(pet?.status || '')"
              :description="getUnavailableDescription(pet?.status)"
              show-icon
              :closable="false"
            ></el-alert>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 预约表单对话框 -->
    <el-dialog v-model="appointmentDialogVisible" title="预约宠物" width="500px">
      <el-form :model="appointmentForm" label-width="100px">
        <el-form-item label="预约时间">
          <el-date-picker
            v-model="appointmentForm.appointmentTime"
            type="datetime"
            placeholder="选择预约时间"
            :disabled-date="disabledDate"
            :disabled-hours="disabledHours"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="appointmentForm.notes"
            type="textarea"
            rows="3"
            placeholder="请输入备注信息（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="appointmentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAppointment" :loading="submitting"
            >提交预约</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ApiService } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { useAppointmentStore } from '@/stores/appointment'
import type { Pet } from '@/types/api'
import { AppointmentStatus } from '@/types/api'
function getStatusType(status: string) {
  switch (status) {
    case '可预约':
      return 'success'
    case '已预约':
      return 'warning'
    case '配对中':
      return 'primary'
    case '配对完成':
      return 'info'
    case '已下架':
      return 'danger'
    case '不可预约':
      return 'info'
    default:
      return ''
  }
}

function getUnavailableMessage(status: string | undefined) {
  switch (status) {
    case '已预约':
      return '该宠物已被预约'
    case '配对中':
      return '该宠物正在配对中'
    case '配对完成':
      return '该宠物配对已完成'
    case '已下架':
      return '该宠物已下架'
    case '不可预约':
      return '该宠物当前不可预约'
    default:
      return '该宠物当前不可预约'
  }
}

function getUnavailableDescription(status: string | undefined) {
  switch (status) {
    case '已预约':
      return '该宠物已被其他用户预约，请选择其他宠物或稍后再试'
    case '配对中':
      return '该宠物正在与其他宠物配对中，暂时无法预约'
    case '配对完成':
      return '该宠物已完成配对，暂时无法预约'
    case '已下架':
      return '该宠物已被下架，无法预约'
    case '不可预约':
      return '该宠物当前不可预约，请选择其他宠物或稍后再试'
    default:
      return '请选择其他宠物或稍后再试'
  }
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appointmentStore = useAppointmentStore()

const pet = ref<Pet | null>(null)
const loading = ref(true)
const appointmentDialogVisible = ref(false)
const submitting = ref(false)

const appointmentForm = reactive({
  appointmentTime: null as Date | null,
  notes: '',
})

onMounted(async () => {
  const petId = parseInt(route.params.id as string)
  if (isNaN(petId)) {
    ElMessage.error('无效的宠物ID')
    router.push('/pets')
    return
  }

  try {
    loading.value = true
    const response = await ApiService.getPet(petId)
    pet.value = response.data
  } catch (error) {
    console.error('Failed to load pet details:', error)
    ElMessage.error('加载宠物详情失败')
  } finally {
    loading.value = false
  }
})

function showAppointmentDialog() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  appointmentDialogVisible.value = true
}

async function submitAppointment() {
  if (!appointmentForm.appointmentTime) {
    ElMessage.warning('请选择预约时间')
    return
  }

  if (!pet.value || !userStore.currentUser) {
    ElMessage.error('缺少必要信息')
    return
  }

  try {
    submitting.value = true
    await appointmentStore.createAppointment({
      petId: pet.value.id,
      requesterId: userStore.currentUser.id,
      appointmentTime: appointmentForm.appointmentTime.toISOString(),
      status: AppointmentStatus.REQUESTED, // 根据实际枚举值调整,
    })

    ElMessage.success('预约提交成功，请等待管理员确认')
    appointmentDialogVisible.value = false

    // 重新加载宠物信息，以防状态已更改
    const response = await ApiService.getPet(pet.value.id)
    pet.value = response.data
  } catch (error) {
    console.error('Failed to submit appointment:', error)
    ElMessage.error('预约提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function disabledDate(time: Date) {
  // 禁用过去的日期
  return time.getTime() < Date.now() - 8.64e7 // 24小时前
}

function disabledHours() {
  // 禁用工作时间外的小时（假设工作时间为9:00-18:00）
  const hours = []
  for (let i = 0; i < 24; i++) {
    if (i < 9 || i > 18) {
      hours.push(i)
    }
  }
  return hours
}
</script>

<style scoped>
.pet-detail-container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 32px;
  min-height: 100vh;
  animation: fadeIn 0.3s ease;
}

/* 图片区域 */
.pet-image-container {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  background: var(--background-white);
  margin-bottom: 24px;
  animation: slideInRight 0.5s ease;
}

.pet-image {
  width: 100%;
  height: 600px;
  object-fit: cover;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.pet-image-container:hover .pet-image {
  transform: scale(1.05);
}

.pet-image-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    transparent 70%,
    rgba(0, 0, 0, 0.1) 100%
  );
  pointer-events: none;
}

/* 信息区域 */
.pet-info {
  padding: 32px;
  background: var(--background-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  animation: slideInRight 0.7s ease;
}

.pet-info h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 24px;
  position: relative;
  padding-left: 16px;
}

.pet-info h1::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 32px;
  background: var(--primary-color);
  border-radius: var(--radius-sm);
}

/* 描述列表样式 */
:deep(.el-descriptions) {
  margin-bottom: 24px;
}

:deep(.el-descriptions__cell) {
  padding: 20px !important;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  color: var(--text-primary);
  background: var(--background-light);
  width: 120px;
}

:deep(.el-descriptions__content) {
  color: var(--text-secondary);
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: var(--radius-md);
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
}

:deep(.el-tag--success) {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

:deep(.el-tag--warning) {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
}

:deep(.el-tag--primary) {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
}

:deep(.el-tag--info) {
  background: rgba(75, 85, 99, 0.1);
  color: var(--text-secondary);
}

:deep(.el-tag--danger) {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}

/* 操作按钮区域 */
.action-buttons {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}

:deep(.el-button--primary) {
  padding: 12px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  background: var(--primary-color);
  border-color: var(--primary-color);
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

.login-tip {
  margin-top: 12px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  animation: fadeIn 0.5s ease;
}

.login-tip a {
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
}

.login-tip a:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

/* 不可用消息 */
.unavailable-message {
  margin-top: 32px;
}

:deep(.el-alert) {
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  border: none;
}

:deep(.el-alert__title) {
  font-size: 1.1rem;
  font-weight: 600;
}

:deep(.el-alert__description) {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

:deep(.el-dialog__header) {
  margin: 0;
  padding: 20px 24px;
  background: var(--background-light);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-dialog__title) {
  font-weight: 700;
  color: var(--text-primary);
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--text-primary);
}

:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper) {
  box-shadow: none !important;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__wrapper:hover) {
  border-color: var(--primary-color);
}

:deep(.el-input__wrapper:focus-within),
:deep(.el-textarea__wrapper:focus-within) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .pet-detail-container {
    padding: 16px;
  }

  .pet-image {
    height: 400px;
  }

  .pet-info {
    padding: 20px;
  }

  .pet-info h1 {
    font-size: 2rem;
  }

  :deep(.el-descriptions__label) {
    width: 100px;
  }

  :deep(.el-descriptions__cell) {
    padding: 16px !important;
  }

  :deep(.el-button--primary) {
    width: 100%;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .pet-image-container::after {
    background: linear-gradient(
      to bottom,
      transparent 70%,
      rgba(0, 0, 0, 0.2) 100%
    );
  }

  :deep(.el-descriptions__label) {
    background: var(--background-white);
  }

  :deep(.el-dialog__header) {
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

@keyframes slideInRight {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
