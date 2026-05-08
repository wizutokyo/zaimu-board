import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { formatCurrency, ymToLabel } from '../utils/formatters'
import { getExpenseLabel, getIncomeLabel, EXPENSE_CATEGORIES, getExpenseColor } from '../constants/categories'
import { Card } from '../components/ui/Card'
import type { Transaction } from '../types'

export function CalendarView() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [selected, setSelected] = useState<string | null>(null)

  const ym = `${year}-${String(month + 1).padStart(2, '0')}`

  const transactions = useLiveQuery(
    () => db.transactions.filter(t => t.date.startsWith(ym)).toArray(),
    [ym]
  ) ?? []

  // 日付ごとにグルーピング
  const byDate: Record<string, Transaction[]> = {}
  transactions.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = []
    byDate[t.date].push(t)
  })

  // カレンダー構築
  const firstDay = new Date(year, month, 1).getDay() // 0=日
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

  const changeMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
    setSelected(null)
  }

  const selectedTx = selected ? (byDate[selected] ?? []) : []
  const selectedIncome  = selectedTx.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0)
  const selectedExpense = selectedTx.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0)

  // 月合計
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0)

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => changeMonth(-1)} className="p-2 text-brand-muted text-xl">‹</button>
          <h1 className="text-lg font-bold text-brand-text">{ymToLabel(ym)}</h1>
          <button onClick={() => changeMonth(1)}  className="p-2 text-brand-muted text-xl">›</button>
        </div>
        {/* 月合計バー */}
        <div className="flex gap-3 pb-1">
          <div className="flex-1 bg-blue-50 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-brand-muted">収入</p>
            <p className="text-sm font-bold text-brand-blue">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-brand-muted">支出</p>
            <p className="text-sm font-bold text-red-500">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-brand-muted">収支</p>
            <p className={`text-sm font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* カレンダー本体 */}
        <Card className="p-3">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 mb-1">
            {['日','月','火','水','木','金','土'].map((d, i) => (
              <div key={d} className={`text-center text-xs font-medium py-1 ${i===0?'text-red-400':i===6?'text-blue-400':'text-brand-muted'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 gap-y-1">
            {/* 空白（月初の曜日分） */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* 日付セル */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const txs = byDate[dateStr] ?? []
              const inc = txs.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0)
              const exp = txs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0)
              const isToday    = dateStr === todayStr
              const isSelected = dateStr === selected
              const dow = (firstDay + day - 1) % 7

              return (
                <button
                  key={day}
                  onClick={() => setSelected(s => s === dateStr ? null : dateStr)}
                  className={`
                    flex flex-col items-center rounded-xl py-1 px-0.5 min-h-[52px] transition-all
                    ${isSelected ? 'bg-brand-blue/10 ring-1 ring-brand-blue' : 'active:bg-gray-50'}
                  `}
                >
                  <span className={`
                    text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5
                    ${isToday ? 'bg-brand-blue text-white' : dow===0 ? 'text-red-400' : dow===6 ? 'text-blue-400' : 'text-brand-text'}
                  `}>
                    {day}
                  </span>
                  {/* ドット表示 */}
                  {inc > 0 && (
                    <span className="text-[9px] font-medium text-brand-blue leading-none">
                      +{formatShort(inc)}
                    </span>
                  )}
                  {exp > 0 && (
                    <span className="text-[9px] font-medium text-red-400 leading-none">
                      -{formatShort(exp)}
                    </span>
                  )}
                  {txs.length > 0 && inc === 0 && exp === 0 && (
                    <span className="w-1 h-1 rounded-full bg-gray-300 mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        {/* 選択日の明細 */}
        {selected && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-brand-text">
                {Number(selected.split('-')[2])}日の収支
              </h2>
              <div className="flex gap-3 text-xs">
                {selectedIncome  > 0 && <span className="text-brand-blue font-medium">収入 {formatCurrency(selectedIncome)}</span>}
                {selectedExpense > 0 && <span className="text-red-500 font-medium">支出 {formatCurrency(selectedExpense)}</span>}
              </div>
            </div>

            {selectedTx.length === 0 ? (
              <p className="text-sm text-brand-muted text-center py-4">この日の記録はありません</p>
            ) : (
              <div className="space-y-2">
                {selectedTx
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map(tx => (
                    <TxRow key={tx.id} tx={tx} />
                  ))
                }
              </div>
            )}
          </Card>
        )}

        {/* 今月のすべての記録 */}
        {!selected && transactions.length > 0 && (
          <Card>
            <h2 className="text-sm font-bold text-brand-text mb-3">今月の記録</h2>
            <div className="space-y-2">
              {[...transactions]
                .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
                .map(tx => <TxRow key={tx.id} tx={tx} />)
              }
            </div>
          </Card>
        )}

        {transactions.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-brand-muted text-sm">この月の記録がありません</p>
          </Card>
        )}
      </div>
    </div>
  )
}

// 明細行コンポーネント
function TxRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'income'
  const label = isIncome ? getIncomeLabel(tx.category) : getExpenseLabel(tx.category)
  const color = isIncome ? '#4F6DF5' : getExpenseColor(tx.category)
  const cat = isIncome
    ? null
    : EXPENSE_CATEGORIES.find(c => c.key === tx.category)

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-lg w-8 text-center">{cat?.emoji ?? (isIncome ? '💰' : '💸')}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-text truncate">
          {tx.title || label}
        </p>
        <p className="text-xs text-brand-muted">{label} · {tx.date.slice(8).replace(/^0/, '')}日</p>
      </div>
      <span className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-brand-blue' : 'text-red-500'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
      </span>
    </div>
  )
}

// 短縮表示（例：12,000 → 1.2万）
function formatShort(n: number): string {
  if (n >= 10000) return `${(n/10000).toFixed(n%10000===0?0:1)}万`
  if (n >= 1000)  return `${(n/1000).toFixed(0)}千`
  return String(n)
}
