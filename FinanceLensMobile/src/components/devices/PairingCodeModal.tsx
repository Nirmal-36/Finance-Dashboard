import React from 'react'
import { Modal } from '../ui/Modal'
import { PairingCodePanel } from './PairingCodePanel'
import type { Device } from '../../types'

// For devices that already exist — generates a fresh pairing code on open
// so a device can be re-paired without re-registering.
export function PairingCodeModal({ device, onClose }: { device: Device | null; onClose: () => void }) {
  return (
    <Modal visible={!!device} onClose={onClose} title={device ? `Pair "${device.device_name}"` : 'Pair device'}>
      {device && <PairingCodePanel deviceId={device.id} />}
    </Modal>
  )
}
