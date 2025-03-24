<template>
  <div class="appointment-manage-container">
    <div class="page-header">
      <h1>预约管理</h1>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索宠物名称/预约人"
          clearable
          @clear="handleSearch"
          @input="handleSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateRangeChange"
          class="date-picker"
        />
        <el-button type="primary" @click="refreshData">刷新数据</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="status-tabs">
      <el-tab-pane label="申请状态" name="申请状态">
        <el-badge :value="statusCounts['申请状态'] || '0'" class="tab-badge" type="warning" />
      </el-tab-pane>
      <el-tab-pane label="进行状态" name="进行状态">
        <el-badge :value="statusCounts['进行状态'] || '0'" class="tab-badge" type="primary" />
      </el-tab-pane>
      <el-tab-pane label="完成状态" name="完成状态">
        <el-badge :value="statusCounts['完成状态'] || '0'" class="tab-badge" type="success" />
      </el-tab-pane>
      <el-tab-pane label="取消状态" name="取消状态">
        <el-badge :value="statusCounts['取消状态'] || '0'" class="tab-badge" type="info" />
      </el-tab-pane>
    </el-tabs>

    <el-table
      :data="filteredAppointments"
      style="width: 100%"
      v-loading="loading"
      :empty-text="loading ? '加载中...' : '暂无预约记录'"
      border
      stripe
      highlight-current-row
    >
      <el-table-column prop="id" label="ID" width="80" sortable></el-table-column>
      <el-table-column prop="pet.petName" label="宠物名称" width="120">
        <template #default="scope">
          <el-tooltip
            effect="dark"
            :content="'品种：' + scope.row.pet?.category?.categoryName"
            placement="top"
          >
            <span>{{ scope.row.pet?.petName }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="requester.username" label="预约人" width="120">
        <template #default="scope">
          <el-tooltip
            effect="dark"
            :content="'联系方式：' + scope.row.requester?.username"
            placement="top"
          >
            <span>{{ scope.row.requester?.username }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="appointmentTime" label="预约时间" width="180" sortable>
        <template #default="scope">
          {{ formatDate(scope.row.appointmentTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="notes" label="预约备注" min-width="200">
        <template #default="scope">
          <el-tooltip
            effect="dark"
            :content="scope.row.notes || '无备注'"
            placement="top"
            :disabled="!scope.row.notes"
          >
            <span>{{ scope.row.notes || '无备注' }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" sortable>
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <div class="button-container">
            <template v-if="scope.row.status === '申请状态'">
              <el-button
                size="small"
                type="success"
                @click="updateStatus(scope.row.id, '进行状态')"
              >
                开始服务
              </el-button>
              <el-button size="small" type="danger" @click="updateStatus(scope.row.id, '取消状态')">
                取消预约
              </el-button>
            </template>

            <template v-if="scope.row.status === '进行状态'">
              <el-button
                size="small"
                type="success"
                @click="updateStatus(scope.row.id, '完成状态')"
              >
                完成服务
              </el-button>
            </template>

            <template v-if="scope.row.status === '完成状态'">
              <el-button size="small" type="danger" @click="deleteAppointment(scope.row.id)">
                删除预约
              </el-button>
            </template>

            <template v-if="scope.row.status === '取消状态'">
              <el-button size="small" type="danger" @click="deleteAppointment(scope.row.id)">
                删除预约
              </el-button>
            </template>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        :total="totalAppointments"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :background="true"
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50, 100]"
      />
    </div>

    <el-dialog
      v-model="noteDialogVisible"
      title="添加服务备注"
      width="50%"
      :close-on-click-modal="false"
    >
      <el-form :model="noteForm" label-width="100px">
        <el-form-item label="服务备注">
          <el-input
            v-model="noteForm.notes"
            type="textarea"
            :rows="4"
            placeholder="请输入服务过程中的注意事项、完成情况等备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="noteDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNote">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="detailsDialogVisible" title="预约详情" width="60%">
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
        <el-descriptions-item label="宠物品种">{{
          selectedAppointment.pet?.category?.categoryName
        }}</el-descriptions-item>
        <el-descriptions-item label="预约人">{{
          selectedAppointment.User?.username
        }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{
          formatDate(selectedAppointment.appointmentTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{
          formatDate(selectedAppointment.createdAt as string)
        }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { ApiService } from '@/services/api'
import { AppointmentStatus } from '@/types/api'
import type { Appointment, PageResult } from '@/types/api' // Updated import to PageResult
import { useUserStore } from '@/stores/user'

const appointments = ref<Appointment[]>([])
const loading = ref(false)
const activeTab = ref('申请状态')
const currentPage = ref(1)
const pageSize = ref(10)
const small = ref(false)
const disabled = ref(false)
const background = ref(true)
const totalAppointments = ref(0)
const searchKeyword = ref('')
const dateRange = ref<[Date, Date] | null>(null)
const noteDialogVisible = ref(false)
const detailsDialogVisible = ref(false)
const noteForm = ref({
  appointmentId: null as number | null,
  notes: '',
})
const selectedAppointment = ref<Appointment | null>(null)

// 状态计数
const statusCounts = computed(() => {
  const counts: Record<string, number> = {
    申请状态: 0,
    进行状态: 0,
    完成状态: 0,
    取消状态: 0,
  }
  if (Array.isArray(appointments.value)) {
    appointments.value.forEach((appointment) => {
      if (appointment && appointment.status && counts[appointment.status] !== undefined) {
        counts[appointment.status]++
      }
    })
  }
  return counts
})

onMounted(() => {
  loadAllAppointments()
})

const userStore = useUserStore()

async function loadAllAppointments() {
  try {
    loading.value = true
    if (!userStore.currentUser) {
      throw new Error('User not logged in')
    }
    const queryParams = {
      userId: userStore.currentUser.id,
      page: currentPage.value - 1, // 后端页码从0开始
      size: pageSize.value,
      status: activeTab.value, // 传入当前选中的状态
      startTime: dateRange.value?.[0]?.toISOString(),
      endTime: dateRange.value?.[1]?.toISOString(),
    }
    console.log('Loading appointments with status:', activeTab.value)
    const response = await ApiService.getAllAppointments(queryParams)
    if (response?.data?.records) {
      appointments.value = Array.isArray(response.data.records)
        ? response.data.records
        : [response.data.records]
      totalAppointments.value = response.data.total || 0
    } else {
      appointments.value = []
      totalAppointments.value = 0
      console.warn('No records found in response:', response)
    }
  } catch (error) {
    console.error('Failed to load appointments:', error)
    ElMessage.error('加载预约记录失败')
  } finally {
    loading.value = false
  }
}

function handleTabClick() {
  currentPage.value = 1 // 切换标签时重置页码
  loadAllAppointments() // 重新加载数据
}

function handleSearch() {
  currentPage.value = 1
  loadAllAppointments()
}

function handleDateRangeChange() {
  currentPage.value = 1
  loadAllAppointments()
}

// 监听分页变化
watch(
  [currentPage, pageSize],
  ([newPage, newSize], [oldPage, oldSize]) => {
    if (newPage !== oldPage || newSize !== oldSize) {
      loadAllAppointments()
    }
  },
  { immediate: false },
)

function refreshData() {
  loadAllAppointments()
}

// 直接使用API返回的数据，不再在前端进行状态过滤
const filteredAppointments = computed(() => {
  if (!searchKeyword.value) return appointments.value

  return appointments.value.filter((appointment) => {
    const keyword = searchKeyword.value.toLowerCase()
    const matchPetName = appointment.pet?.petName?.toLowerCase().includes(keyword)
    const matchUsername = appointment.User?.username.toLowerCase().includes(keyword)
    return matchPetName || matchUsername
  })
})

async function addNote(appointment: Appointment) {
  noteForm.value.appointmentId = appointment.id
  noteForm.value.notes = appointment.notes || ''
  noteDialogVisible.value = true
}

async function saveNote() {
  if (!noteForm.value.appointmentId || !noteForm.value.notes.trim()) {
    ElMessage.warning('请输入备注内容')
    return
  }

  try {
    // TODO: 后端需要添加更新备注的接口
    ElMessage.success('备注已保存')
    noteDialogVisible.value = false
    await loadAllAppointments()
  } catch (error) {
    console.error('Failed to save note:', error)
    ElMessage.error('保存备注失败')
  }
}

function viewDetails(appointment: Appointment) {
  selectedAppointment.value = appointment
  detailsDialogVisible.value = true
}

// 删除预约
async function deleteAppointment(appointmentId: number) {
  try {
    await ElMessageBox.confirm('确定要删除这个预约记录吗？此操作不可恢复', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await ApiService.deleteAppointment(appointmentId)
    ElMessage.success('预约已删除')
    loadAllAppointments() // 重新加载数据
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete appointment:', error)
      ElMessage.error('删除预约失败')
    }
  }
}

async function updateStatus(appointmentId: number, status: string) {
  const statusMessages: {
    进行状态: string
    完成状态: string
    取消状态: string
    [key: string]: string
  } = {
    进行状态: '确定要开始这个预约吗？宠物状态将变为不可预约',
    完成状态: '确定要完成这个预约吗？宠物状态将恢复为可预约',
    取消状态: '确定要取消这个预约吗？',
  }
  const actionTexts: {
    进行状态: string
    完成状态: string
    取消状态: string
    [key: string]: string
  } = {
    进行状态: '开始',
    完成状态: '完成',
    取消状态: '取消',
  }

  const confirmMessage = statusMessages[status] || '确定要执行此操作吗？'
  const actionText = actionTexts[status] || '更新'

  try {
    await ElMessageBox.confirm(confirmMessage, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await ApiService.updateAppointmentStatus(appointmentId, status)

    // 更新本地状态
    const appointment = appointments.value.find((a) => a.id === appointmentId)
    if (appointment) {
      appointment.status = status as AppointmentStatus

      // 更新宠物状态 - 使用正确的API方法
      if (appointment.pet) {
        try {
          if (status === '进行状态') {
            await ApiService.updatePet(appointment.pet.id, { status: '不可预约' })
            console.log(`已将宠物 ${appointment.pet.id} 状态更新为: 不可预约`)
          } else if (status === '完成状态' || status === '取消状态') {
            await ApiService.updatePet(appointment.pet.id, { status: '可预约' })
            console.log(`已将宠物 ${appointment.pet.id} 状态更新为: 可预约`)
          }
        } catch (error) {
          console.error('更新宠物状态失败:', error)
          ElMessage.warning('预约状态已更新，但宠物状态更新失败')
        }
      }
    }

    ElMessage.success(`预约已${actionText}`)
    loadAllAppointments() // 重新加载数据以确保状态计数正确
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`Failed to ${actionText} appointment:`, error)
      ElMessage.error(`${actionText}预约失败`)
    }
  }
}

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
  return status
}
</script>

<style scoped>
.appointment-manage-container {
  padding: 24px;
  min-height: 100%;
  animation: fadeIn 0.3s ease;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: var(--background-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  animation: slideInRight 0.5s ease;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h1::before {
  content: '';
  display: block;
  width: 4px;
  height: 24px;
  background: var(--primary-color);
  border-radius: var(--radius-sm);
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

/* 搜索和日期选择器 */
.search-input {
  width: 240px;
}

:deep(.el-input__wrapper) {
  box-shadow: none !important;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--primary-color);
}

:deep(.el-input__wrapper:focus-within) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
}

.date-picker {
  width: 320px;
}

/* 状态标签页 */
.status-tabs {
  margin-bottom: 24px;
  background: var(--background-white);
  padding: 8px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__nav) {
  border: none !important;
}

:deep(.el-tabs__item) {
  padding: 12px 24px !important;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

:deep(.el-tabs__item:hover) {
  color: var(--primary-color);
}

:deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
  font-weight: 600;
}

:deep(.el-tabs__active-bar) {
  background-color: var(--primary-color);
  height: 3px;
  border-radius: 3px;
}

.tab-badge {
  margin-top: -2px;
  margin-left: 6px;
  transform: scale(0.8);
}

/* 表格样式 */
:deep(.el-table) {
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  background: var(--background-white);
  transition: all 0.3s ease;
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

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background: rgba(99, 102, 241, 0.05);
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-weight: 500;
  border: none;
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

/* 按钮容器 */
.button-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

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

:deep(.el-button--success) {
  background: var(--success-color);
  border-color: var(--success-color);
}

:deep(.el-button--success:hover) {
  background: #0ea371;
  border-color: #0ea371;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
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

/* 分页容器 */
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

:deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 描述列表样式 */
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
  padding: 16px 24px;
}

:deep(.el-descriptions__content) {
  padding: 16px 24px;
  color: var(--text-secondary);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .appointment-manage-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 16px;
  }

  .header-actions {
    flex-direction: column;
    gap: 12px;
  }

  .search-input,
  .date-picker {
    width: 100%;
  }

  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 12px;
  }

  .button-container {
    flex-direction: column;
    width: 100%;
  }

  :deep(.el-button--small) {
    width: 100%;
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
