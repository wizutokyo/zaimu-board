import { useState } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../constants/categories'
import { addTransaction } from '../db/queries'
import { todayString } from '../utils/formatters'
import { Button, CategoryButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'

type TabType = 'expense' | 'income'

export function TransactionInput() {
  const [tab, setTab] = useState<TabType>('expense')
  const { showToast, ToastContainer } = useToast()

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      <ToastContainer />
      {/* ヘッダー */}
      <div className="pt-12 px-4 pb-4">
        <h1 className="text-xl font-bold text-brand-text">記録する</h1>
      </div>

      {/* タブ */}
      <div className="px-4 mb-4">
        <div className="flex bg-white rounded-2xl p-1 shadow-card">
          <button
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'expense' ? 'bg-brand-blue text-white shadow-sm' : 'text-brand-muted'}`}
            onClick={() => setTab('expense')}
          >
            支出
          </button>
          <button
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'income' ? 'bg-brand-blue text-white shadow-sm' : 'text-brand-muted'}`}
            onClick={() => setTab('income')}
          >
            収入
          </button>
        </div>
      </div>

      {tab === 'expense'
        ? <ExpenseForm showToast={showToast} />
        : <IncomeForm  showToast={showToast} />
      }
    </div>
  )
}

// ── 支出フォーム ────────────────────────────────────────────
function ExpenseForm({ showToast }: { showToast: (msg: string, type?: 'success'|'error') => void }) {
  const [amount, setAmount]   = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate]       = useState(todayString())
  const [title, setTitle]     = useState('')
  const [memo, setMemo]       = useState('')
  const [payment, setPayment] = useState('')
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    if (!amount || !category) {
      showToast('金額とカテゴリを入力してください', 'error')
      return
    }
    setSaving(true)
    try {
      await addTransaction({
        type: 'expense',
        amount: Number(amount),
        category,
        date,
        title: title || undefined,
        memo:  memo  || undefined,
        paymentMethod: payment || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      // リセット
      setAmount(''); setCategory(''); setDate(todayString())
      setTitle(''); setMemo(''); setPayment('')
      showToast('支出を記録しました')
    } catch {
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 space-y-4">
      {/* 金額 */}
      <Card>
        <label className="block text-xs text-brand-muted mb-1">金額 <span className="text-red-400">*</span></label>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-muted">¥</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 text-3xl font-bold text-brand-text outline-none placeholder-gray-200 bg-transparent"
          />
        </div>
      </Card>

      {/* カテゴリ */}
      <Card>
        <label className="block text-xs text-brand-muted mb-2">カテゴリ <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-3 gap-2">
          {EXPENSE_CATEGORIES.map(cat => (
            <CategoryButton
              key={cat.key}
              emoji={cat.emoji}
              label={cat.label}
              selected={category === cat.key}
              color={cat.color}
              onClick={() => setCategory(cat.key)}
            />
          ))}
        </div>
      </Card>

      {/* 日付 */}
      <Card>
        <label className="block text-xs text-brand-muted mb-1">日付 <span className="text-red-400">*</span></label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full text-base text-brand-text outline-none bg-transparent"
        />
      </Card>

      {/* 内容・メモ（任意） */}
      <Card>
        <label className="block text-xs text-brand-muted mb-1">内容（任意）</label>
        <input
          type="text"
          placeholder="例：ランチ、タクシー代"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-base text-brand-text outline-none bg-transparent mb-3 pb-2 border-b border-gray-100"
        />
        <label className="block text-xs text-brand-muted mb-1">メモ（任意）</label>
        <input
          type="text"
          placeholder="補足メモ"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          className="w-full text-base text-brand-text outline-none bg-transparent"
        />
      </Card>

      {/* 支払方法（任意） */}
      <Card>
        <label className="block text-xs text-brand-muted mb-2">支払方法（任意）</label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map(pm => (
            <button
              key={pm.key}
              type="button"
              onClick={() => setPayment(p => p === pm.key ? '' : pm.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                payment === pm.key
                  ? 'bg-brand-blue text-white'
                  : 'bg-brand-bg text-brand-muted border border-gray-100'
              }`}
            >
              {pm.label}
            </button>
          ))}
        </div>
      </Card>

      <Button fullWidth size="lg" onClick={handleSave} disabled={saving}>
        {saving ? '保存中...' : '支出を記録する'}
      </Button>
    </div>
  )
}

// ── 収入フォーム ────────────────────────────────────────────
function IncomeForm({ showToast }: { showToast: (msg: string, type?: 'success'|'error') => void }) {
  const [amount, setAmount]   = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate]       = useState(todayString())
  const [title, setTitle]     = useState('')
  const [memo, setMemo]       = useState('')
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    if (!amount || !category) {
      showToast('金額とカテゴリを入力してください', 'error')
      return
    }
    setSaving(true)
    try {
      await addTransaction({
        type: 'income',
        amount: Number(amount),
        category,
        date,
        title: title || undefined,
        memo:  memo  || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      setAmount(''); setCategory(''); setDate(todayString())
      setTitle(''); setMemo('')
      showToast('収入を記録しました')
    } catch {
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 space-y-4">
      <Card>
        <label className="block text-xs text-brand-muted mb-1">金額 <span className="text-red-400">*</span></label>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-muted">¥</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 text-3xl font-bold text-brand-text outline-none placeholder-gray-200 bg-transparent"
          />
        </div>
      </Card>

      <Card>
        <label className="block text-xs text-brand-muted mb-2">カテゴリ <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-3 gap-2">
          {INCOME_CATEGORIES.map(cat => (
            <CategoryButton
              key={cat.key}
              emoji={cat.emoji}
              label={cat.label}
              selected={category === cat.key}
              color={cat.color}
              onClick={() => setCategory(cat.key)}
            />
          ))}
        </div>
      </Card>

      <Card>
        <label className="block text-xs text-brand-muted mb-1">日付 <span className="text-red-400">*</span></label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full text-base text-brand-text outline-none bg-transparent"
        />
      </Card>

      <Card>
        <label className="block text-xs text-brand-muted mb-1">内容（任意）</label>
        <input
          type="text"
          placeholder="例：6月給与、案件名"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-base text-brand-text outline-none bg-transparent mb-3 pb-2 border-b border-gray-100"
        />
        <label className="block text-xs text-brand-muted mb-1">メモ（任意）</label>
        <input
          type="text"
          placeholder="補足メモ"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          className="w-full text-base text-brand-text outline-none bg-transparent"
        />
      </Card>

      <Button fullWidth size="lg" onClick={handleSave} disabled={saving}>
        {saving ? '保存中...' : '収入を記録する'}
      </Button>
    </div>
  )
}
