export const EXPENSE_CATEGORIES = [
  { key: 'food',       label: '食費',   emoji: '🍱', color: '#EF9F27' },
  { key: 'transport',  label: '交通費', emoji: '🚃', color: '#3ED1C6' },
  { key: 'social',     label: '交際費', emoji: '🤝', color: '#7A5CFF' },
  { key: 'misc',       label: '雑費',   emoji: '📦', color: '#64748B' },
  { key: 'investment', label: '投資',   emoji: '📈', color: '#4F6DF5' },
] as const

export const INCOME_CATEGORIES = [
  { key: 'salary',   label: '給与',   emoji: '💼', color: '#4F6DF5' },
  { key: 'side',     label: '副業',   emoji: '💻', color: '#3ED1C6' },
  { key: 'business', label: '事業',   emoji: '🏢', color: '#7A5CFF' },
  { key: 'referral', label: '紹介',   emoji: '🤝', color: '#EF9F27' },
  { key: 'other',    label: 'その他', emoji: '💰', color: '#64748B' },
] as const

export const PAYMENT_METHODS = [
  { key: 'cash',   label: '現金' },
  { key: 'credit', label: 'クレカ' },
  { key: 'ic',     label: 'IC/電子' },
  { key: 'other',  label: 'その他' },
] as const

export const ASSET_CATEGORIES = [
  { key: 'cash',        label: '現金' },
  { key: 'bank',        label: '銀行残高' },
  { key: 'receivable',  label: '売掛金' },
  { key: 'other_asset', label: 'その他資産' },
] as const

export const LIABILITY_CATEGORIES = [
  { key: 'loan',            label: '借入金' },
  { key: 'credit_card',     label: 'クレカ未払' },
  { key: 'payable',         label: '未払金' },
  { key: 'other_liability', label: 'その他負債' },
] as const

export type ExpenseCategoryKey = typeof EXPENSE_CATEGORIES[number]['key']
export type IncomeCategoryKey  = typeof INCOME_CATEGORIES[number]['key']

export function getExpenseLabel(key: string): string {
  return EXPENSE_CATEGORIES.find(c => c.key === key)?.label ?? key
}

export function getIncomeLabel(key: string): string {
  return INCOME_CATEGORIES.find(c => c.key === key)?.label ?? key
}

export function getExpenseColor(key: string): string {
  return EXPENSE_CATEGORIES.find(c => c.key === key)?.color ?? '#64748B'
}
