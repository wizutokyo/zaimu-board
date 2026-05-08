import Dexie, { type Table } from 'dexie'
import type { Transaction, BalanceItem } from '../types'

class ZaimuDatabase extends Dexie {
  transactions!: Table<Transaction>
  balanceItems!: Table<BalanceItem>

  constructor() {
    super('ZaimuBoard')
    this.version(1).stores({
      transactions: 'id, type, category, date, createdAt',
      balanceItems:  'id, type, category, date, createdAt',
    })
  }
}

export const db = new ZaimuDatabase()
