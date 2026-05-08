import { db } from './database'
import type { Transaction, BalanceItem } from '../types'

// ── transactions ────────────────────────────────────────────
export async function addTransaction(data: Omit<Transaction, 'id'>): Promise<string> {
  const id = crypto.randomUUID()
  await db.transactions.add({ ...data, id })
  return id
}

export async function getTransactionsByMonth(ym: string): Promise<Transaction[]> {
  // ym = "2024-06"
  return db.transactions
    .filter(t => t.date.startsWith(ym))
    .toArray()
}

export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions.orderBy('date').reverse().toArray()
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id)
}

export async function updateTransaction(id: string, data: Partial<Transaction>): Promise<void> {
  await db.transactions.update(id, { ...data, updatedAt: Date.now() })
}

// ── balanceItems ────────────────────────────────────────────
export async function upsertBalanceItem(data: Omit<BalanceItem, 'id'> & { id?: string }): Promise<string> {
  if (data.id) {
    await db.balanceItems.update(data.id, { ...data, updatedAt: Date.now() })
    return data.id
  }
  const id = crypto.randomUUID()
  await db.balanceItems.add({ ...data, id })
  return id
}

export async function getLatestBalanceItems(): Promise<BalanceItem[]> {
  // カテゴリごとに最新1件を返す
  const all = await db.balanceItems.orderBy('date').reverse().toArray()
  const seen = new Set<string>()
  return all.filter(item => {
    const key = `${item.type}:${item.category}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function getAllBalanceItems(): Promise<BalanceItem[]> {
  return db.balanceItems.orderBy('date').reverse().toArray()
}

// ── CSV エクスポート ─────────────────────────────────────────
export async function exportTransactionsCSV(): Promise<string> {
  const rows = await getAllTransactions()
  const header = 'id,type,amount,category,date,title,memo,paymentMethod,createdAt\n'
  const body = rows.map(r =>
    [r.id, r.type, r.amount, r.category, r.date,
     `"${r.title ?? ''}"`, `"${r.memo ?? ''}"`,
     r.paymentMethod ?? '', r.createdAt].join(',')
  ).join('\n')
  return header + body
}

// ── 全データ削除 ─────────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  await db.transactions.clear()
  await db.balanceItems.clear()
}
