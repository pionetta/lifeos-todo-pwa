import Dexie, { type EntityTable } from 'dexie'

export interface Todo {
  id?: number
  title: string
  description?: string
  scope: 'daily' | 'weekly' | 'monthly'
  category: string
  dueDate: string
  dueTime?: string
  completed: boolean
  synced: boolean | number
  createdAt: string
  updatedAt: string
}

export interface Wishlist {
  id?: number
  title: string
  type: 'place' | 'item'
  targetCost: number
  currentSaved: number
  notes?: string
  targetDate?: string
  synced: boolean | number
  createdAt: string
  updatedAt: string
}

export interface DailyLog {
  id?: number
  date: string
  quickNotes: string
  dailyWins: string[]
  synced: boolean | number
  createdAt: string
  updatedAt: string
}

export interface DeletedRecord {
  id?: number
  table: 'todos' | 'wishlists'
  recordId: number
  deletedAt: string
}

export class LifeOSDatabase extends Dexie {
  todos!: EntityTable<Todo, 'id'>
  wishlists!: EntityTable<Wishlist, 'id'>
  dailyLogs!: EntityTable<DailyLog, 'id'>
  deletedRecords!: EntityTable<DeletedRecord, 'id'>

  constructor() {
    super('LifeOSToDoDB')
    this.version(1).stores({
      todos: '++id, scope, category, dueDate, completed, synced, createdAt',
      wishlists: '++id, type, synced, createdAt',
      dailyLogs: '++id, date, synced, createdAt',
    })
    this.version(2).stores({
      todos: '++id, scope, category, dueDate, completed, synced, createdAt',
      wishlists: '++id, type, synced, createdAt',
      dailyLogs: '++id, date, synced, createdAt',
      deletedRecords: '++id, table, recordId, deletedAt',
    })
  }
}

export const db = new LifeOSDatabase()
