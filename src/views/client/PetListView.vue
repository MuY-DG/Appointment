<template>
  <div class="pet-list-container">
    <h1>宠物列表</h1>

    <!-- 搜索过滤区域 -->
    <el-card class="filter-card">
      <el-form :model="searchParams" label-width="80px" @submit.prevent="handleSearch">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-form-item label="宠物名称">
              <el-input v-model="searchParams.petName" placeholder="输入宠物名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="宠物分类">
              <el-select v-model="searchParams.categoryId" placeholder="选择分类" clearable>
                <el-option
                  v-for="category in petStore.categories"
                  :key="category.id"
                  :label="category.categoryName"
                  :value="category.id"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="状态">
              <el-select v-model="searchParams.status" placeholder="选择状态" clearable>
                <el-option label="可预约" value="可预约"></el-option>
                <el-option label="不可预约" value="不可预约"></el-option>
                <el-option label="已预约" value="已预约"></el-option>
                <el-option label="配对中" value="配对中"></el-option>
                <el-option label="配对完成" value="配对完成"></el-option>
                <el-option label="已下架" value="已下架"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24" style="text-align: right">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 宠物列表 -->
    <el-row :gutter="20" class="pet-list">
      <el-col v-for="pet in petStore.pets" :key="pet.id" :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="pet-card" shadow="hover" @click="goToPetDetail(pet.id)">
          <img
            :src="pet.petImageUrl || 'https://placehold.co/300x200?text=No+Image'"
            class="pet-image"
          />
          <div class="pet-info">
            <h3>{{ pet.petName }}</h3>
            <p>{{ pet.category?.categoryName }}</p>
            <el-tag :type="getStatusType(pet.status)">
              {{ pet.status }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 加载状态 -->
    <div v-if="petStore.loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 无数据提示 -->
    <el-empty
      v-if="!petStore.loading && petStore.pets.length === 0"
      description="没有找到符合条件的宠物"
    ></el-empty>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        :total="total"
        :page-size="searchParams.size"
        :current-page="currentPage"
        :default-page-size="12"
        :default-current-page="1"
        :background="true"
        layout="prev, pager, next"
        @update:current-page="currentPage = $event"
        @update:page-size="(newSize: number) => (searchParams.size = newSize)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePetStore } from '@/stores/pet'
import type { PetSearchParams } from '@/types/api'

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

const router = useRouter()
const petStore = usePetStore()

const currentPage = ref(1)
const small = ref(true)
const disabled = ref(false)
const background = ref(true)
const searchParams = reactive<PetSearchParams>({
  petName: '',
  categoryId: undefined,
  status: undefined,
  page: 0,
  size: 12,
})

const total = computed(() => petStore.totalElements)

onMounted(async () => {
  await petStore.loadCategories()
  await loadPets()
})

async function loadPets() {
  await petStore.searchPets(searchParams)
}

function handleSearch() {
  searchParams.page = 0
  currentPage.value = 1
  loadPets()
}

function resetSearch() {
  searchParams.petName = ''
  searchParams.categoryId = undefined
  searchParams.status = undefined
  handleSearch()
}

// 监听分页变化
watch(
  [currentPage, () => searchParams.size],
  ([newPage, newSize], [oldPage, oldSize]) => {
    if (newPage !== oldPage || newSize !== oldSize) {
      searchParams.page = currentPage.value - 1
      loadPets()
    }
  },
  { immediate: false },
)

function goToPetDetail(id: number) {
  router.push(`/pets/${id}`)
}
</script>

<style scoped>
.pet-list-container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  animation: fadeIn 0.3s ease;
}

.pet-list-container h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
  position: relative;
  padding-left: 16px;
  animation: slideInRight 0.5s ease;
}

.pet-list-container h1::before {
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

/* 搜索过滤区域 */
.filter-card {
  margin-bottom: 24px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  background: var(--background-white);
  transition: all 0.3s ease;
}

.filter-card:hover {
  box-shadow: var(--shadow-md);
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
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

/* 宠物列表 */
.pet-list {
  margin: 24px -12px;
}

.pet-card {
  margin-bottom: 24px;
  cursor: pointer;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--background-white);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--border-color);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pet-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.pet-image {
  width: 100%;
  height: 240px;
  object-fit: cover;
  transition: all 0.6s ease;
}

.pet-card:hover .pet-image {
  transform: scale(1.1);
}

.pet-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pet-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.pet-info p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.875rem;
}

:deep(.el-tag) {
  border-radius: var(--radius-md);
  padding: 4px 12px;
  font-weight: 500;
  border: none;
  margin-top: auto;
  align-self: flex-start;
}

/* 加载状态 */
.loading-container {
  padding: 24px;
  background: var(--background-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

:deep(.el-skeleton) {
  --el-skeleton-circle-size: 100px;
}

/* 空状态 */
:deep(.el-empty) {
  padding: 40px 0;
}

:deep(.el-empty__description) {
  margin-top: 16px;
  color: var(--text-secondary);
}

/* 分页容器 */
.pagination-container {
  margin-top: 32px;
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

/* 响应式适配 */
@media (max-width: 768px) {
  .pet-list-container {
    padding: 16px;
  }

  .pet-list-container h1 {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }

  :deep(.el-card__body) {
    padding: 16px;
  }

  .pet-image {
    height: 200px;
  }

  .pet-info {
    padding: 12px;
  }

  .pet-info h3 {
    font-size: 1.125rem;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .pet-card:hover {
    border-color: var(--primary-color);
  }

  :deep(.el-empty__description) {
    color: var(--text-secondary);
  }

  :deep(.el-pagination button:hover) {
    background: rgba(99, 102, 241, 0.2);
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

/* 标签颜色 */
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
</style>
