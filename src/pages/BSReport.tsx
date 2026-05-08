import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import { calcNetAssets } from '../utils/calculations'
import { formatCurrency, todayString } from '../utils/formatters'
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '../constants/categories'
import { Card, SectionHeader, KpiCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { upsertBalanceItem } from '../db/queries'
import { useToast } from '../components/ui/Toast'

export function BSReport() {
  const [showInput, setShowInput] = useState(false)
  const { showToast, ToastContainer } = useToast()
  const allItems = useLiveQuery(() => db.balanceItems.toArray(), []) ?? []

  const bs = calcNetAssets(allItems)

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      <ToastContainer />
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-bold text-brand-text">貸借対照表（BS）</h1>
        <button
          onClick={() => setShowInput(v => !v)}
          className="text-sm text-brand-blue font-medium"
        >
          {showInput ? '閉じる' : '＋ 更新'}
        </button>
      </div>

      {showInput && (
        <BalanceInputForm onSaved={() => { showToast('保存しました'); setShowInput(false) }} />
      )}

      <div className="px-4 py-4 space-y-4">
        {/* 純資産サマリー */}
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="資産合計"  value={formatCurrency(bs.totalAssets)}      accent="blue" />
          <KpiCard label="負債合計"  value={formatCurrency(bs.totalLiabilities)} accent="red" />
          <KpiCard label="純資産"    value={formatCurrency(bs.netAssets)}
            accent={bs.netAssets >= 0 ? 'green' : 'red'} />
        </div>

        {/* 資産 */}
        <Card>
          <SectionHeader title="資産" sub="Assets" />
          {ASSET_CATEGORIES.map(cat => (
            <div key={cat.key} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-brand-text">{cat.label}</span>
              <span className="text-sm font-medium">{formatCurrency(bs.assetsByCategory[cat.key] ?? 0)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 border-t border-gray-100 mt-1">
            <span className="text-sm font-bold text-brand-blue">資産合計</span>
            <span className="text-sm font-bold text-brand-blue">{formatCurrency(bs.totalAssets)}</span>
          </div>
        </Card>

        {/* 負債 */}
        <Card>
          <SectionHeader title="負債" sub="Liabilities" />
          {LIABILITY_CATEGORIES.map(cat => (
            <div key={cat.key} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-brand-text">{cat.label}</span>
              <span className="text-sm font-medium">{formatCurrency(bs.liabilitiesByCategory[cat.key] ?? 0)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 border-t border-gray-100 mt-1">
            <span className="text-sm font-bold text-red-500">負債合計</span>
            <span className="text-sm font-bold text-red-500">{formatCurrency(bs.totalLiabilities)}</span>
          </div>
        </Card>

        {/* 純資産 */}
        <Card className={`border-2 ${bs.netAssets >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-brand-muted">純資産</p>
              <p className="text-xs text-brand-muted">Net Assets = 資産 − 負債</p>
            </div>
            <p className={`text-2xl font-bold ${bs.netAssets >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatCurrency(bs.netAssets)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── 資産・負債入力フォーム ───────────────────────────────────
function BalanceInputForm({ onSaved }: { onSaved: () => void }) {
  const [type, setType] = useState<'asset' | 'liability'>('asset')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const categories = type === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES

  const handleSave = async () => {
    if (!category || !amount) return
    setSaving(true)
    await upsertBalanceItem({
      type, category, amount: Number(amount),
      date: todayString(), createdAt: Date.now(), updatedAt: Date.now()
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="px-4 pb-4 space-y-3">
      <Card>
        <div className="flex bg-brand-bg rounded-xl p-1 mb-3">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'asset' ? 'bg-white text-brand-blue shadow-sm' : 'text-brand-muted'}`}
            onClick={() => { setType('asset'); setCategory('') }}
          >資産</button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${type === 'liability' ? 'bg-white text-red-500 shadow-sm' : 'text-brand-muted'}`}
            onClick={() => { setType('liability'); setCategory('') }}
          >負債</button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                category === cat.key
                  ? type === 'asset' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-brand-text border-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <span className="text-xl font-bold text-brand-muted">¥</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="金額を入力"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 text-2xl font-bold text-brand-text outline-none bg-transparent placeholder-gray-200"
          />
        </div>

        <Button fullWidth className="mt-3" onClick={handleSave} disabled={saving || !category || !amount}>
          {saving ? '保存中...' : '保存する'}
        </Button>
      </Card>
    </div>
  )
}
