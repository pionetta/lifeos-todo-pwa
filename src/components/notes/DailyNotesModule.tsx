import React, { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Save,
  RotateCcw,
  Trophy
} from 'lucide-react'
import { db } from '../../db'
import { pushLocalData } from '../../services/syncService'

interface QuickNotesCardProps {
  initialNotes: string
  onSave: (notes: string) => Promise<void>
}

function QuickNotesCard({ initialNotes, onSave }: QuickNotesCardProps) {
  const [notesText, setNotesText] = useState(initialNotes)
  const [isSavedNotice, setIsSavedNotice] = useState(false)

  const handleSave = async () => {
    await onSave(notesText)
    setIsSavedNotice(true)
    setTimeout(() => setIsSavedNotice(false), 2000)
  }

  return (
    <section className="bg-[#D7D9FE] rounded-3xl p-5 shadow-xs text-[#18181B] space-y-3 relative overflow-hidden">
      <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/20 rounded-full blur-xl pointer-events-none"></div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-[#3538CD]">
            <FileText className="w-4 h-4 stroke-[2.2]" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-[#18181B]">Quick Notes & Reflection</h2>
            <p className="text-[11px] text-slate-600 font-medium">
              Scratchpad refleksi harian
            </p>
          </div>
        </div>

        {isSavedNotice && (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full animate-in fade-in">
            ✓ Tersimpan
          </span>
        )}
      </div>

      <div className="space-y-2">
        <textarea
          rows={5}
          placeholder="Tuliskan catatan bebas, refleksi kegiatan, kendala yang dihadapi, atau ide spontan..."
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          className="w-full p-3.5 rounded-2xl bg-white/85 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white border border-white transition-all resize-none shadow-inner"
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#3538CD]" />
            <span>Tersimpan di IndexedDB lokal</span>
          </span>

          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-full bg-[#18181B] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Catatan</span>
          </button>
        </div>
      </div>
    </section>
  )
}

export default function DailyNotesModule() {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [newWinText, setNewWinText] = useState('')

  // Live query for the selected date's daily log
  const dailyLog = useLiveQuery(
    () => db.dailyLogs.where('date').equals(selectedDate).first(),
    [selectedDate]
  )

  // Seed initial sample data only on first app initialization
  useEffect(() => {
    const seedDailyLog = async () => {
      const initialized = localStorage.getItem('lifeos_notes_initialized')
      if (!initialized) {
        const count = await db.dailyLogs.count()
        if (count === 0) {
          const now = new Date().toISOString()
          await db.dailyLogs.add({
            date: todayStr,
            quickNotes:
              'Fokus hari ini: menjaga ritme konsistensi, menyempurnakan fitur PWA to-do, dan memastikan arsitektur Dexie.js berjalan lancar.',
            dailyWins: [
              'Menyelesaikan arsitektur IndexedDB Dexie.js',
              'Olahraga lari pagi 30 menit',
              'Membaca 1 bab buku psikologi produktivitas',
            ],
            synced: false,
            createdAt: now,
            updatedAt: now,
          })
        }
        localStorage.setItem('lifeos_notes_initialized', 'true')
      }
    }
    seedDailyLog()
  }, [todayStr])

  // Format Indonesian date representation
  const formatIndonesianDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  }

  // Date Navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const handleToday = () => {
    setSelectedDate(todayStr)
  }

  // Add Daily Win
  const handleAddWin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWinText.trim()) return

    const now = new Date().toISOString()
    const trimmedWin = newWinText.trim()

    if (dailyLog && dailyLog.id) {
      const updatedWins = [...(dailyLog.dailyWins || []), trimmedWin]
      await db.dailyLogs.update(dailyLog.id, {
        dailyWins: updatedWins,
        synced: 0,
        updatedAt: now,
      })
    } else {
      await db.dailyLogs.add({
        date: selectedDate,
        quickNotes: '',
        dailyWins: [trimmedWin],
        synced: 0,
        createdAt: now,
        updatedAt: now,
      })
    }

    pushLocalData().catch(() => {})
    setNewWinText('')
  }

  // Remove Daily Win
  const handleRemoveWin = async (index: number) => {
    if (!dailyLog || !dailyLog.id) return
    const updatedWins = dailyLog.dailyWins.filter((_, i) => i !== index)
    await db.dailyLogs.update(dailyLog.id, {
      dailyWins: updatedWins,
      synced: 0,
      updatedAt: new Date().toISOString(),
    })
    pushLocalData().catch(() => {})
  }

  // Save Quick Notes
  const handleSaveNotes = async (notesToSave: string) => {
    const now = new Date().toISOString()
    if (dailyLog && dailyLog.id) {
      await db.dailyLogs.update(dailyLog.id, {
        quickNotes: notesToSave,
        synced: 0,
        updatedAt: now,
      })
    } else {
      await db.dailyLogs.add({
        date: selectedDate,
        quickNotes: notesToSave,
        dailyWins: [],
        synced: 0,
        createdAt: now,
        updatedAt: now,
      })
    }
    pushLocalData().catch(() => {})
  }

  const currentWins = dailyLog?.dailyWins || []
  const isToday = selectedDate === todayStr

  return (
    <div className="space-y-4 pt-1">
      {/* DATE NAVIGATION BAR */}
      <section className="bg-white rounded-3xl p-3 shadow-xs border border-slate-100 flex items-center justify-between">
        <button
          onClick={handlePrevDay}
          aria-label="Hari sebelumnya"
          className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span className="text-xs font-extrabold text-[#18181B] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatIndonesianDate(selectedDate)}</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {isToday ? 'Hari Ini (Active)' : selectedDate}
            </span>
          </div>

          {!isToday && (
            <button
              onClick={handleToday}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Hari Ini</span>
            </button>
          )}
        </div>

        <button
          onClick={handleNextDay}
          aria-label="Hari berikutnya"
          className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.2]" />
        </button>
      </section>

      {/* CARD 1: DAILY WINS (Peach / Amber `#FDEFD9`) */}
      <section className="bg-[#FDEFD9] rounded-3xl p-5 shadow-xs text-[#18181B] space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-amber-900">
              <Trophy className="w-4 h-4 stroke-[2.2]" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-[#18181B]">Daily Wins & Gratitude</h2>
              <p className="text-[11px] text-amber-900/80 font-medium">
                Pencapaian kecil & hal yang disyukuri
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-amber-900 bg-white/60 px-2.5 py-1 rounded-full">
            {currentWins.length} Wins
          </span>
        </div>

        {/* Input Form for New Win */}
        <form onSubmit={handleAddWin} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ketik pencapaian atau rasa syukur..."
            value={newWinText}
            onChange={(e) => setNewWinText(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-2xl bg-white/85 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white border border-white transition-all"
          />
          <button
            type="submit"
            disabled={!newWinText.trim()}
            className="w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 transition-all flex-shrink-0 active:scale-95 shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* Daily Wins List */}
        <div className="space-y-2">
          {currentWins.length === 0 ? (
            <div className="bg-white/60 rounded-2xl p-4 text-center text-xs text-slate-500 italic">
              Belum ada pencapaian dicatat untuk tanggal ini. Catat satu kemenangan kecil hari ini! ✨
            </div>
          ) : (
            currentWins.map((win, index) => (
              <div
                key={index}
                className="bg-white/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-2xs border border-white/70 animate-in fade-in duration-150"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5] flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 leading-snug break-words">
                    {win}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveWin(index)}
                  className="w-6 h-6 rounded-full text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Hapus pencapaian"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CARD 2: QUICK NOTES & REFLECTION (Lavender `#D7D9FE`) */}
      <QuickNotesCard
        key={`${selectedDate}-${dailyLog?.id ?? 'empty'}`}
        initialNotes={dailyLog?.quickNotes || ''}
        onSave={handleSaveNotes}
      />
    </div>
  )
}
