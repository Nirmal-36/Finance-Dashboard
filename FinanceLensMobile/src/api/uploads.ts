import axios from 'axios'
import { api, BASE_URL } from './client'
import type { Device, DeviceRegisterResponse, PairingCodeResponse, StatementUpload } from '../types'

// Shape of a file picked via react-native-document-picker — uri/name/type
// instead of a browser File object.
export interface PickedFile {
  uri: string
  name: string
  type: string
}

export const uploadsApi = {
  upload: (accountId: string, file: PickedFile) => {
    const form = new FormData()
    // React Native's FormData accepts {uri, name, type} directly — this
    // is RN's documented way of attaching a file picked from device
    // storage, unlike web where a real File/Blob object is appended.
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type || 'application/pdf',
    } as unknown as Blob)

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
  // Unauthenticated — the one-time code is the credential. Bare axios so a bad
  // code never triggers the JWT refresh/logout flow.
  pair: (code: string) =>
    axios.post<DeviceRegisterResponse>(`${BASE_URL}/devices/pair`, { code }).then((r) => r.data),
  createPairingCode: (id: string) =>
    api.post<PairingCodeResponse>(`/devices/${id}/pairing-code`).then((r) => r.data),
}
