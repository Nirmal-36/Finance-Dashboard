import { NativeModules, Platform } from 'react-native'

export interface CaptureStatus {
  configured: boolean
  /** Whether the user has granted Notification access to this app. */
  listenerEnabled: boolean
  accountId: string | null
  capturedCount: number
  pendingCount: number
  /** Epoch millis, 0 if nothing captured yet. */
  lastCaptureAt: number
  lastError: string | null
}

interface CaptureNative {
  configure(baseUrl: string, apiKey: string, accountId: string): Promise<void>
  disconnect(): Promise<void>
  getStatus(): Promise<CaptureStatus>
  openListenerSettings(): void
  sendTestPayment(): Promise<string>
}

// Capture is Android-only (NotificationListenerService); on other platforms
// every call is a harmless no-op so shared screens don't need to branch.
const native: CaptureNative | undefined =
  Platform.OS === 'android' ? (NativeModules.FinanceLensCapture as CaptureNative | undefined) : undefined

export const captureSupported = !!native

export const capture = {
  configure: (baseUrl: string, apiKey: string, accountId: string) => native?.configure(baseUrl, apiKey, accountId) ?? Promise.resolve(),
  disconnect: () => native?.disconnect() ?? Promise.resolve(),
  getStatus: (): Promise<CaptureStatus | null> => native?.getStatus() ?? Promise.resolve(null),
  openListenerSettings: () => native?.openListenerSettings(),
  sendTestPayment: (): Promise<string> => native?.sendTestPayment() ?? Promise.reject(new Error('Not supported on this platform')),
}
