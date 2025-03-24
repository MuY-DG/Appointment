<template>
  <div class="pet-manage-container">
    <div class="page-header">
      <h1>宠物管理</h1>
      <el-button type="primary" @click="showAddPetDialog">添加宠物</el-button>
    </div>

    <!-- 宠物列表 -->
    <el-table :data="pets" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="petName" label="名称" width="120"></el-table-column>
      <el-table-column label="图片" width="100">
        <template #default="scope">
          <el-image
            style="width: 50px; height: 50px"
            :src="scope.row.petImageUrl || 'https://via.placeholder.com/50'"
            :preview-src-list="[scope.row.petImageUrl]"
            fit="cover"
          ></el-image>
        </template>
      </el-table-column>
      <el-table-column prop="category.categoryName" label="分类" width="120"></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button-group>
            <el-button size="small" type="primary" @click="editPet(scope.row)">编辑</el-button>
            <el-button
              size="small"
              :type="scope.row.status === '可预约' ? 'warning' : 'success'"
              @click="togglePetStatus(scope.row)"
            >
              {{ scope.row.status === '可预约' ? '设为不可预约' : '设为可预约' }}
            </el-button>
            <el-button size="small" type="danger" @click="deletePet(scope.row.id)">删除</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :background="true"
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50]"
      />
    </div>

    <!-- 添加/编辑宠物对话框 -->
    <el-dialog
      v-model="petDialogVisible"
      :title="isEditing ? '编辑宠物' : '添加宠物'"
      width="500px"
    >
      <el-form :model="petForm" label-width="80px" :rules="petFormRules" ref="petFormRef">
        <el-form-item label="名称" prop="petName">
          <el-input v-model="petForm.petName"></el-input>
        </el-form-item>
        <el-form-item label="宠物图片" prop="petImageUrl">
          <el-upload
            class="pet-image-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            accept="image/*"
          >
            <img v-if="imageUrl" :src="imageUrl" class="uploaded-image" />
            <el-icon v-else class="upload-icon"><Plus /></el-icon>
            <div class="upload-text">{{ imageUrl ? '点击更换图片' : '点击上传图片' }}</div>
          </el-upload>
          <div v-if="uploadLoading" class="upload-loading">
            <el-progress :percentage="uploadProgress" :stroke-width="5" />
            <span>上传中...</span>
          </div>
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="petForm.categoryId" placeholder="选择分类">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.categoryName"
              :value="category.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="petForm.status" placeholder="选择状态">
            <el-option label="可预约" value="可预约"></el-option>
            <el-option label="不可预约" value="不可预约"></el-option>
            <el-option label="已预约" value="已预约"></el-option>
            <el-option label="配对中" value="配对中"></el-option>
            <el-option label="配对完成" value="配对完成"></el-option>
            <el-option label="已下架" value="已下架"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="petDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPet" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, UploadFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { ApiService } from '@/services/api'
import type { Pet, PetCategory, PetPageResponse } from '@/types/api'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const userStore = useUserStore()

const pets = ref<Pet[]>([])
const categories = ref<PetCategory[]>([])
const loading = ref(false)
const submitting = ref(false)
const uploadLoading = ref(false)
const uploadProgress = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const small = ref(false)
const disabled = ref(false)
const background = ref(true)
const total = ref(0)
const imageUrl = ref('')
const imageFile = ref<File | null>(null)

const petDialogVisible = ref(false)
const isEditing = ref(false)
const petFormRef = ref<FormInstance>()
const petForm = reactive({
  id: 0,
  petName: '',
  petImageUrl: '',
  categoryId: 0,
  ownerId: 0,
  status: 'AVAILABLE',
})

const petFormRules = {
  petName: [{ required: true, message: '请输入宠物名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择宠物分类', trigger: 'change' }],
  status: [{ required: true, message: '请选择宠物状态', trigger: 'change' }],
}

onMounted(async () => {
  await loadCategories()
  await loadPets()
})

async function loadCategories() {
  try {
    const response = await ApiService.getAllCategories()
    categories.value = response.data
  } catch (error) {
    console.error('Failed to load categories:', error)
    ElMessage.error('加载宠物分类失败')
  }
}

async function loadPets() {
  try {
    loading.value = true
    const response = await ApiService.searchPets({
      page: currentPage.value - 1,
      size: pageSize.value,
    })
    // 直接使用response.data中的content作为宠物列表
    pets.value = response.data.content
    // 使用totalElements作为总数
    total.value = response.data.totalElements
  } catch (error) {
    console.error('Failed to load pets:', error)
    ElMessage.error('加载宠物列表失败')
  } finally {
    loading.value = false
  }
}

// 监听分页变化
watch(
  [currentPage, pageSize],
  ([newPage, newSize], [oldPage, oldSize]) => {
    if (newPage !== oldPage || newSize !== oldSize) {
      loadPets()
    }
  },
  { immediate: false },
)

function showAddPetDialog() {
  isEditing.value = false
  resetPetForm()
  petDialogVisible.value = true
}

function editPet(pet: Pet) {
  isEditing.value = true
  Object.assign(petForm, {
    id: pet.id,
    petName: pet.petName,
    petImageUrl: pet.petImageUrl,
    categoryId: pet.categoryId,
    ownerId: pet.ownerId,
    status: pet.status,
  })
  imageUrl.value = pet.petImageUrl || ''
  petDialogVisible.value = true
}

async function togglePetStatus(pet: Pet) {
  try {
    const newStatus = pet.status === '可预约' ? '不可预约' : '可预约'
    await ApiService.updatePetStatus(pet.id, newStatus)
    ElMessage.success('宠物状态已更新')
    pet.status = newStatus
  } catch (error) {
    console.error('Failed to update pet status:', error)
    ElMessage.error('更新宠物状态失败')
  }
}

async function deletePet(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这个宠物吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    loading.value = true
    // 调用接口并获取完整响应
    const response = await ApiService.deletePet(id)

    // 手动检查业务状态码
    if (response.code !== 200) {
      throw new Error(response.message) // 抛出业务错误消息
    }

    ElMessage.success('宠物已成功删除')
    await loadPets()
  } catch (error) {
    if (error === 'cancel') return
    // 统一处理错误消息（包括 HTTP 错误和业务错误）
    // const message = error.message || '删除失败，请重试'
    const message = (error as Error)?.message || '删除失败，请重试'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

function resetPetForm() {
  petForm.id = 0
  petForm.petName = ''
  petForm.petImageUrl = ''
  petForm.categoryId = 0
  petForm.ownerId = userStore.currentUser?.id || 0
  petForm.status = '可预约'
  imageUrl.value = ''
  imageFile.value = null
}

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

// 处理图片选择
function handleImageChange(file: UploadFile) {
  if (!file.raw) {
    ElMessage.error('文件上传失败')
    return
  }

  // 检查文件类型
  if (!/^image\/(jpeg|png|gif|jpg)$/.test(file.raw.type)) {
    ElMessage.error('只能上传图片文件!')
    return
  }

  // 检查文件大小（限制为2MB）
  if (file.raw.size / 1024 / 1024 > 2) {
    ElMessage.error('图片大小不能超过2MB!')
    return
  }

  // 预览图片
  imageFile.value = file.raw
  imageUrl.value = URL.createObjectURL(file.raw)
}

// 上传图片
async function uploadImage(): Promise<string> {
  if (!imageFile.value) {
    // 如果没有选择新图片但有现有图片URL，则直接返回现有URL
    if (imageUrl.value && imageUrl.value === petForm.petImageUrl) {
      return petForm.petImageUrl
    }
    throw new Error('请选择图片')
  }

  uploadLoading.value = true
  uploadProgress.value = 0

  try {
    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)

    const response = await ApiService.uploadFile(imageFile.value)
    clearInterval(progressInterval)
    uploadProgress.value = 100

    return response.data.url
  } finally {
    uploadLoading.value = false
  }
}

async function submitPet() {
  if (!petFormRef.value) return

  try {
    await petFormRef.value.validate()
    submitting.value = true

    // 先上传图片（如果有新图片）
    if (imageFile.value) {
      const imageUrl = await uploadImage()
      petForm.petImageUrl = imageUrl
    }

    if (isEditing.value) {
      await ApiService.updatePet(petForm.id, petForm)
      ElMessage.success('宠物信息已更新')
    } else {
      await ApiService.addPet(petForm)
      ElMessage.success('宠物已添加')
    }

    petDialogVisible.value = false
    await loadPets()
  } catch (error) {
    console.error('Failed to submit pet:', error)
    ElMessage.error(error instanceof Error ? error.message : '提交宠物信息失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.pet-manage-container {
  padding: 24px;
  min-height: 100%;
  animation: fadeIn 0.3s ease;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 24px;
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

/* 表格样式优化 */
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
}

:deep(.el-table td) {
  color: var(--text-secondary);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background: rgba(99, 102, 241, 0.05);
}

/* 图片单元格样式 */
:deep(.el-image) {
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

:deep(.el-image:hover) {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

/* 按钮组样式 */
:deep(.el-button-group) {
  display: flex;
  gap: 8px;
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

/* 上传组件样式 */
.pet-image-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 200px;
  height: 200px;
  transition: all 0.3s ease;
  background: var(--background-light);
}

.pet-image-uploader:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.upload-icon {
  font-size: 32px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.pet-image-uploader:hover .upload-icon {
  color: var(--primary-color);
  transform: scale(1.1);
}

.upload-text {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 8px;
  transition: all 0.3s ease;
}

.pet-image-uploader:hover .upload-text {
  color: var(--primary-color);
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.uploaded-image:hover {
  transform: scale(1.05);
}

.upload-loading {
  margin-top: 16px;
  width: 200px;
}

/* 对话框样式优化 */
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
:deep(.el-select__wrapper) {
  box-shadow: none !important;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover),
:deep(.el-select__wrapper:hover) {
  border-color: var(--primary-color);
}

:deep(.el-input__wrapper:focus-within),
:deep(.el-select__wrapper:focus-within) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: var(--radius-md);
  padding: 4px 12px;
  font-weight: 500;
  border: none;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .pet-manage-container {
    padding: 16px;
  }

  .page-header {
    padding: 12px 16px;
    margin-bottom: 16px;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  :deep(.el-button-group) {
    flex-wrap: wrap;
  }

  :deep(.el-button--small) {
    padding: 6px 12px;
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

  .pet-image-uploader {
    background: var(--background-white);
  }

  :deep(.el-dialog__header) {
    background: var(--background-white);
  }
}
</style>
