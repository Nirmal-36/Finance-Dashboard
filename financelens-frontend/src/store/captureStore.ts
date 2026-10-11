import { create } from 'zustand'
import { devicesApi } from '../api/uploads'
import { getErrorMessage } from '../api/client'
import { burstTimestamps, makeTransaction } from '../lib/captureSimulator'
import { formatCurrency } from '../lib/format'
import type { DeviceRegisterResponse } from '../types'

// Holds the paired device and the simulated capture run outside any page
// component, so a live feed keeps going while you browse other pages — and
// pages can refetch as new transactions land (see `dataVersion`).
//
// The device key lives in memory only: refreshing the tab disconnects.

type Mode = 'idle' | 'burst' | 'live'

interface CaptureState {
  device: DeviceRegisterResponse | null
  mode: Mode
  counts: { ok: number; duplicate: number; error: number }
  log: string[]
  error: string
  /** Bumped (throttled) whenever new transactions were ingested; pages refetch on change. */
  dataVersion: number
  connect: (device: DeviceRegisterResponse) => void
  disconnect: () => void
  start: (mode: 'burst' | 'live', accountId: string, burstSize: number) => void
  stop: () => void
}

let runId = 0
let bumpTimer: ReturnType<typeof setTimeout> | undefined
const BUMP_INTERVAL_MS = 1500

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const useCaptureStore = create<CaptureState>((set, get) => {
  function scheduleBump() {
    if (bumpTimer) return
    bumpTimer = setTimeout(() => {
      bumpTimer = undefined
      set((s) => ({ dataVersion: s.dataVersion + 1 }))
    }, BUMP_INTERVAL_MS)
  }

  async function send(accountId: string, when: Date): Promise<boolean> {
    const device = get().device
    if (!device) return false
    const txn = makeTransaction(accountId, when)
    const label = `${txn.type === 'debit' ? '−' : '+'}${formatCurrency(txn.amount)}  ${txn.merchant_raw}`
    try {
      const res = await devicesApi.ingest(device.api_key, txn)
      set((s) => ({
        counts: res.duplicate
          ? { ...s.counts, duplicate: s.counts.duplicate + 1 }
          : { ...s.counts, ok: s.counts.ok + 1 },
        log: [`${label}${res.duplicate ? '  (duplicate)' : ''}`, ...s.log].slice(0, 8),
      }))
      if (!res.duplicate) scheduleBump()
      return true
    } catch (err) {
      set((s) => ({ counts: { ...s.counts, error: s.counts.error + 1 }, error: getErrorMessage(err) }))
      return false
    }
  }

  return {
    device: null,
    mode: 'idle',
    counts: { ok: 0, duplicate: 0, error: 0 },
    log: [],
    error: '',
    dataVersion: 0,

    connect: (device) => set({ device, mode: 'idle', counts: { ok: 0, duplicate: 0, error: 0 }, log: [], error: '' }),

    disconnect: () => {
      runId++
      set({ device: null, mode: 'idle' })
    },

    stop: () => {
      runId++
      set((s) => ({ mode: 'idle', dataVersion: s.dataVersion + 1 }))
    },

    start: (mode, accountId, burstSize) => {
      const id = ++runId
      set({ mode, counts: { ok: 0, duplicate: 0, error: 0 }, log: [], error: '' })
      void (async () => {
        if (mode === 'burst') {
          for (const ts of burstTimestamps(burstSize)) {
            if (id !== runId) return
            if (!(await send(accountId, ts))) break // stop on first failure (e.g. revoked key)
          }
        } else {
          while (id === runId) {
            if (!(await send(accountId, new Date()))) break
            await sleep(4000 + Math.random() * 6000)
          }
        }
        if (id === runId) set((s) => ({ mode: 'idle', dataVersion: s.dataVersion + 1 }))
      })()
    },
  }
})
