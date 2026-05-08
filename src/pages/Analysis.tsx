import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { calcMonthlyStats, calcAlerts, calcMonthlyTimeSeries, recentMonths } from '../utils/calculations'
import { formatCurrency, formatPercent, currentYM } from '../utils/formatters'
import { getExpenseColor, getExpenseLabel, EXPENSE_CATEGORIES, getIncomeLabel, INCOME_CATEGORIES } from '../constants/categories'
import { Card, SectionHeader } from '../components/ui/Card'

export function Analysis() {
  const allTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? []
  const ym     = currentYM()
  const stats  = calcMonthlyStats(allTransactions, ym, 0)
  const alerts = calcAlerts(stats)
  const months = recentMonths(6)
  const series = calcMonthlyTimeSeries(allTransactions, months)

  const expPie = Object.entries(stats.expenseByCategory)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: getExpenseLabel(k), value: v, color: getExpenseColor(k) }))

  const incPie = Object.entries(stats.incomeByCategory)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: getIncomeLabel(k), value: v }))

  const incomeColors = ['#4F6DF5','#3ED1C6','#7A5CFF','#EF9F27','#64748B']

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <h1 className="text-lg font-bold text-brand-text">分析・改善提案</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* アラート */}
        {alerts.length > 0 ? (
          <div className="space-y-2">
            <SectionHeader title="改善が必要な項目" />
            {alerts.map((a, i) => (
              <div key={i} className={`rounded-2xl p-4 ${a.type === 'danger' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                <p className={`font-semibold text-sm ${a.type === 'danger' ? 'text-red-600' : 'text-amber-600'}`}>
                  {a.type === 'danger' ? '🚨 ' : '⚠️ '}{a.message}
                </p>
                <p className="text-brand-muted text-sm mt-1">💡 {a.suggestion}</p>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-6">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-semibold text-brand-text">今月の財務状況は良好です</p>
            <p className="text-xs text-brand-muted mt-1">このまま継続しましょう</p>
          </Card>
        )}

        {/* 利益推移 */}
        <Card>
          <SectionHeader title="利益推移" sub="過去6ヶ月" />
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={series} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v/10000)}万`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), '']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="income"  stroke="#4F6DF5" strokeWidth={2} dot={{ r: 3 }} name="収入" />
              <Line type="monotone" dataKey="expense" stroke="#EF9F27" strokeWidth={2} dot={{ r: 3 }} name="支出" />
              <Line type="monotone" dataKey="profit"  stroke="#3ED1C6" strokeWidth={2.5} dot={{ r: 4 }} name="利益" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* 支出円グラフ */}
        {expPie.length > 0 && (
          <Card>
            <SectionHeader title="今月の支出内訳" />
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={expPie} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {expPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {expPie.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-brand-muted">{d.name}</span>
                    </div>
                    <span className="text-xs font-medium">{formatPercent(stats.expense > 0 ? (d.value/stats.expense)*100 : 0, 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 収入円グラフ */}
        {incPie.length > 0 && (
          <Card>
            <SectionHeader title="今月の収入内訳" />
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={incPie} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {incPie.map((_, i) => <Cell key={i} fill={incomeColors[i % incomeColors.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {incPie.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: incomeColors[i % incomeColors.length] }} />
                      <span className="text-xs text-brand-muted">{d.name}</span>
                    </div>
                    <span className="text-xs font-medium">{formatPercent(stats.income > 0 ? (d.value/stats.income)*100 : 0, 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 改善提案リスト（常時表示） */}
        <Card>
          <SectionHeader title="財務改善チェックリスト" />
          {[
            { icon: '📉', text: '交際費を総支出の30%以下に抑える', ok: (stats.expenseByCategory['social'] ?? 0) / (stats.expense || 1) < 0.3 },
            { icon: '📈', text: '投資比率を10%以上にする', ok: stats.investmentRatio >= 10 },
            { icon: '💰', text: '利益率20%以上を維持する', ok: stats.profitRate >= 20 },
            { icon: '🏦', text: 'キャッシュ3ヶ月分以上を確保する', ok: stats.cashRunwayMonths >= 3 },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-base mt-0.5">{item.icon}</span>
              <span className="text-sm text-brand-text flex-1">{item.text}</span>
              <span className={`text-sm font-bold flex-shrink-0 ${item.ok ? 'text-emerald-500' : 'text-amber-500'}`}>
                {item.ok ? '✓' : '!'}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
