import type { Transaction, BalanceItem, MonthlyStats, Alert } from '../types'

export function calcMonthlyStats(
  transactions: Transaction[],
  ym: string,
  cashBalance: number
): MonthlyStats {
  const filtered = transactions.filter(t => t.date.startsWith(ym))

  const income  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const profit  = income - expense

  const investmentExpense = filtered
    .filter(t => t.type === 'expense' && t.category === 'investment')
    .reduce((s, t) => s + t.amount, 0)

  const expenseByCategory: Record<string, number> = {}
  filtered.filter(t => t.type === 'expense').forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] ?? 0) + t.amount
  })

  const incomeByCategory: Record<string, number> = {}
  filtered.filter(t => t.type === 'income').forEach(t => {
    incomeByCategory[t.category] = (incomeByCategory[t.category] ?? 0) + t.amount
  })

  return {
    income,
    expense,
    profit,
    profitRate:      income > 0 ? (profit / income) * 100 : 0,
    investmentRatio: expense > 0 ? (investmentExpense / expense) * 100 : 0,
    cashRunwayMonths: expense > 0 ? cashBalance / expense : 0,
    expenseByCategory,
    incomeByCategory,
  }
}

export function calcAlerts(stats: MonthlyStats): Alert[] {
  const alerts: Alert[] = []

  const socialExpense = stats.expenseByCategory['social'] ?? 0
  if (stats.expense > 0 && (socialExpense / stats.expense) * 100 >= 30) {
    alerts.push({
      type: 'warning',
      message: '交際費が総支出の30%以上です',
      suggestion: '交際費の内訳を確認し、見直しを検討してください',
    })
  }

  if (stats.investmentRatio < 10 && stats.expense > 0) {
    alerts.push({
      type: 'warning',
      message: '投資比率が10%未満です',
      suggestion: '毎月の支出の10%以上を投資に回すことを目標にしましょう',
    })
  }

  if (stats.profitRate < 20 && stats.income > 0) {
    alerts.push({
      type: 'warning',
      message: '利益率が20%未満です',
      suggestion: '固定費の見直しや収入源の追加を検討しましょう',
    })
  }

  if (stats.cashRunwayMonths > 0 && stats.cashRunwayMonths < 3) {
    alerts.push({
      type: 'danger',
      message: `キャッシュ残存月数が${stats.cashRunwayMonths.toFixed(1)}ヶ月です`,
      suggestion: '早急に支出削減または収入増加の対策が必要です',
    })
  }

  return alerts
}

export function calcNetAssets(items: BalanceItem[]): {
  totalAssets: number
  totalLiabilities: number
  netAssets: number
  assetsByCategory: Record<string, number>
  liabilitiesByCategory: Record<string, number>
} {
  const latest = deduplicateLatest(items)
  const assets = latest.filter(i => i.type === 'asset')
  const liabilities = latest.filter(i => i.type === 'liability')

  const totalAssets = assets.reduce((s, i) => s + i.amount, 0)
  const totalLiabilities = liabilities.reduce((s, i) => s + i.amount, 0)

  const assetsByCategory: Record<string, number> = {}
  assets.forEach(i => { assetsByCategory[i.category] = i.amount })

  const liabilitiesByCategory: Record<string, number> = {}
  liabilities.forEach(i => { liabilitiesByCategory[i.category] = i.amount })

  return { totalAssets, totalLiabilities, netAssets: totalAssets - totalLiabilities, assetsByCategory, liabilitiesByCategory }
}

function deduplicateLatest(items: BalanceItem[]): BalanceItem[] {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date))
  const seen = new Set<string>()
  return sorted.filter(i => {
    const key = `${i.type}:${i.category}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// 月別集計（グラフ用）
export function calcMonthlyTimeSeries(
  transactions: Transaction[],
  months: string[]   // ["2024-01", ..., "2024-06"]
) {
  return months.map(ym => {
    const stats = calcMonthlyStats(transactions, ym, 0)
    return { month: ym.slice(5), income: stats.income, expense: stats.expense, profit: stats.profit }
  })
}

// 直近N ヶ月リストを返す（現在月含む）
export function recentMonths(n: number): string[] {
  const now = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}
