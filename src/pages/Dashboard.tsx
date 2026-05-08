import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { calcMonthlyStats, calcAlerts } from '../utils/calculations'
import { formatCurrency, formatPercent, currentYM, ymToLabel } from '../utils/formatters'
import { EXPENSE_CATEGORIES, getExpenseLabel, getExpenseColor } from '../constants/categories'
import { KpiCard, Card, SectionHeader } from '../components/ui/Card'

export function Dashboard() {
  const [ym, setYm] = useState(currentYM())
  const allTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? []

  // 現金残高（簡易：銀行＋現金の最新値）
  const [cashBalance, setCashBalance] = useState(0)
  useEffect(() => {
    db.balanceItems
      .filter(i => i.type === 'asset' && (i.category === 'cash' || i.category === 'bank'))
      .toArray()
      .then(items => {
        const total = items.reduce((s, i) => s + i.amount, 0)
        setCashBalance(total)
      })
  }, [])

  const stats  = calcMonthlyStats(allTransactions, ym, cashBalance)
  const alerts = calcAlerts(stats)

  // 円グラフデータ
  const pieData = Object.entries(stats.expenseByCategory)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: getExpenseLabel(k), value: v, color: getExpenseColor(k) }))

  // 月選択（前後移動）
  const changeMonth = (delta: number) => {
    const [y, m] = ym.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => changeMonth(-1)} className="p-2 text-brand-muted active:text-brand-blue">‹</button>
          <h1 className="text-lg font-bold text-brand-text">{ymToLabel(ym)}</h1>
          <button onClick={() => changeMonth(1)}  className="p-2 text-brand-muted active:text-brand-blue">›</button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* アラート */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={`rounded-2xl p-3 text-sm ${a.type === 'danger' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                <p className={`font-semibold ${a.type === 'danger' ? 'text-red-600' : 'text-amber-600'}`}>
                  {a.type === 'danger' ? '🚨 ' : '⚠️ '}{a.message}
                </p>
                <p className="text-brand-muted mt-0.5">{a.suggestion}</p>
              </div>
            ))}
          </div>
        )}

        {/* KPI 2列 */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="今月の収入"
            value={formatCurrency(stats.income)}
            accent="blue"
          />
          <KpiCard
            label="今月の支出"
            value={formatCurrency(stats.expense)}
            accent={stats.expense > stats.income ? 'red' : 'blue'}
          />
          <KpiCard
            label="利益（手取り）"
            value={formatCurrency(stats.profit)}
            accent={stats.profit >= 0 ? 'green' : 'red'}
            note="収入 − 支出"
          />
          <KpiCard
            label="利益率"
            value={formatPercent(stats.profitRate)}
            accent={stats.profitRate >= 20 ? 'green' : 'red'}
            note="目標：20%以上"
          />
          <KpiCard
            label="投資比率"
            value={formatPercent(stats.investmentRatio)}
            accent={stats.investmentRatio >= 10 ? 'green' : 'red'}
            note="目標：10%以上"
          />
          <KpiCard
            label="残存月数"
            value={`${stats.cashRunwayMonths.toFixed(1)}ヶ月`}
            accent={stats.cashRunwayMonths >= 3 ? 'green' : 'red'}
            note="現金÷月間支出"
          />
        </div>

        {/* 支出カテゴリ円グラフ */}
        {pieData.length > 0 ? (
          <Card>
            <SectionHeader title="支出の内訳" sub="カテゴリ別割合" />
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* 凡例 */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-brand-muted text-xs">{d.name}</span>
                  <span className="ml-auto text-xs font-medium text-brand-text">
                    {formatPercent(stats.expense > 0 ? (d.value / stats.expense) * 100 : 0, 0)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="text-center py-8">
            <p className="text-4xl mb-2">📊</p>
            <p className="text-brand-muted text-sm">この月の支出データがありません</p>
            <p className="text-brand-muted text-xs mt-1">「入力」タブから記録を始めましょう</p>
          </Card>
        )}

        {/* 支出カテゴリ一覧 */}
        {stats.expense > 0 && (
          <Card>
            <SectionHeader title="カテゴリ別支出" />
            <div className="space-y-3">
              {EXPENSE_CATEGORIES.map(cat => {
                const amt = stats.expenseByCategory[cat.key] ?? 0
                const pct = stats.expense > 0 ? (amt / stats.expense) * 100 : 0
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.emoji}</span>
                        <span className="text-sm text-brand-text">{cat.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-brand-text">{formatCurrency(amt)}</span>
                        <span className="text-xs text-brand-muted ml-2">{formatPercent(pct, 0)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
