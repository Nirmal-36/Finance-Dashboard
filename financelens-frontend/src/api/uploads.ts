import { api } from './client'
import type { Device, DeviceRegisterResponse, StatementUpload } from '../types'

export const uploadsApi = {
  upload: (accountId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<StatementUpload>(`/uploads?account_id=${accountId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  get: (id: string) => api.get<StatementUpload>(`/uploads/${id}`).then((r) => r.data),
  list: () => api.get<StatementUpload[]>('/uploads').then((r) => r.data),
}

export const devicesApi = {
  list: () => api.get<Device[]>('/devices').then((r) => r.data),
  register: (device_name: string) =>
    api.post<DeviceRegisterResponse>('/devices/register', { device_name }).then((r) => r.data),
  revoke: (id: string) => api.delete(`/devices/${id}`),
}
