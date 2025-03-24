import axios from 'axios'
import type {
  ApiResponse,
  User,
  Pet,
  PetCategory,
  Appointment,
  PetSearchParams,
  PetPageResponse,
  AppointmentPageResponse,
} from '@/types/api'

const api = axios.create({
  baseURL: 'http://154.19.185.89:8080/api', // 替换为你的API地址
})

export class ApiService {
  // 文件上传
  static async uploadFile(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
  // 用户相关
  static async getUser(id: number): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`)
    return response.data
  }

  static async getAllUsers(): Promise<ApiResponse<User[]>> {
    const response = await api.get('/users')
    return response.data
  }

  // 登录或注册
  static async loginOrRegister(username: string): Promise<ApiResponse<User>> {
    const response = await api.post('/users/login', null, {
      params: { username },
    })
    return response.data
  }

  // 宠物相关
  static async searchPets(params: PetSearchParams): Promise<ApiResponse<PetPageResponse<Pet>>> {
    const response = await api.get('/pets/search', { params })
    return response.data
  }

  static async getPet(id: number): Promise<ApiResponse<Pet>> {
    const response = await api.get(`/pets/${id}`)
    return response.data
  }

  static async addPet(pet: Partial<Pet>): Promise<ApiResponse<Pet>> {
    const response = await api.post('/pets', pet)
    return response.data
  }

  static async updatePet(id: number, pet: Partial<Pet>): Promise<ApiResponse<Pet>> {
    const response = await api.put(`/pets/${id}`, pet)
    return response.data
  }

  static async updatePetStatus(id: number, status: string): Promise<ApiResponse<void>> {
    const response = await api.put(`/pets/${id}`, { status })
    return response.data
  }

  static async deletePet(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`/pets/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error deleting pet with id ${id}:`, error)
      throw error
    }
  }

  // 宠物分类相关
  static async getAllCategories(): Promise<ApiResponse<PetCategory[]>> {
    const response = await api.get('/categories')
    return response.data
  }

  static async getCategoryById(id: number): Promise<ApiResponse<PetCategory>> {
    const response = await api.get(`/categories/${id}`)
    return response.data
  }

  static async addCategory(category: Partial<PetCategory>): Promise<ApiResponse<PetCategory>> {
    const response = await api.post('/categories', category)
    return response.data
  }

  static async updateCategory(
    id: number,
    category: Partial<PetCategory>,
  ): Promise<ApiResponse<PetCategory>> {
    const response = await api.put(`/categories/${id}`, category)
    return response.data
  }

  static async deleteCategory(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  }

  // 预约相关
  static async createAppointment(
    appointment: Partial<Appointment>,
  ): Promise<ApiResponse<Appointment>> {
    const response = await api.post('/appointments', appointment)
    return response.data
  }

  static async getAppointmentById(id: number): Promise<ApiResponse<Appointment>> {
    const response = await api.get(`/appointments/${id}`)
    return response.data
  }

  static async getAppointmentsByPetId(petId: number): Promise<ApiResponse<Appointment[]>> {
    const response = await api.get(`/appointments/pet/${petId}`)
    return response.data
  }

  static async getAppointmentsByStatus(status: string): Promise<ApiResponse<Appointment[]>> {
    const response = await api.get(`/appointments/status/${status}`)
    return response.data
  }

  static async updateAppointmentStatus(id: number, status: string): Promise<ApiResponse<void>> {
    const response = await api.put(`/appointments/${id}/status?status=${status}`)
    return response.data
  }

  // 删除预约
  static async deleteAppointment(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/appointments/${id}`)
    return response.data
  }

  static async getAllAppointments(params: {
    userId: number
    requesterId?: number
    petId?: number
    status?: string
    startTime?: string
    endTime?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<AppointmentPageResponse<Appointment>>> {
    const response = await api.get('/appointments/admin/all', { params })
    return response.data
  }

  static async getUserAppointments(params: {
    userId: number
    petId?: number
    status?: string
    startTime?: string
    endTime?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<AppointmentPageResponse<Appointment>>> {
    const response = await api.get('/appointments/user/my', { params })
    return response.data
  }
}
