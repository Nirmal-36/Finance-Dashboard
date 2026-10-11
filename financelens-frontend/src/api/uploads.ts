import axios from 'axios'
import { api, BASE_URL } from './client'
import type { Device, DeviceCaptureRequest, DeviceCaptureResponse, DeviceRegisterResponse, StatementUpload } from '../types'

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
  // Unauthenticated by design — the one-time code is the credential. Uses a
  // bare axios call so a failure never triggers the JWT refresh/redirect flow.
  pair: (code: string) =>
    axios.post<DeviceRegisterResponse>(`${BASE_URL}/devices/pair`, { code }).then((r) => r.data),
  // Device-key authenticated (what the phone's capture service would send).
  ingest: (apiKey: string, body: DeviceCaptureRequest) =>
    axios
      .post<DeviceCaptureResponse>(`${BASE_URL}/devices/ingest`, body, { headers: { 'X-Device-Key': apiKey } })
      .then((r) => r.data),
}
