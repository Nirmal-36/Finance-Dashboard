import { api } from './client'
import type { SeedDemoDataResponse } from '../types'

export const devApi = {
  seedDemoData: (data: { months: number; account_id?: string }) =>
    api.post<SeedDemoDataResponse>('/dev/seed-demo-data', data).then((r) => r.data),
}
