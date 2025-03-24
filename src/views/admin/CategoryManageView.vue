<template>
  <div class="category-manage-container">
    <div class="page-header">
      <h1>分类管理</h1>
      <el-button type="primary" @click="showAddCategoryDialog">添加分类</el-button>
    </div>

    <!-- 分类列表 -->
    <el-table :data="categories" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="categoryName" label="分类名称" width="180"></el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button-group>
            <el-button size="small" type="primary" @click="editCategory(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteCategory(scope.row.id)"
              >删除</el-button
            >
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="isEditing ? '编辑分类' : '添加分类'"
      width="400px"
    >
      <el-form
        :model="categoryForm"
        label-width="80px"
        :rules="categoryFormRules"
        ref="categoryFormRef"
      >
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="categoryForm.categoryName" placeholder="请输入分类名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCategory" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { ApiService } from '@/services/api'
import type { PetCategory } from '@/types/api'
import axios from 'axios'

const categories = ref<PetCategory[]>([])
const loading = ref(false)
const submitting = ref(false)

const categoryDialogVisible = ref(false)
const isEditing = ref(false)
const categoryFormRef = ref<FormInstance>()
const categoryForm = reactive({
  id: 0,
  categoryName: '',
})

const categoryFormRules = {
  categoryName: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' },
  ],
}

onMounted(async () => {
  await loadCategories()
})

async function loadCategories() {
  try {
    loading.value = true
    const response = await ApiService.getAllCategories()
    categories.value = response.data
  } catch (error) {
    console.error('Failed to load categories:', error)
    ElMessage.error('加载分类列表失败')
  } finally {
    loading.value = false
  }
}

function showAddCategoryDialog() {
  isEditing.value = false
  resetCategoryForm()
  categoryDialogVisible.value = true
}

function editCategory(category: PetCategory) {
  isEditing.value = true
  Object.assign(categoryForm, {
    id: category.id,
    categoryName: category.categoryName,
  })
  categoryDialogVisible.value = true
}

async function deleteCategory(id: number) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个分类吗？删除分类可能会影响相关宠物的分类显示。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    loading.value = true
    await ApiService.deleteCategory(id)
    ElMessage.success('分类已成功删除')
    await loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete category:', error)

      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || '删除分类失败'
        ElMessage.error(errorMessage)
      } else {
        ElMessage.error('删除分类失败，请稍后重试')
      }
    }
  } finally {
    loading.value = false
  }
}

function resetCategoryForm() {
  categoryForm.id = 0
  categoryForm.categoryName = ''
}

async function submitCategory() {
  if (!categoryFormRef.value) return

  try {
    await categoryFormRef.value.validate()
    submitting.value = true

    if (isEditing.value) {
      await ApiService.updateCategory(categoryForm.id, categoryForm)
      ElMessage.success('分类信息已更新')
    } else {
      await ApiService.addCategory(categoryForm)
      ElMessage.success('分类已添加')
    }

    categoryDialogVisible.value = false
    await loadCategories()
  } catch (error) {
    console.error('Failed to submit category:', error)

    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data?.message || '提交分类信息失败'
      ElMessage.error(errorMessage)
    } else {
      ElMessage.error('提交分类信息失败，请稍后重试')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.category-manage-container {
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

/* 响应式适配 */
@media (max-width: 768px) {
  .category-manage-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 16px;
  }

  :deep(.el-button--small) {
    width: 100%;
  }

  :deep(.el-button-group) {
    flex-direction: column;
    width: 100%;
  }

  :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto;
  }

  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 12px;
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
