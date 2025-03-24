import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Pet, PetCategory, PetSearchParams } from '@/types/api'
import { ApiService } from '@/services/api'

export const usePetStore = defineStore('pet', () => {
  const pets = ref<Pet[]>([])
  const categories = ref<PetCategory[]>([])
  const loading = ref(false)
  const totalPages = ref(0)
  const totalElements = ref(0) // 新增totalElements
  async function loadCategories() {
    try {
      const response = await ApiService.getAllCategories()
      categories.value = response.data
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  async function searchPets(params: PetSearchParams) {
    try {
      loading.value = true
      const response = await ApiService.searchPets(params)
      pets.value = response.data.content as Pet[]
      totalElements.value = response.data.totalElements // 使用正确字段
    } catch (error) {
      pets.value = []
      totalElements.value = 0
    } finally {
      loading.value = false
    }
  }

  async function updatePetStatus(petId: number, status: string) {
    try {
      await ApiService.updatePetStatus(petId, status)
      // 更新本地状态
      const pet = pets.value.find((p) => p.id === petId)
      if (pet) {
        pet.status = status
      }
      return true // 指示更新成功
    } catch (error) {
      console.error('Failed to update pet status:', error)
      return false // 指示更新失败
    }
  }

  return {
    pets,
    categories,
    loading,
    totalPages,
    totalElements,
    loadCategories,
    searchPets,
    updatePetStatus,
  }
})
