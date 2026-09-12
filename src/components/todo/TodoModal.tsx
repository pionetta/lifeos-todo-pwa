import React, { useState } from 'react'
import { X, Calendar, Clock, Tag, Sparkles } from 'lucide-react'
import { db, type Todo } from '../../db'
import { pushLocalData } from '../../services/syncService'

interface TodoModalProps {
  isOpen: boolean
  onClose: () => void
  initialScope?: 'daily' | 'weekly' | 'monthly'
}

export default function TodoModal({
  isOpen,
  onClose,
  initialScope = 'daily',
}: TodoModalProps) {
  const todayStr = new Date().toISOString().slice(0, 10)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<'daily' | 'weekly' | 'monthly'>(initialScope)
  const [category, setCategory] = useState('Pekerjaan')
  const [dueDate, setDueDate] = useState(todayStr)
  const [dueTime, setDueTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const categories = ['Pekerjaan', 'Pribadi', 'Kesehatan', 'Belajar', 'Finansial']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setIsSubmitting(true)
      const now = new Date().toISOString()

      const newTodo: Todo = {
        title: title.trim(),
        description: description.trim() || undefined,
        scope,
        category,
        dueDate,
        dueTime: dueTime || undefined,
        completed: false,
        synced: 0,
        createdAt: now,
        updatedAt: now,
      }

      await db.todos.add(newTodo)
      pushLocalData().catch(() => {})

      // Reset form & close
      setTitle('')
      setDescription('')
      setDueTime('')
      onClose()
    } catch (err) {
      console.error('Gagal menambahkan to-do:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-[400px] max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0369A1]">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </span>
            <h2 className="text-base font-extrabold text-[#18181B]">Tambah Tugas Baru</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Scope Selector (Daily / Weekly / Monthly) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Cakupan Waktu</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setScope('daily')}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  scope === 'daily'
                    ? 'bg-[#E0F2FE] text-[#0369A1] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setScope('weekly')}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  scope === 'weekly'
                    ? 'bg-[#EDE9FE] text-[#6D28D9] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Mingguan
              </button>
              <button
                type="button"
                onClick={() => setScope('monthly')}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                  scope === 'monthly'
                    ? 'bg-[#FFEDD5] text-[#C2410C] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Bulanan
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Judul Tugas *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Diskusi arsitektur cloud..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Catatan / Rincian</label>
            <textarea
              rows={2}
              placeholder="Tambahkan detail atau link referensi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Tanggal</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Jam (Opsional)</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Kategori</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    category === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 active:scale-98 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 py-2.5 rounded-2xl bg-[#18181B] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 active:scale-98 transition-all shadow-sm"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
