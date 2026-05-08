import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { calcMonthlyStats, calcMonthlyTimeSeries, recentMonths } from '../utils/calculations'
import { formatCurrency, formatPercent, currentYM, ymToLabel } from '../utils/formatters'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getExpenseLabel, getIncomeLabel, getExpenseColor } from '../constants/categories'
import { Card, KpiCard, SectionHeader } from '../components/ui/Card'

export function PLReport() {
  const [ym, setYm] = useState(currentYM())
  const allTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? []

  const stats    = calcMonthlyStats(allTransactions, ym, 0)
  const prevYM   = getPrevYM(ym)
  const prevStats = calcMonthlyStats(allTransactions, prevYM, 0)

  const months   = recentMonths(6)
  const series   = calcMonthlyTimeSeries(allTransactions, months)

  const changeMonth = (delta: number) => {
    const [y, m] = ym.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const diff = (cur: number, prev: number) => {
    if (prev === 0) return null
    const p = ((cur - prev) / prev) * 100
    return { pct: p, label: `前月比 ${p >= 0 ? '+' : ''}${p.toFixed(0)}%` }
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button onClick={() => changeMonth(-1)} className="p-2 text-brand-muted">‹</button>
          <h1 className="text-lg font-bold text-brand-text">損益計算書 {ymToLabel(ym)}</h1>
          <button onClick={() => changeMonth(1)}  className="p-2 text-brand-muted">›</button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* サマリー */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="収入合計" value={formatCurrency(stats.income)} accent="blue"
            sub={diff(stats.income, prevStats.income)?.label} />
          <KpiCard label="支出合計" value={formatCurrency(stats.expense)} accent="red"
            sub={diff(stats.expense, prevStats.expense)?.label} />
          <KpiCard label="利益" value={formatCurrency(stats.profit)}
            accent={stats.profit >= 0 ? 'green' : 'red'} />
          <KpiCard label="利益率" value={formatPercent(stats.profitRate)}
            accent={stats.profitRate >= 20 ? 'green' : 'red'} />
        </div>

        {/* 月別推移グラフ */}
        <Card>
          <SectionHeader title="月別推移" sub="過去6ヶ月" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={series} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v/10000)}万`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income"  name="収入" fill="#4F6DF5" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="支出" fill="#EF9F27" radius={[4,4,0,0]} />
              <Bar dataKey="profit"  name="利益" fill="#3ED1C6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 支出内訳 */}
        <Card>
          <SectionHeader title="支出の内訳" />
          {EXPENSE_CATEGORIES.map(cat => {
            const amt = stats.expenseByCategory[cat.key] ?? 0
            const pct = stats.expense > 0 ? (amt / stats.expense) * 100 : 0
            return (
              <div key={cat.key} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.emoji}</span>
                  <span className="text-sm text-brand-text">{cat.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{formatCurrency(amt)}</span>
                  <span className="text-xs text-brand-muted ml-2">{formatPercent(pct, 0)}</span>
                </div>
              </div>
            )
          })}
          <div className="flex justify-between pt-3 border-t border-gray-100 mt-1">
            <span className="text-sm font-bold text-brand-text">合計</span>
            <span className="text-sm font-bold text-brand-text">{formatCurrency(stats.expense)}</span>
          </div>
        </Card>

        {/* 収入内訳 */}
        <Card>
          <SectionHeader title="収入の内訳" />
          {INCOME_CATEGORIES.map(cat => {
            const amt = stats.incomeByCategory[cat.key] ?? 0
            const pct = stats.income > 0 ? (amt / stats.income) * 100 : 0
            return (
              <div key={cat.key} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.emoji}</span>
                  <span className="text-sm text-brand-text">{cat.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{formatCurrency(amt)}</span>
                  <span className="text-xs text-brand-muted ml-2">{formatPercent(pct, 0)}</span>
                </div>
              </div>
            )
          })}
          <div className="flex justify-between pt-3 border-t border-gray-100 mt-1">
            <span className="text-sm font-bold text-brand-text">合計</span>
            <span className="text-sm font-bold text-brand-text">{formatCurrency(stats.income)}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

function getPrevYM(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
