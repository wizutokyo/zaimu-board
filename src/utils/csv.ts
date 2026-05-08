import type { Transaction } from '../types'

export function transactionsToCSV(rows: Transaction[]): string {
  const header = ['id','type','amount','category','date','title','memo','paymentMethod','createdAt']
  const lines = rows.map(r => [
    r.id ?? '',
    r.type,
    r.amount,
    r.category,
    r.date,
    `"${(r.title ?? '').replace(/"/g, '""')}"`,
    `"${(r.memo ?? '').replace(/"/g, '""')}"`,
    r.paymentMethod ?? '',
    r.createdAt,
  ].join(','))
  return [header.join(','), ...lines].join('\n')
}

export function downloadCSV(content: string, filename: string): void {
  const bom = '\uFEFF'   // Excel対応BOM
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseTransactionsCSV(text: string): Omit<Transaction, 'id'>[] {
  const lines = text.replace(/^\uFEFF/, '').split('\n').filter(Boolean)
  if (lines.length < 2) return []
  // Skip header line
  return lines.slice(1).map(line => {
    const cols = line.split(',')
    return {
      type:          cols[1] as 'income' | 'expense',
      amount:        Number(cols[2]),
      category:      cols[3],
      date:          cols[4],
      title:         cols[5]?.replace(/^"|"$/g, '') || undefined,
      memo:          cols[6]?.replace(/^"|"$/g, '') || undefined,
      paymentMethod: cols[7] || undefined,
      createdAt:     Number(cols[8]) || Date.now(),
      updatedAt:     Date.now(),
    }
  }).filter(r => r.type === 'income' || r.type === 'expense')
}
