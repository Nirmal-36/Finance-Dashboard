import type { DeviceCaptureRequest } from '../types'

// Generates PhonePe/GPay-style transactions for demoing device capture
// without a real phone. Mirrors the backend's simulate_capture.py.

// [name, weight, minAmount, maxAmount, roundTo]
const DEBIT_MERCHANTS: [string, number, number, number, number][] = [
  ['Swiggy', 14, 120, 850, 1],
  ['Zomato', 12, 120, 900, 1],
  ['Uber', 8, 80, 650, 1],
  ['Ola', 4, 70, 500, 1],
  ['Amazon', 8, 199, 6500, 1],
  ['Flipkart', 4, 249, 5500, 1],
  ['Blinkit', 7, 90, 1200, 1],
  ['BigBasket', 4, 300, 2500, 1],
  ['Sri Lakshmi Kirana Store', 8, 40, 700, 1],
  ['Ganesh General Stores', 5, 30, 500, 1],
  ['Fresh Vegetables & Fruits', 4, 50, 400, 1],
  ['Apollo Pharmacy', 3, 80, 1500, 1],
  ['Starbucks', 2, 180, 700, 1],
  ['Chai Point', 3, 20, 200, 1],
  ['Netflix', 1, 199, 649, 1],
  ['Spotify', 1, 119, 199, 1],
  ['Jio Prepaid Recharge', 2, 239, 799, 1],
  ['BESCOM Electricity Bill', 2, 600, 3200, 1],
  ['Airtel Broadband', 1, 699, 1499, 1],
  ['BookMyShow', 2, 250, 1400, 1],
  ['IRCTC', 2, 300, 3500, 1],
  ['Indian Oil Petrol Pump', 3, 300, 2500, 100],
]
const FRIENDS = ['Rahul Sharma', 'Priya Nair', 'Arjun Mehta', 'Sneha Iyer', 'Karthik R', 'Divya Menon', 'Aman Verma']
const TRANSFER_AMOUNTS = [50, 100, 150, 200, 250, 300, 500, 750, 1000, 1500, 2000, 3000]
// [name, weight, minAmount, maxAmount]
const CREDITS: [string, number, number, number][] = [
  ['Salary - Acme Technologies', 1, 35000, 85000],
  ['Refund - Amazon', 4, 150, 3000],
  ['Refund - Swiggy', 3, 80, 500],
  ['Cashback - PhonePe', 5, 5, 150],
  ['Interest Credit', 2, 20, 400],
]

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

function weighted<T>(items: T[], weight: (item: T) => number): T {
  let roll = Math.random() * items.reduce((sum, it) => sum + weight(it), 0)
  for (const it of items) {
    roll -= weight(it)
    if (roll <= 0) return it
  }
  return items[items.length - 1]
}

function refId(): string {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')
}

export function makeTransaction(accountId: string, when: Date): DeviceCaptureRequest {
  let type: 'debit' | 'credit' = 'debit'
  let merchant: string
  let amount: number

  const roll = Math.random()
  if (roll < 0.12) {
    type = Math.random() < 0.65 ? 'debit' : 'credit'
    merchant = `UPI/${pick(FRIENDS)}`
    amount = pick(TRANSFER_AMOUNTS)
  } else if (roll < 0.18) {
    const [name, , lo, hi] = weighted(CREDITS, (c) => c[1])
    type = 'credit'
    merchant = name
    amount = Math.round(rand(lo, hi) * 100) / 100
  } else if (roll < 0.2) {
    merchant = 'Rent - Mr. Suresh Reddy'
    amount = Math.round(rand(12000, 18000) / 500) * 500
  } else {
    const [name, , lo, hi, step] = weighted(DEBIT_MERCHANTS, (m) => m[1])
    merchant = name
    amount = Math.round(rand(lo, hi))
    if (step > 1) amount = Math.round(amount / step) * step
  }

  return {
    account_id: accountId,
    amount: amount.toFixed(2),
    type,
    txn_timestamp: when.toISOString(),
    merchant_raw: merchant,
    reference_id: refId(),
  }
}

/** Timestamps for a burst of `count` historical transactions over the last ~90 days, oldest first. */
export function burstTimestamps(count: number): Date[] {
  const now = Date.now()
  return Array.from({ length: count }, () => new Date(now - rand(60, 90 * 86400) * 1000)).sort(
    (a, b) => a.getTime() - b.getTime()
  )
}
