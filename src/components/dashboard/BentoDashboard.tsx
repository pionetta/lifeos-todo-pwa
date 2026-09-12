import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Calendar,
  Layers,
  MapPin,
  Sparkles,
  Clock,
  ChevronRight,
  Plus,
  ExternalLink,
  Download
} from 'lucide-react'
import { db } from '../../db'
import { generateGoogleCalendarUrl, downloadICSFile } from '../../utils/calendar'
import TodoModal from '../todo/TodoModal'
import { pushLocalData } from '../../services/syncService'
import type { NavTab } from '../layout/MobileShell'

interface BentoDashboardProps {
  onNavigate?: (tab: NavTab) => void
}

export default function BentoDashboard({ onNavigate }: BentoDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalScope, setModalScope] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Live queries from Dexie.js
  const allTodos = useLiveQuery(() => db.todos.reverse().sortBy('createdAt'), []) || []
  const dailyTodos = allTodos.filter((t) => t.scope === 'daily')
  const weeklyTodos = allTodos.filter((t) => t.scope === 'weekly')
  const monthlyTodos = allTodos.filter((t) => t.scope === 'monthly')
  const allWishlists = useLiveQuery(() => db.wishlists.toArray(), []) || []

  // Seed sample data on first run only if not initialized
  useEffect(() => {
    const seedInitialData = async () => {
      const initialized = localStorage.getItem('lifeos_todos_initialized')
      if (!initialized) {
        const count = await db.todos.count()
        if (count === 0) {
          const todayStr = new Date().toISOString().slice(0, 10)
          const now = new Date().toISOString()
          await db.todos.bulkAdd([
            {
              title: 'Review Wireframe PWA & Desain Bento',
              description: 'Periksa kesesuaian palet pastel dan komponen mobile-first',
              scope: 'daily',
              category: 'Pekerjaan',
              dueDate: todayStr,
              dueTime: '14:00',
              completed: false,
              synced: 0,
              createdAt: now,
              updatedAt: now,
            },
            {
              title: 'Olahraga Lari Pagi 30 Menit',
              description: 'Rute keliling taman kota',
              scope: 'daily',
              category: 'Kesehatan',
              dueDate: todayStr,
              dueTime: '06:30',
              completed: true,
              synced: 0,
              createdAt: now,
              updatedAt: now,
            },
            {
              title: 'Selesaikan Arsitektur Sinkronisasi Supabase',
              description: 'Persiapan modul online/offline sync di IndexedDB',
              scope: 'weekly',
              category: 'Belajar',
              dueDate: todayStr,
              completed: false,
              synced: 0,
              createdAt: now,
              updatedAt: now,
            },
            {
              title: 'Rilis Versi 1.0 Mobile PWA Life Organizer',
              description: 'Deploy ke Vercel dan pasang di homescreen HP',
              scope: 'monthly',
              category: 'Finansial',
              dueDate: todayStr,
              completed: false,
              synced: 0,
              createdAt: now,
              updatedAt: now,
            },
          ])
        }
        localStorage.setItem('lifeos_todos_initialized', 'true')
      }
    }
    seedInitialData()
  }, [])

  // Calculate daily metrics
  const totalDaily = dailyTodos.length
  const completedDaily = dailyTodos.filter((t) => t.completed).length
  const dailyPercentage = totalDaily > 0 ? Math.round((completedDaily / totalDaily) * 100) : 0

  // The primary target card (Next incomplete daily to-do, or most recent)
  const targetTodo = dailyTodos.find((t) => !t.completed) || dailyTodos[0]

  // Quick preview tasks (up to 4 daily tasks)
  const previewDailyTodos = dailyTodos.slice(0, 4)

  // Wishlist metrics
  const destinationItems = allWishlists.filter((w) => w.type === 'place')
  const itemGoods = allWishlists.filter((w) => w.type === 'item')

  const totalSavedGoods = itemGoods.reduce((sum, item) => sum + (item.currentSaved || 0), 0)
  const totalTargetGoods = itemGoods.reduce((sum, item) => sum + (item.targetCost || 0), 0)
  const goodsPercentage =
    totalTargetGoods > 0 ? Math.min(100, Math.round((totalSavedGoods / totalTargetGoods) * 100)) : 74

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

  const openNewTodo = (scope: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    setModalScope(scope)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-4 pt-1">
      {/* HERO PROGRESS CARD (Lavender / Soft Iris) */}
      <section className="bg-[#D7D9FE] rounded-3xl p-5 shadow-xs text-[#18181B] relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/25 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm text-xs font-semibold text-[#3538CD]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Focus</span>
          </span>
          <span className="text-xs font-bold text-slate-700 bg-white/50 px-2.5 py-1 rounded-full">
            {completedDaily} / {totalDaily} Selesai
          </span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black tracking-tight text-[#18181B]">
                {dailyPercentage}%
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 mt-1">Target Harian Tercapai</p>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {totalDaily - completedDaily > 0
                ? `Tersisa ${totalDaily - completedDaily} tugas harian aktif`
                : 'Semua to-do harian selesai! Luar biasa 🎉'}
            </p>
          </div>

          {/* Circular SVG Progress Ring */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 72 72">
              <circle
                cx="36"
                cy="36"
                r="28"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="36"
                cy="36"
                r="28"
                stroke="#3538CD"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={176}
                strokeDashoffset={176 - (176 * dailyPercentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <CheckCircle2 className="w-6 h-6 text-[#3538CD] stroke-[2.5]" />
            </div>
          </div>
        </div>
      </section>

      {/* QUICK TARGET CARD (Coral / Warm Peach) */}
      {targetTodo ? (
        <section className="bg-[#FCE4DE] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>
                  Target Utama • {targetTodo.dueTime || 'Hari ini'}
                </span>
              </div>
              <h2
                className={`text-base font-bold text-[#18181B] leading-snug ${
                  targetTodo.completed ? 'line-through opacity-60' : ''
                }`}
              >
                {targetTodo.title}
              </h2>
              <p className="text-xs text-slate-600">
                {targetTodo.category} • {targetTodo.description || 'Fokus utama hari ini'}
              </p>
            </div>

            {/* Check Toggle Button */}
            <button
              onClick={() => handleToggleTodo(targetTodo.id, targetTodo.completed)}
              aria-label={targetTodo.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
              className={`w-11 h-11 rounded-full shadow-xs flex items-center justify-center transition-all flex-shrink-0 ${
                targetTodo.completed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-[#18181B] hover:bg-slate-900 hover:text-white active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Calendar Actions on Quick Card */}
          <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-rose-950 text-[11px]">Sync Kalender:</span>
            <div className="flex items-center gap-2">
              <a
                href={generateGoogleCalendarUrl(targetTodo)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-slate-800 text-[11px] font-bold hover:bg-slate-900 hover:text-white transition-all shadow-2xs"
                title="Buka di Google Calendar Web"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Google Cal</span>
              </a>
              <button
                onClick={() => downloadICSFile(targetTodo)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-slate-800 text-[11px] font-bold hover:bg-slate-900 hover:text-white transition-all shadow-2xs"
                title="Unduh file .ics untuk Apple / Android Calendar"
              >
                <Download className="w-3 h-3" />
                <span>.ICS</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[#FCE4DE] rounded-3xl p-5 text-center space-y-2">
          <p className="text-xs font-bold text-rose-900">Belum ada tugas hari ini</p>
          <button
            onClick={() => openNewTodo('daily')}
            className="px-4 py-1.5 rounded-full bg-[#18181B] text-white text-xs font-bold"
          >
            + Buat Tugas Hari Ini
          </button>
        </section>
      )}

      {/* BENTO GRID (2 COLUMNS) */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* CARD 1: Soft Amber / Cream (To-Do Mingguan) */}
        <div className="bg-[#FDEFD9] rounded-3xl p-4 flex flex-col justify-between min-h-[148px] shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-amber-800">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-amber-900">
              {weeklyTodos.length} Tasks
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-sm font-bold text-[#18181B]">To-Do Mingguan</h3>
            <p className="text-xs text-slate-600 mt-0.5">Sprint & target pekan</p>
          </div>

          <button
            onClick={() => onNavigate?.('todo')}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-950 mt-3 group text-left"
          >
            <span>Buka Tugas</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* CARD 2: Soft Blue / Ice (To-Do Bulanan) */}
        <div className="bg-[#D9E8FD] rounded-3xl p-4 flex flex-col justify-between min-h-[148px] shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-blue-800">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-blue-900">
              {monthlyTodos.length} Goals
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-sm font-bold text-[#18181B]">To-Do Bulanan</h3>
            <p className="text-xs text-slate-600 mt-0.5">Milestone besar</p>
          </div>

          <button
            onClick={() => onNavigate?.('todo')}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-950 mt-3 group text-left"
          >
            <span>Buka Tugas</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* CARD 3: Soft Mint / Teal (Wishlist Destinasi) */}
        <div className="bg-[#D5F2EB] rounded-3xl p-4 flex flex-col justify-between min-h-[150px] shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-teal-800">
              <MapPin className="w-4 h-4 stroke-[2.2]" />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-teal-900">
              {destinationItems.length} Destinasi
            </span>
          </div>

          <div className="mt-2">
            <h3 className="text-sm font-bold text-[#18181B]">Destinasi Impian</h3>
            <p className="text-xs text-slate-600 mt-0.5">Rencana liburan & trip</p>

            <div className="w-full bg-white/60 h-2 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-teal-600 h-full rounded-full w-[65%]"></div>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.('wishlist')}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-950 mt-2.5 group text-left"
          >
            <span>Lihat Wishlist</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* CARD 4: Soft Rose / Coral (Wishlist Barang) */}
        <div className="bg-[#FEDCDC] rounded-3xl p-4 flex flex-col justify-between min-h-[150px] shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-rose-800">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-rose-900">
              {goodsPercentage}%
            </span>
          </div>

          <div className="mt-2">
            <h3 className="text-sm font-bold text-[#18181B]">Wishlist Barang</h3>
            <p className="text-xs text-slate-600 mt-0.5">{itemGoods.length} Barang Impian</p>

            <div className="w-full bg-white/60 h-2 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-rose-600 h-full rounded-full" style={{ width: `${goodsPercentage}%` }}></div>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.('wishlist')}
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-950 mt-2.5 group text-left"
          >
            <span>Tabungan</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* QUICK PREVIEW TUGAS HARI INI */}
      <section className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#18181B]">Fokus Tugas Hari Ini</h3>
            <p className="text-[11px] text-slate-400 font-medium">Ringkasan aktivitas hari ini</p>
          </div>

          <button
            onClick={() => onNavigate?.('todo')}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>Semua Tugas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {previewDailyTodos.length === 0 ? (
            <div className="bg-white rounded-3xl p-5 text-center text-xs text-slate-400 border border-slate-100">
              Belum ada tugas hari ini.{' '}
              <button
                onClick={() => openNewTodo('daily')}
                className="font-bold text-indigo-600 hover:underline ml-1"
              >
                Tambah Tugas
              </button>
            </div>
          ) : (
            previewDailyTodos.map((todo) => (
              <div
                key={todo.id}
                className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-100/90 flex items-center justify-between gap-2.5 hover:shadow-xs transition-all"
              >
                <button
                  onClick={() => handleToggleTodo(todo.id, todo.completed)}
                  aria-label="Toggle status"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors flex-shrink-0 active:scale-95"
                >
                  {todo.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                  ) : (
                    <Circle className="w-5 h-5 stroke-[1.8]" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-bold text-[#18181B] truncate ${
                      todo.completed ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {todo.title}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {todo.dueTime || 'Hari ini'} • {todo.category}
                  </span>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    todo.completed
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {todo.completed ? 'Selesai' : 'Aktif'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => openNewTodo('daily')}
          className="w-full py-2.5 rounded-2xl bg-white border border-dashed border-slate-300 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Tambah Tugas Cepat</span>
        </button>
      </section>

      {/* CREATE TODO MODAL */}
      <TodoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialScope={modalScope}
      />
    </div>
  )
}
