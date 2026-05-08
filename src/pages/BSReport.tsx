import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { formatCurrency, todayString } from '../utils/formatters'
import { LIABILITY_CATEGORIES } from '../constants/categories'
import { Card, SectionHeader, KpiCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { upsertBalanceItem } from '../db/queries'
import { useToast } from '../components/ui/Toast'
import type { BalanceItem } from '../types'

export function BSReport() {
  const [showLiabilityInput, setShowLiabilityInput] = useState(false)
  const { showToast, ToastContainer } = useToast()

  // PLのトランザクションデータから資産を自動計算
  const allTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? []
  const allLiabilities  = useLiveQuery(() => db.balanceItems.filter(i => i.type === 'liability').toArray(), []) ?? []

  // ── 資産の自動計算 ──────────────────────────────────────
  // 現金残高 = 全期間の収入合計 − 支出合計
  const totalIncome  = allTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const cashBalance  = totalIncome - totalExpense

  // 投資累計 = 支出カテゴリ「investment」の合計
  const investmentTotal = allTransactions
    .filter(t => t.type === 'expense' && t.category === 'investment')
    .reduce((s, t) => s + t.amount, 0)

  // 収入源別の累計（参考）
  const incomeByCategory: Record<string, number> = {}
  allTransactions.filter(t => t.type === 'income').forEach(t => {
    incomeByCategory[t.category] = (incomeByCategory[t.category] ?? 0) + t.amount
  })

  // 資産合計（現金残高 + 投資累計）
  const totalAssets = cashBalance + investmentTotal

  // ── 負債（手動入力分のみ）──────────────────────────────
  const latestLiabilities = deduplicateLatest(allLiabilities)
  const totalLiabilities  = latestLiabilities.reduce((s, i) => s + i.amount, 0)
  const liabilityMap: Record<string, number> = {}
  latestLiabilities.forEach(i => { liabilityMap[i.category] = i.amount })

  // 純資産
  const netAssets = totalAssets - totalLiabilities

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      <ToastContainer />
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-text">貸借対照表（BS）</h1>
          <p className="text-xs text-brand-muted mt-0.5">PLデータから自動計算</p>
        </div>
        <button
          onClick={() => setShowLiabilityInput(v => !v)}
          className="bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          {showLiabilityInput ? '閉じる' : '負債を入力'}
        </button>
      </div>

      {/* 負債入力フォーム */}
      {showLiabilityInput && (
        <LiabilityInputForm
          currentValues={liabilityMap}
          onSaved={() => { showToast('保存しました'); setShowLiabilityInput(false) }}
        />
      )}

      <div className="px-4 py-4 space-y-4">

        {/* データなし案内 */}
        {allTransactions.length === 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm">
            <p className="font-semibold text-amber-600">⚠️ まだ収支データがありません</p>
            <p className="text-brand-muted mt-1">「入力」タブから収入・支出を記録すると自動で反映されます</p>
          </div>
        )}

        {/* サマリー */}
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="資産合計"  value={formatCurrency(totalAssets)}      accent="blue" />
          <KpiCard label="負債合計"  value={formatCurrency(totalLiabilities)} accent="red" />
          <KpiCard label="純資産"    value={formatCurrency(netAssets)}        accent={netAssets >= 0 ? 'green' : 'red'} />
        </div>

        {/* 資産（自動計算） */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="資産" sub="PLデータから自動計算" />
            <span className="text-xs bg-blue-50 text-brand-blue px-2 py-1 rounded-lg font-medium">自動</span>
          </div>

          <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
            <div>
              <p className="text-sm text-brand-text">現金・預金残高</p>
              <p className="text-xs text-brand-muted mt-0.5">収入合計 − 支出合計（全期間）</p>
            </div>
            <span className={`text-sm font-medium ${cashBalance >= 0 ? 'text-brand-text' : 'text-red-500'}`}>
              {formatCurrency(cashBalance)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
            <div>
              <p className="text-sm text-brand-text">投資累計</p>
              <p className="text-xs text-brand-muted mt-0.5">支出カテゴリ「投資」の累計</p>
            </div>
            <span className="text-sm font-medium text-brand-text">
              {formatCurrency(investmentTotal)}
            </span>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-100 mt-1">
            <span className="text-sm font-bold text-brand-blue">資産合計</span>
            <span className="text-sm font-bold text-brand-blue">{formatCurrency(totalAssets)}</span>
          </div>
        </Card>

        {/* 収入内訳（参考） */}
        {totalIncome > 0 && (
          <Card>
            <SectionHeader title="収入累計の内訳" sub="参考：カテゴリ別の累計収入" />
            {Object.entries(incomeByCategory).map(([cat, amt]) => {
              const label = getCatLabel(cat)
              return (
                <div key={cat} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-brand-muted">{label}</span>
                  <span className="text-sm font-medium text-brand-text">{formatCurrency(amt)}</span>
                </div>
              )
            })}
            <div className="flex justify-between pt-3 border-t border-gray-100 mt-1">
              <span className="text-sm font-bold text-brand-text">収入合計</span>
              <span className="text-sm font-bold text-brand-blue">{formatCurrency(totalIncome)}</span>
            </div>
          </Card>
        )}

        {/* 負債（手動入力） */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="負債" sub="手動で入力してください" />
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-lg font-medium">手動</span>
          </div>

          {LIABILITY_CATEGORIES.map(cat => (
            <div key={cat.key} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-brand-text">{cat.label}</span>
              <span className={`text-sm font-medium ${liabilityMap[cat.key] ? 'text-brand-text' : 'text-gray-300'}`}>
                {formatCurrency(liabilityMap[cat.key] ?? 0)}
              </span>
            </div>
          ))}

          <div className="flex justify-between pt-3 border-t border-gray-100 mt-1">
            <span className="text-sm font-bold text-red-500">負債合計</span>
            <span className="text-sm font-bold text-red-500">{formatCurrency(totalLiabilities)}</span>
          </div>

          {totalLiabilities === 0 && (
            <button
              onClick={() => setShowLiabilityInput(true)}
              className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-gray-200 text-sm text-brand-muted"
            >
              ＋ 負債を入力する（クレカ未払・借入金など）
            </button>
          )}
        </Card>

        {/* 純資産 */}
        <Card className={`border-2 ${netAssets >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-brand-text">純資産</p>
              <p className="text-xs text-brand-muted">資産合計 − 負債合計</p>
            </div>
            <p className={`text-2xl font-bold ${netAssets >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatCurrency(netAssets)}
            </p>
          </div>
        </Card>

      </div>
    </div>
  )
}

// ── 負債入力フォーム ─────────────────────────────────────────
function LiabilityInputForm({
  currentValues,
  onSaved,
}: {
  currentValues: Record<string, number>
  onSaved: () => void
}) {
  const [category, setCategory] = useState('')
  const [amount, setAmount]     = useState('')
  const [saving, setSaving]     = useState(false)

  const handleCategorySelect = (key: string) => {
    setCategory(key)
    setAmount(currentValues[key] !== undefined ? String(currentValues[key]) : '')
  }

  const handleSave = async () => {
    if (!category || !amount) return
    setSaving(true)
    await upsertBalanceItem({
      type: 'liability', category, amount: Number(amount),
      date: todayString(), createdAt: Date.now(), updatedAt: Date.now(),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="px-4 pb-2 pt-3">
      <Card>
        <p className="text-xs text-brand-muted mb-2">負債のカテゴリを選択</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {LIABILITY_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => handleCategorySelect(cat.key)}
              className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                category === cat.key
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-brand-text border-gray-100'
              }`}
            >
              <span>{cat.label}</span>
              {currentValues[cat.key] !== undefined && category !== cat.key && (
                <span className="block text-xs text-brand-muted mt-0.5">
                  現在 {formatCurrency(currentValues[cat.key])}
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-brand-muted mb-1">金額</p>
        <div className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2 mb-4">
          <span className="text-xl font-bold text-brand-muted">¥</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 text-2xl font-bold text-brand-text outline-none bg-transparent placeholder-gray-200"
          />
        </div>

        <Button fullWidth variant="danger" onClick={handleSave} disabled={saving || !category || !amount}>
          {saving ? '保存中...' : '負債を保存する'}
        </Button>
      </Card>
    </div>
  )
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

function getCatLabel(key: string): string {
  const map: Record<string, string> = {
    salary: '給与', side: '副業', business: '事業', referral: '紹介', other: 'その他',
  }
  return map[key] ?? key
}
