import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  CalendarPlus,
  Download,
  Trash2,
  Filter,
  Search,
  CheckSquare
} from 'lucide-react'
import { db, type Todo } from '../../db'
import { generateGoogleCalendarUrl, downloadICSFile } from '../../utils/calendar'
import TodoModal from './TodoModal'
import { pushLocalData, deleteTodoFromCloud } from '../../services/syncService'

export default function TodoModule() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalScope, setModalScope] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [selectedScope, setSelectedScope] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const categories = ['Semua', 'Pekerjaan', 'Pribadi', 'Kesehatan', 'Belajar', 'Finansial']

  // Live queries from Dexie.js
  const allTodos = useLiveQuery(() => db.todos.reverse().sortBy('createdAt'), []) || []

  // Filter tasks based on scope, category, status, and search query
  const filteredTodos = allTodos.filter((todo) => {
    const matchScope = selectedScope === 'all' || todo.scope === selectedScope
    const matchCategory = selectedCategory === 'all' || todo.category === selectedCategory
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !todo.completed) ||
      (statusFilter === 'completed' && todo.completed)
    const matchSearch =
      !searchQuery.trim() ||
      todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.description && todo.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchScope && matchCategory && matchStatus && matchSearch
  })

  // Metrics
  const totalTasks = allTodos.length
  const completedTasks = allTodos.filter((t) => t.completed).length

  // Toggle todo completion
  const handleToggleTodo = async (id?: number, currentStatus?: boolean) => {
    if (!id) return
    await db.todos.update(id, {
      completed: !currentStatus,
      synced: 0,
      updatedAt: new Date().toISOString(),
    })
    pushLocalData().catch(() => {})
  }

  // Delete todo from Dexie & Supabase
  const handleDeleteTodo = async (id?: number) => {
    if (!id) return
    await db.todos.delete(id)
    deleteTodoFromCloud(id).catch(() => {})
  }

  const openNewTodo = (scope: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    setModalScope(scope)
    setIsModalOpen(true)
  }

  // Scope styling badge
  const getScopeBadge = (scope: Todo['scope']) => {
    switch (scope) {
      case 'daily':
        return { label: 'Harian', bg: 'bg-[#D7D9FE]/80 text-[#3538CD]' }
      case 'weekly':
        return { label: 'Mingguan', bg: 'bg-[#FDEFD9] text-amber-800' }
      case 'monthly':
        return { label: 'Bulanan', bg: 'bg-[#D9E8FD] text-blue-800' }
      default:
        return { label: scope, bg: 'bg-slate-100 text-slate-700' }
    }
  }

  return (
    <div className="space-y-4 pt-1">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[#18181B] flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
            <span>Manajemen Tugas</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {completedTasks} dari {totalTasks} tugas terselesaikan
          </p>
        </div>

        {/* Add Todo Button */}
        <button
          onClick={() => openNewTodo(selectedScope === 'all' ? 'daily' : selectedScope)}
          className="h-9 px-3.5 rounded-2xl bg-[#18181B] text-white text-xs font-extrabold flex items-center gap-1.5 hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Tambah</span>
        </button>
      </div>

      {/* QUICK SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari tugas atau deskripsi..."
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            Bersihkan
          </button>
        )}
      </div>

      {/* SCOPE TABS */}
      <div className="bg-slate-200/60 p-1 rounded-2xl flex items-center text-xs font-bold shadow-2xs">
        <button
          onClick={() => setSelectedScope('all')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            selectedScope === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setSelectedScope('daily')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            selectedScope === 'daily'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Harian
        </button>
        <button
          onClick={() => setSelectedScope('weekly')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            selectedScope === 'weekly'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Mingguan
        </button>
        <button
          onClick={() => setSelectedScope('monthly')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            selectedScope === 'monthly'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Bulanan
        </button>
      </div>

      {/* CATEGORY & STATUS FILTER CHIPS */}
      <div className="space-y-2">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((cat) => {
            const isSelected =
              (cat === 'Semua' && selectedCategory === 'all') || selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'Semua' ? 'all' : cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-bold transition-all ${
                  isSelected
                    ? 'bg-[#18181B] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Status Filter (Semua / Belum Selesai / Selesai) */}
        <div className="flex items-center gap-2 pt-0.5 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>Status:</span>
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-indigo-100 text-indigo-800 font-bold'
                : 'hover:text-slate-800'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-100 text-amber-800 font-bold'
                : 'hover:text-slate-800'
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-2 py-0.5 rounded-lg transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'hover:text-slate-800'
            }`}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* TASK LIST */}
      <div className="space-y-2.5 pt-1">
        {filteredTodos.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-100 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <CheckSquare className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Tidak ada tugas ditemukan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'Coba kata kunci pencarian lain atau ubah filter.'
                  : 'Belum ada tugas pada kategori ini. Mulai dengan membuat tugas baru!'}
              </p>
            </div>
            <button
              onClick={() => openNewTodo(selectedScope === 'all' ? 'daily' : selectedScope)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#18181B] text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const calendarUrl = generateGoogleCalendarUrl(todo)
            const scopeBadge = getScopeBadge(todo.scope)

            return (
              <div
                key={todo.id}
                className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100/90 flex items-start justify-between gap-2.5 hover:shadow-xs transition-all"
              >
                {/* Checkbox Tick */}
                <button
                  onClick={() => handleToggleTodo(todo.id, todo.completed)}
                  aria-label={todo.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                  className="min-w-[44px] min-h-[44px] -ml-2 -mt-1 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors flex-shrink-0 active:scale-95"
                >
                  {todo.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
                  ) : (
                    <Circle className="w-6 h-6 stroke-[1.8]" />
                  )}
                </button>

                {/* Todo Details */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${scopeBadge.bg}`}
                    >
                      {scopeBadge.label}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {todo.category}
                    </span>
                  </div>

                  <h4
                    className={`text-xs font-bold text-[#18181B] leading-snug ${
                      todo.completed ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {todo.title}
                  </h4>

                  {todo.description && (
                    <p
                      className={`text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed ${
                        todo.completed ? 'line-through text-slate-300' : ''
                      }`}
                    >
                      {todo.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {todo.dueTime ? `${todo.dueTime} • ` : ''}
                        {todo.dueDate}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Action Icons */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-0.5">
                    {/* Add to Calendar Shortcut */}
                    <a
                      href={calendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-[34px] min-h-[34px] rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors active:scale-95"
                      title="Add to Google Calendar"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                    </a>

                    {/* Download ICS */}
                    <button
                      onClick={() => downloadICSFile(todo)}
                      className="min-w-[34px] min-h-[34px] rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors active:scale-95"
                      title="Download .ICS file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="min-w-[34px] min-h-[34px] rounded-full bg-slate-50 hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors active:scale-95"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* CREATE TODO MODAL */}
      <TodoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialScope={modalScope}
      />
    </div>
  )
}
