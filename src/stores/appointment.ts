// src/stores/appointment.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Appointment } from '@/types/api'
import { ApiService } from '@/services/api'
import { AppointmentStatus } from '@/types/api'

export const useAppointmentStore = defineStore('appointment', () => {
  const appointments = ref<Appointment[]>([])
  const loading = ref(false)

  async function loadAppointments(userId: number) {
    try {
      loading.value = true
      const response = await ApiService.getAppointmentsByPetId(userId)
      appointments.value = response.data
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      loading.value = false
    }
  }

  async function createAppointment(appointment: Partial<Appointment>) {
    try {
      const response = await ApiService.createAppointment(appointment)
      appointments.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to create appointment:', error)
      throw error
    }
  }

  async function updateAppointmentStatus(appointmentId: number, status: AppointmentStatus) {
    try {
      await ApiService.updateAppointmentStatus(appointmentId, status)
      // 更新本地状态
      const appointment = appointments.value?.find((a) => a.id === appointmentId)
      if (appointment) {
        appointment.status = status
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error)
      throw error
    }
  }

  return {
    appointments,
    loading,
    loadAppointments,
    createAppointment,
    updateAppointmentStatus,
  }
})
