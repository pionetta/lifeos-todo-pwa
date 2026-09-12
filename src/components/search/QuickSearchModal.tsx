import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Search,
  X,
  CheckCircle2,
  Circle,
  Heart,
  Calendar,
  ArrowRight,
  CheckSquare
} from 'lucide-react'
import { db } from '../../db'
import type { NavTab } from '../layout/MobileShell'

interface QuickSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (tab: NavTab) => void
}

export default function QuickSearchModal({
  isOpen,
  onClose,
  onNavigate,
}: QuickSearchModalProps) {
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState<'all' | 'todo' | 'wishlist'>('all')

  // Live queries from Dexie with default empty array
  const allTodos = useLiveQuery(() => db.todos.toArray(), [], [])
  const allWishlists = useLiveQuery(() => db.wishlists.toArray(), [], [])

  const q = query.trim().toLowerCase()
  const isSearching = Boolean(q)

  const filteredTodos = isSearching
    ? allTodos.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q) ||
          t.scope.toLowerCase().includes(q)
      )
    : allTodos.slice(0, 4)

  const filteredWishlists = isSearching
    ? allWishlists.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          (w.notes && w.notes.toLowerCase().includes(q)) ||
          w.type.toLowerCase().includes(q)
      )
    : allWishlists.slice(0, 3)

  const totalCount = filteredTodos.length + filteredWishlists.length

  if (!isOpen) return null

  const handleSelectTodo = () => {
    onNavigate('todo')
    onClose()
  }

  const handleSelectWishlist = () => {
    onNavigate('wishlist')
    onClose()
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] max-h-[80vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari to-do, wishlist, atau kategori..."
            className="flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>

        {/* Filter Type Pills */}
        <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5">
          <button
            onClick={() => setActiveType('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              activeType === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Semua ({totalCount})
          </button>
          <button
            onClick={() => setActiveType('todo')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              activeType === 'todo'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            To-Do ({filteredTodos.length})
          </button>
          <button
            onClick={() => setActiveType('wishlist')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              activeType === 'wishlist'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Wishlist ({filteredWishlists.length})
          </button>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
          {/* Section 1: To-Do Items */}
          {(activeType === 'all' || activeType === 'todo') && filteredTodos.length > 0 && (
            <div className="space-y-2 pt-1 first:pt-0">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Daftar Tugas</span>
                </span>
                <span>{filteredTodos.length} item</span>
              </div>

              <div className="space-y-2">
                {filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    onClick={handleSelectTodo}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 flex items-start justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-slate-400">
                        {todo.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 stroke-[2.2]" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 stroke-[2.2]" />
                        )}
                      </span>
                      <div className="space-y-1">
                        <p
                          className={`text-xs font-bold text-[#18181B] leading-snug ${
                            todo.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {todo.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-semibold">
                            {todo.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold capitalize">
                            {todo.scope}
                          </span>
                          {todo.dueDate && (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {todo.dueDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Wishlist Items */}
          {(activeType === 'all' || activeType === 'wishlist') && filteredWishlists.length > 0 && (
            <div className="space-y-2 pt-3 first:pt-0">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Wishlist & Target</span>
                </span>
                <span>{filteredWishlists.length} item</span>
              </div>

              <div className="space-y-2">
                {filteredWishlists.map((w) => {
                  const progress = Math.min(100, Math.round((w.currentSaved / (w.targetCost || 1)) * 100))
                  return (
                    <div
                      key={w.id}
                      onClick={handleSelectWishlist}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#18181B]">{w.title}</p>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800">
                            {progress}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          {formatCurrency(w.currentSaved)} / {formatCurrency(w.targetCost)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalCount === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-sm font-bold text-slate-700">Tidak ada hasil ditemukan</p>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                Coba kata kunci lain atau periksa ejaan judul dan kategori to-do Anda.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
