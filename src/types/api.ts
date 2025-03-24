// src/types/api.ts
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 用户相关类型
export interface User {
  id: number
  username: string
  role: string
  createdAt: string
  updatedAt: string
}

// 宠物分类
export interface PetCategory {
  id: number
  categoryName: string
}

// 宠物信息
export interface Pet {
  id: number
  petName: string
  petImageUrl: string
  categoryId: number
  ownerId: number
  status: string
  createdAt: string
  updatedAt: string
  category?: {
    id: number
    categoryName: string
  }
  owner?: {
    id: number
    username: string
  }
}

export interface Appointment {
  id: number
  requesterId: number
  petId: number
  status: AppointmentStatus
  appointmentTime: string
  confirmedStartTime?: string
  completedTime?: string
  createdAt: string
  updatedAt: string
  notes?: string
  User?: User
  pet?: Pet
}
// 分页参数
export interface PageParams {
  page?: number
  size?: number
}

// 分页响应 - 宠物列表响应格式
export interface PetPageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

// 预约列表响应格式
export interface AppointmentPageResponse<T> {
  records: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

// 宠物搜索参数
export interface PetSearchParams extends PageParams {
  petName?: string
  categoryId?: number
  ownerId?: number
  status?: string
}

export enum AppointmentStatus {
  REQUESTED = '申请状态',
  CONFIRMED = '进行状态',
  COMPLETED = '完成状态',
  CANCELLED = '取消状态',
}

// 宠物状态枚举
export enum PetStatus {
  AVAILABLE = '可预约',
  UNAVAILABLE = '不可预约',
  RESERVED = '已预约',
  MATCHING = '配对中',
  MATCHED = '配对完成',
  DELISTED = '已下架',
}
