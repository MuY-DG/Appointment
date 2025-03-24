<template>
  <div class="appointment-list-container">
    <h1>我的预约</h1>

    <el-table :data="appointments" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="预约编号" min-width="100" />
      <el-table-column prop="pet.petName" label="宠物名称" min-width="120" />
      <el-table-column prop="appointmentTime" label="预约时间" min-width="180">
        <template #default="scope">
          {{ formatDate(scope.row.appointmentTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === '申请状态'"
            size="small"
            type="danger"
            @click="cancelAppointment(scope.row.id)"
          >
            取消预约
          </el-button>
          <el-button v-else size="small" type="primary" @click="viewDetails(scope.row)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        :total="total"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :background="true"
        layout="prev, pager, next"
      />
    </div>

    <el-dialog v-model="detailsDialogVisible" title="预约详情" width="50%">
      <el-descriptions v-if="selectedAppointment" :column="2" border>
        <el-descriptions-item label="预约编号">{{ selectedAppointment.id }}</el-descriptions-item>
        <el-descriptions-item label="预约状态">
          <el-tag :type="getStatusType(selectedAppointment.status)">
            {{ getStatusText(selectedAppointment.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="宠物名称">{{
          selectedAppointment.pet?.petName
        }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{
          formatDate(selectedAppointment.appointmentTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{
          formatDate(selectedAppointment.createdAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{
          formatDate(selectedAppointment.updatedAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{
          selectedAppointment.notes || '无'
        }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ApiService } from '@/services/api'
import { AppointmentStatus } from '@/types/api'
import type { Appointment, PageResult } from '@/types/api'
import { useUserStore } from '@/stores/user'

const appointments = ref<Appointment[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const small = ref(false)
const disabled = ref(false)
const background = ref(true)
const total = ref(0)
const detailsDialogVisible = ref(false)
const selectedAppointment = ref<Appointment | null>(null)

onMounted(() => {
  loadAppointments()
})

const userStore = useUserStore()

async function loadAppointments() {
  loading.value = true
  try {
    if (!userStore.currentUser) {
      throw new Error('User not logged in')
    }
    const response = await ApiService.getUserAppointments({
      userId: userStore.currentUser.id,
      page: currentPage.value - 1,
      size: pageSize.value,
    })
    // const pageResult = response.data as PageResult<Appointment>
    // appointments.value = pageResult.records
    // 修改后（正确分页类型转换）
    interface AppointmentPageResponse {
      content: Appointment[]
      totalElements: number
      number: number
      size: number
    }

    if (response?.data?.records) {
      appointments.value = response.data.records
      total.value = response.data.total || 0
    } else {
      appointments.value = []
      total.value = 0
      console.warn('No records found in response:', response)
    }
    // total.value = pageResult.total
  } catch (error) {
    console.error('Failed to load appointments:', error)
    ElMessage.error('加载预约失败')
  } finally {
    loading.value = false
  }
}

// 监听分页变化
watch(
  [currentPage, pageSize],
  ([newPage, newSize], [oldPage, oldSize]) => {
    if (newPage !== oldPage || newSize !== oldSize) {
      loadAppointments()
    }
  },
  { immediate: false },
)

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}

function getStatusType(status: string) {
  switch (status) {
    case '申请状态':
      return 'warning'
    case '进行状态':
      return 'primary'
    case '完成状态':
      return 'success'
    case '取消状态':
      return 'info'
    default:
      return 'default'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case '申请状态':
      return '待确认'
    case '进行状态':
      return '进行中'
    case '完成状态':
      return '已完成'
    case '取消状态':
      return '已取消'
    default:
      return '未知状态'
  }
}

async function cancelAppointment(id: number) {
  try {
    await ElMessageBox.confirm('确定要取消这个预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await ApiService.updateAppointmentStatus(id, '取消状态')
    ElMessage.success('预约已取消')
    loadAppointments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to cancel appointment:', error)
      ElMessage.error('取消预约失败')
    }
  }
}

function viewDetails(appointment: Appointment) {
  selectedAppointment.value = appointment
  detailsDialogVisible.value = true
}
</script>

<style scoped>
.appointment-list-container {
  padding: 24px;
  max-width: var(--max-width);
  margin: 0 auto;
  min-height: 100%;
  animation: fadeIn 0.3s ease;
}

.appointment-list-container h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
  position: relative;
  padding-left: 16px;
  animation: slideInRight 0.5s ease;
}

.appointment-list-container h1::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: var(--primary-color);
  border-radius: var(--radius-sm);
}

/* 表格样式 */
:deep(.el-table) {
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  background: var(--background-white);
}

:deep(.el-table:hover) {
  box-shadow: var(--shadow-md);
}

:deep(.el-table th) {
  background: var(--background-light) !important;
  font-weight: 600;
  color: var(--text-primary);
  padding: 16px;
}

:deep(.el-table td) {
  padding: 16px;
  color: var(--text-secondary);
}

:deep(.el-table__inner-wrapper) {
  background: var(--background-white);
}

:deep(.el-table__body) {
  background: var(--background-white);
}

:deep(.el-table__body tr) {
  background: var(--background-white);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background: rgba(99, 102, 241, 0.05);
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
}

:deep(.el-tag--warning) {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-color);
}

:deep(.el-tag--primary) {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
}

:deep(.el-tag--success) {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

:deep(.el-tag--info) {
  background: rgba(75, 85, 99, 0.1);
  color: var(--text-secondary);
}

/* 按钮样式 */
:deep(.el-button--small) {
  padding: 8px 16px;
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.el-button--primary:hover) {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

:deep(.el-button--danger) {
  background: var(--danger-color);
  border-color: var(--danger-color);
}

:deep(.el-button--danger:hover) {
  background: #dc2626;
  border-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

/* 分页容器样式 */
.pagination-container {
  margin-top: 24px;
  padding: 16px;
  display: flex;
  justify-content: center;
  background: var(--background-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

:deep(.el-pagination) {
  padding: 0;
  font-weight: 500;
}

:deep(.el-pagination button) {
  background: transparent;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

:deep(.el-pagination button:hover) {
  background: rgba(99, 102, 241, 0.1);
}

:deep(.el-pagination .el-pager li) {
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-pagination .el-pager li.active) {
  background: var(--primary-color);
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

:deep(.el-descriptions) {
  padding: 0;
}

:deep(.el-descriptions__header) {
  margin-bottom: 16px;
}

:deep(.el-descriptions__title) {
  font-weight: 600;
  color: var(--text-primary);
}

:deep(.el-descriptions__body) {
  background: var(--background-white);
}

:deep(.el-descriptions__label) {
  font-weight: 500;
  color: var(--text-primary);
  background: var(--background-light);
}

:deep(.el-descriptions__content) {
  color: var(--text-secondary);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .appointment-list-container {
    padding: 16px;
  }

  .appointment-list-container h1 {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }

  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 12px;
  }

  :deep(.el-button--small) {
    padding: 6px 12px;
  }

  :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  :deep(.el-table th) {
    background: var(--background-white) !important;
  }

  :deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
    background: rgba(99, 102, 241, 0.1);
  }

  :deep(.el-dialog__header) {
    background: var(--background-white);
  }

  :deep(.el-descriptions__label) {
    background: var(--background-white);
  }
}
</style>
