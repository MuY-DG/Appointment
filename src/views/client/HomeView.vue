<template>
  <div class="home-container">
    <!-- 全屏轮播区域 -->
    <el-row class="carousel-section">
      <el-col :span="24">
        <el-carousel :height="isMobile ? '60vh' : '80vh'" indicator-position="outside">
          <el-carousel-item v-for="(item, index) in carouselItems" :key="index">
            <div class="carousel-content" :style="{ backgroundImage: `url(${item.imageUrl})` }">
              <div class="carousel-caption">
                <h2 class="animate__animated animate__fadeInDown">{{ item.title }}</h2>
                <p class="animate__animated animate__fadeInUp">{{ item.description }}</p>
                <el-button 
                  type="primary" 
                  class="glow-button animate__animated animate__fadeInUp"
                  @click="navigateToPets">
                  立即预约
                </el-button>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </el-col>
    </el-row>

    <!-- 预约步骤区域 -->
    <div class="section steps-section">
      <h2 class="section-title">如何预约宠物</h2>
      <div class="steps-container">
        <el-row :gutter="30">
          <el-col :xs="24" :sm="24" :md="8">
            <div class="step-card">
              <div class="step-icon">
                <el-icon class="search-icon"><el-icon-search /></el-icon>
              </div>
              <h3>步骤 1: 浏览宠物</h3>
              <p>浏览我们的宠物列表，查看详细信息和照片，找到您喜欢的宠物。</p>
            </div>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8">
            <div class="step-card">
              <div class="step-icon">
                <el-icon class="calendar-icon"><el-icon-calendar /></el-icon>
              </div>
              <h3>步骤 2: 提交预约</h3>
              <p>登录后选择您喜欢的宠物，提交预约申请，选择合适的时间。</p>
            </div>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8">
            <div class="step-card">
              <div class="step-icon">
                <el-icon class="check-icon"><el-icon-check /></el-icon>
              </div>
              <h3>步骤 3: 等待确认</h3>
              <p>等待管理员确认您的预约，确认后您将收到通知，即可开始您的宠物互动体验。</p>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 热门宠物区域 -->
    <div class="section pets-section">
      <h2 class="section-title">热门宠物</h2>
      <div class="pets-grid">
        <el-row :gutter="30">
          <el-col v-for="pet in featuredPets" 
                 :key="pet.id" 
                 :xs="24" 
                 :sm="12" 
                 :md="8" 
                 :lg="6">
            <div class="pet-card" @click="goToPetDetail(pet.id)">
              <div class="pet-image-wrapper">
                <img
                  :src="pet.petImageUrl || 'https://via.placeholder.com/300x200?text=No+Image'"
                  class="pet-image"
                  alt="宠物图片"
                />
                <div class="pet-overlay">
                  <el-button type="primary" round>查看详情</el-button>
                </div>
              </div>
              <div class="pet-info">
                <h3>{{ pet.petName }}</h3>
                <p>{{ pet.category?.categoryName }}</p>
                <el-tag :type="pet.status === 'AVAILABLE' ? 'success' : 'info'" class="status-tag">
                  {{ pet.status === 'AVAILABLE' ? '可预约' : '不可预约' }}
                </el-tag>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      <div class="view-more">
        <el-button type="primary" class="glow-button" @click="navigateToPets">
          查看更多宠物
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePetStore } from '@/stores/pet'
import type { Pet } from '@/types/api'
// import 'animate.css'

const router = useRouter()
const petStore = usePetStore()
const featuredPets = ref<Pet[]>([])
const isMobile = ref(window.innerWidth <= 768)

const carouselItems = [
  {
    title: '宠物预约系统',
    description: '寻找您心仪的宠物，开始一段美好的互动体验',
    imageUrl:
      'https://images.unsplash.com/photo-1548767797-d8c844163c4c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80',
  },
  {
    title: '多种宠物可选',
    description: '猫咪、狗狗、兔子等多种宠物等您来预约',
    imageUrl:
      'https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1450&q=80',
  },
  {
    title: '专业宠物护理',
    description: '我们的团队将为您提供最专业的宠物护理服务',
    imageUrl:
      'https://images.unsplash.com/photo-1560743641-3914f2c45636?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
  },
]

onMounted(async () => {
  try {
    await petStore.loadCategories()
    await petStore.searchPets({ status: 'AVAILABLE', page: 0, size: 4 })
    featuredPets.value = petStore.pets
  } catch (error) {
    console.error('Failed to load featured pets:', error)
  }

  window.addEventListener('resize', handleResize)
})

function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

function navigateToPets() {
  router.push('/pets')
}

function goToPetDetail(id: number) {
  router.push(`/pets/${id}`)
}
</script>

<style scoped>
/* 全局样式 */
.home-container {
  width: 100%;
  min-height: 100vh;
  background: var(--background-light);
}

/* 轮播区域样式 */
.carousel-section {
  margin-bottom: 4rem;
  position: relative;
  overflow: hidden;
}

.carousel-content {
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.carousel-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(99, 102, 241, 0.9) 0%, 
    rgba(99, 102, 241, 0.7) 30%, 
    rgba(99, 102, 241, 0.3) 60%, 
    rgba(99, 102, 241, 0) 100%);
}

.carousel-caption {
  position: relative;
  color: white;
  padding: 3rem 6rem;
  max-width: 700px;
  z-index: 2;
  opacity: 0;
  transform: translateX(-20px);
  animation: slideInRight 0.8s ease forwards;
}

.carousel-caption h2 {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  line-height: 1.2;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.carousel-caption p {
  font-size: 1.25rem;
  margin-bottom: 2.5rem;
  line-height: 1.8;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
  opacity: 0.9;
}

/* 通用部分样式 */
.section {
  padding: 6rem 8%;
}

.section-title {
  text-align: center;
  font-size: 2.75rem;
  font-weight: 800;
  margin-bottom: 4rem;
  color: var(--text-primary);
  position: relative;
  opacity: 0;
  transform: translateY(20px);
  animation: slideUp 0.6s ease forwards;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 2px;
}

/* 步骤区域样式 */
.steps-section {
  background: var(--background-white);
  position: relative;
  overflow: hidden;
}

.steps-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    var(--border-color) 20%, 
    var(--border-color) 80%, 
    transparent 100%);
}

.steps-container {
  margin-top: 2rem;
}

.step-card {
  padding: 2.5rem;
  text-align: center;
  background: var(--background-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: var(--transition-base);
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
  opacity: 0;
  transform: translateY(20px);
  animation: slideUp 0.6s ease forwards;
}

.step-card:hover {
  transform: translateY(-10px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.step-icon {
  width: 90px;
  height: 90px;
  margin: 0 auto 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  background: var(--background-light);
  transition: var(--transition-base);
  border: 2px solid var(--border-color);
}

.step-card:hover .step-icon {
  transform: scale(1.1) rotate(5deg);
  border-color: var(--primary-color);
}

.search-icon {
  color: var(--primary-color);
}

.calendar-icon {
  color: var(--secondary-color);
}

.check-icon {
  color: var(--success-color);
}

.step-card h3 {
  font-size: 1.75rem;
  margin-bottom: 1.25rem;
  color: var(--text-primary);
  font-weight: 700;
}

.step-card p {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 1.1rem;
}

/* 宠物卡片区域样式 */
.pets-section {
  background: var(--background-light);
  position: relative;
}

.pets-grid {
  margin-bottom: 4rem;
}

.pet-card {
  background: var(--background-white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: var(--transition-base);
  margin-bottom: 2rem;
  cursor: pointer;
  border: 1px solid var(--border-color);
  opacity: 0;
  transform: translateY(20px);
  animation: slideUp 0.6s ease forwards;
}

.pet-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.pet-image-wrapper {
  position: relative;
  overflow: hidden;
  padding-top: 66.67%; /* 3:2 aspect ratio */
}

.pet-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.pet-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top,
    rgba(99, 102, 241, 0.8),
    rgba(99, 102, 241, 0.4));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition-base);
}

.pet-card:hover .pet-image {
  transform: scale(1.1) rotate(2deg);
}

.pet-card:hover .pet-overlay {
  opacity: 1;
}

.pet-info {
  padding: 2rem;
}

.pet-info h3 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  font-weight: 700;
}

.pet-info p {
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
  font-size: 1.1rem;
}

.status-tag {
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
}

/* 按钮样式 */
.glow-button {
  background: linear-gradient(45deg, var(--primary-color), var(--primary-hover));
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 1px;
  transition: var(--transition-base);
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.glow-button::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: rgba(255,255,255,0.1);
  transform: rotate(45deg);
  transition: var(--transition-base);
}

.glow-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4);
}

.glow-button:hover::before {
  transform: rotate(45deg) translate(50%, 50%);
}

.view-more {
  text-align: center;
  margin-top: 4rem;
  opacity: 0;
  transform: translateY(20px);
  animation: slideUp 0.6s ease forwards 0.3s;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .carousel-caption {
    padding: 2rem 3rem;
    max-width: 100%;
  }

  .carousel-caption h2 {
    font-size: 2.5rem;
  }

  .carousel-caption p {
    font-size: 1.1rem;
  }

  .section {
    padding: 4rem 5%;
  }

  .section-title {
    font-size: 2.25rem;
  }

  .step-card {
    padding: 2rem;
  }

  .pet-info h3 {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .carousel-caption {
    padding: 1.5rem 2rem;
  }

  .carousel-caption h2 {
    font-size: 2rem;
  }

  .section {
    padding: 3rem 3%;
  }

  .section-title {
    font-size: 2rem;
  }

  .step-icon {
    width: 70px;
    height: 70px;
    font-size: 2rem;
  }

  .step-card h3 {
    font-size: 1.5rem;
  }

  .glow-button {
    padding: 0.875rem 2rem;
    font-size: 1.1rem;
  }
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .carousel-caption h2 {
    background: linear-gradient(45deg, #fff, #d1d5db);
    -webkit-background-clip: text;
    background-clip: text;
  }

  .step-card:hover,
  .pet-card:hover {
    border-color: var(--primary-color);
  }

  .pet-overlay {
    background: linear-gradient(to top,
      rgba(99, 102, 241, 0.9),
      rgba(99, 102, 241, 0.6));
  }
}
</style>