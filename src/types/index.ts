export interface Transaction {
  id?: string
  type: 'income' | 'expense'
  amount: number
  category: string
  date: string        // "YYYY-MM-DD"
  title?: string
  memo?: string
  paymentMethod?: string
  createdAt: number
  updatedAt: number
}

export interface BalanceItem {
  id?: string
  type: 'asset' | 'liability'
  category: string
  amount: number
  date: string
  memo?: string
  createdAt: number
  updatedAt: number
}

export interface MonthlyStats {
  income: number
  expense: number
  profit: number
  profitRate: number
  investmentRatio: number
  cashRunwayMonths: number
  expenseByCategory: Record<string, number>
  incomeByCategory: Record<string, number>
}

export interface Alert {
  type: 'warning' | 'danger'
  message: string
  suggestion: string
}
