import React, { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Sparkles,
  MapPin,
  ShoppingBag,
  Plus,
  Trash2,
  Coins,
  Calendar,
  X,
  TrendingUp,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { db, type Wishlist } from '../../db'
import { pushLocalData, deleteWishlistFromCloud } from '../../services/syncService'

export default function WishlistModule() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'place' | 'item'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form states for new wishlist
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'place' | 'item'>('place')
  const [targetCost, setTargetCost] = useState('')
  const [currentSaved, setCurrentSaved] = useState('')
  const [notes, setNotes] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Live Query from Dexie
  const wishlists = useLiveQuery(() => db.wishlists.toArray(), []) || []

  // Seed sample initial wishlist data if database is empty & not initialized yet
  useEffect(() => {
    const seedWishlists = async () => {
      const initialized = localStorage.getItem('lifeos_wishlists_initialized')
      if (!initialized) {
        const count = await db.wishlists.count()
        if (count === 0) {
          const now = new Date().toISOString()
          await db.wishlists.bulkAdd([
            {
              title: 'Liburan ke Kyoto & Tokyo',
              type: 'place',
              targetCost: 25000000,
              currentSaved: 20000000,
              targetDate: '2026-11-20',
              notes: 'Tiket pesawat PP, hotel ryokan & JR Pass',
              synced: false,
              createdAt: now,
              updatedAt: now,
            },
            {
              title: 'MacBook Pro M4',
              type: 'item',
              targetCost: 24000000,
              currentSaved: 18000000,
              targetDate: '2026-12-15',
              notes: 'Untuk pengembangan software & editing video',
              synced: false,
              createdAt: now,
              updatedAt: now,
            },
            {
              title: 'Ekspedisi Gunung Rinjani',
              type: 'place',
              targetCost: 6000000,
              currentSaved: 2500000,
              targetDate: '2027-05-10',
              notes: 'Peralatan camping, logistik & porter',
              synced: false,
              createdAt: now,
              updatedAt: now,
            },
          ])
        }
        localStorage.setItem('lifeos_wishlists_initialized', 'true')
      }
    }
    seedWishlists()
  }, [])

  // Format IDR Rupiah
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  // Kalkulator estimasi sisa hari & target tabungan
  const calculateSavingsPace = (item: Wishlist) => {
    if (!item.targetDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(item.targetDate)
    target.setHours(0, 0, 0, 0)

    const diffTime = target.getTime() - today.getTime()
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const remainingCost = Math.max(0, item.targetCost - item.currentSaved)

    if (remainingCost <= 0) return { daysLeft, text: 'Target tercapai!' }
    if (daysLeft <= 0) return { daysLeft: 0, text: 'Telah melewati target waktu' }

    const dailyNeeded = Math.ceil(remainingCost / daysLeft)
    const monthlyNeeded = daysLeft >= 30 ? Math.ceil(remainingCost / (daysLeft / 30)) : null

    return {
      daysLeft,
      dailyNeeded,
      monthlyNeeded,
      text: `Sisa ${daysLeft} hari • Nabung ${formatCurrency(dailyNeeded)}/hari${
        monthlyNeeded ? ` (~${formatCurrency(monthlyNeeded)}/bln)` : ''
      }`,
    }
  }

  // Metrics Calculation
  const totalTarget = wishlists.reduce((acc, item) => acc + item.targetCost, 0)
  const totalSaved = wishlists.reduce((acc, item) => acc + item.currentSaved, 0)
  const totalRemaining = Math.max(0, totalTarget - totalSaved)
  const overallPercentage =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0

  // Filtered Items
  const filteredWishlists =
    activeFilter === 'all'
      ? wishlists
      : wishlists.filter((item) => item.type === activeFilter)


  // Quick action: Add savings & sync to Supabase
  const handleAddSavings = async (item: Wishlist, amount: number) => {
    if (!item.id) return
    const updatedAmount = Math.min(item.targetCost, item.currentSaved + amount)
    await db.wishlists.update(item.id, {
      currentSaved: updatedAmount,
      synced: 0,
      updatedAt: new Date().toISOString(),
    })
    pushLocalData().catch(() => {})
  }

  // Delete item from Dexie & Supabase
  const handleDeleteItem = async (id?: number) => {
    if (!id) return
    await db.wishlists.delete(id)
    deleteWishlistFromCloud(id).catch(() => {})
  }

  // Handle Add Form Submit
  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !targetCost) return

    try {
      setIsSubmitting(true)
      const costNum = parseFloat(targetCost.replace(/[^0-9]/g, '')) || 0
      const savedNum = parseFloat(currentSaved.replace(/[^0-9]/g, '')) || 0
      const now = new Date().toISOString()

      await db.wishlists.add({
        title: title.trim(),
        type,
        targetCost: costNum,
        currentSaved: Math.min(costNum, savedNum),
        notes: notes.trim() || undefined,
        targetDate: targetDate || undefined,
        synced: 0,
        createdAt: now,
        updatedAt: now,
      })
      pushLocalData().catch(() => {})

      // Reset
      setTitle('')
      setTargetCost('')
      setCurrentSaved('')
      setNotes('')
      setTargetDate('')
      setIsModalOpen(false)
    } catch (err) {
      console.error('Gagal menambahkan wishlist:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 pt-1">
      {/* HERO SUMMARY CARD (Mint / Teal `#D5F2EB`) */}
      <section className="bg-[#D5F2EB] rounded-3xl p-5 shadow-xs text-[#18181B] relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/25 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm text-xs font-semibold text-teal-900">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Savings & Wishlist Tracker</span>
          </span>
          <span className="text-xs font-bold text-teal-900 bg-white/60 px-2.5 py-1 rounded-full">
            {overallPercentage}% Terkumpul
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs text-teal-900/80 font-medium">Total Tabungan Terkumpul</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-black text-[#18181B]">
              {formatCurrency(totalSaved)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mt-1">
            <span>Target: {formatCurrency(totalTarget)}</span>
            <span className="text-teal-950 font-bold">
              Sisa: {formatCurrency(totalRemaining)}
            </span>
          </div>

          {/* Overall Visual Progress Bar */}
          <div className="w-full bg-white/60 h-2.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-teal-700 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* FILTER TABS & ADD BUTTON */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-full text-xs font-bold">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Semua ({wishlists.length})
          </button>
          <button
            onClick={() => setActiveFilter('place')}
            className={`px-3 py-1 rounded-full transition-all ${
              activeFilter === 'place'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Destinasi ({wishlists.filter((w) => w.type === 'place').length})
          </button>
          <button
            onClick={() => setActiveFilter('item')}
            className={`px-3 py-1 rounded-full transition-all ${
              activeFilter === 'item'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Barang ({wishlists.filter((w) => w.type === 'item').length})
          </button>
        </div>

        {/* Add Wishlist Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-8 px-3 rounded-full bg-[#18181B] text-white text-xs font-bold flex items-center gap-1 hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Tambah</span>
        </button>
      </div>

      {/* WISHLIST CARDS LIST */}
      <div className="space-y-3">
        {filteredWishlists.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center text-xs text-slate-400 border border-slate-100">
            Belum ada item pada kategori ini. Tekan tombol <span className="font-bold text-slate-600">+ Tambah</span> untuk membuat target baru!
          </div>
        ) : (
          filteredWishlists.map((item) => {
            const isPlace = item.type === 'place'
            const itemPercent =
              item.targetCost > 0
                ? Math.min(100, Math.round((item.currentSaved / item.targetCost) * 100))
                : 0
            const remaining = Math.max(0, item.targetCost - item.currentSaved)
            const isAchieved = item.currentSaved >= item.targetCost
            const pace = calculateSavingsPace(item)

            return (
              <div
                key={item.id}
                className={`rounded-3xl p-4.5 shadow-2xs border transition-all ${
                  isPlace
                    ? 'bg-[#F4FBF9] border-teal-100'
                    : 'bg-[#FFF6F6] border-rose-100'
                }`}
              >
                {/* Top Row: Icon, Title & Percentage */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isPlace
                          ? 'bg-[#D5F2EB] text-teal-800'
                          : 'bg-[#FEDCDC] text-rose-800'
                      }`}
                    >
                      {isPlace ? (
                        <MapPin className="w-5 h-5 stroke-[2.2]" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#18181B] leading-tight">
                        {item.title}
                      </h3>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {item.notes}
                        </p>
                      )}
                      {item.targetDate && (
                        <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>Target: {item.targetDate}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                        isAchieved
                          ? 'bg-emerald-100 text-emerald-800 flex items-center gap-1'
                          : isPlace
                          ? 'bg-teal-100 text-teal-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {isAchieved && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                      <span>{itemPercent}%</span>
                    </span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="w-7 h-7 rounded-full text-slate-400 hover:text-rose-600 hover:bg-white flex items-center justify-center transition-colors"
                      title="Hapus Wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Middle Row: Numbers & Progress Bar */}
                <div className="mt-3 bg-white/75 backdrop-blur-xs rounded-2xl p-3 border border-white/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Terkumpul
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {formatCurrency(item.currentSaved)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Target Biaya
                      </span>
                      <span className="font-extrabold text-slate-700">
                        {formatCurrency(item.targetCost)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAchieved
                          ? 'bg-emerald-500'
                          : isPlace
                          ? 'bg-teal-600'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${itemPercent}%` }}
                    ></div>
                  </div>

                  {/* Remaining Cost Notice */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-slate-500">
                      {isAchieved ? (
                        <span className="text-emerald-700 font-bold">
                          🎉 Target tabungan sudah tercapai!
                        </span>
                      ) : (
                        `Sisa dana: ${formatCurrency(remaining)}`
                      )}
                    </span>
                  </div>

                  {/* Savings Pace & Target Estimation Badge */}
                  {pace && !isAchieved && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl bg-slate-100/90 text-slate-700 mt-1.5">
                      <Clock className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                      <span className="leading-tight">{pace.text}</span>
                    </div>
                  )}
                </div>

                {/* Quick Action: Tambah Tabungan (+50k, +100k, +500k) */}
                {!isAchieved && (
                  <div className="mt-2.5 flex items-center justify-between gap-1.5 text-xs">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-500" />
                      <span>Tabung:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddSavings(item, 50000)}
                        className="px-2.5 py-1 rounded-full bg-white text-slate-800 font-bold text-[11px] hover:bg-slate-900 hover:text-white transition-all shadow-2xs border border-slate-200/60 active:scale-95"
                      >
                        +50rb
                      </button>
                      <button
                        onClick={() => handleAddSavings(item, 100000)}
                        className="px-2.5 py-1 rounded-full bg-white text-slate-800 font-bold text-[11px] hover:bg-slate-900 hover:text-white transition-all shadow-2xs border border-slate-200/60 active:scale-95"
                      >
                        +100rb
                      </button>
                      <button
                        onClick={() => handleAddSavings(item, 500000)}
                        className="px-2.5 py-1 rounded-full bg-white text-slate-800 font-bold text-[11px] hover:bg-slate-900 hover:text-white transition-all shadow-2xs border border-slate-200/60 active:scale-95"
                      >
                        +500rb
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* CREATE WISHLIST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-[400px] max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#D5F2EB] flex items-center justify-center text-teal-800">
                  <TrendingUp className="w-4 h-4 stroke-[2.2]" />
                </span>
                <h2 className="text-base font-extrabold text-[#18181B]">
                  Tambah Target Wishlist
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup"
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateWishlist} className="space-y-3.5">
              {/* Type Switcher */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Tipe Impian</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setType('place')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      type === 'place'
                        ? 'bg-[#D5F2EB] text-teal-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Destinasi (Tempat)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('item')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      type === 'item'
                        ? 'bg-[#FEDCDC] text-rose-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Barang Impian</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">
                  Nama {type === 'place' ? 'Destinasi' : 'Barang'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    type === 'place' ? 'Contoh: Liburan ke Bali' : 'Contoh: iPhone 16 Pro'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* Target Cost & Current Saved */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Target Biaya (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="25000000"
                    value={targetCost}
                    onChange={(e) => setTargetCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Terkumpul Awal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentSaved}
                    onChange={(e) => setCurrentSaved(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Target Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">
                  Target Tanggal Capaian (Opsional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Catatan / Rincian</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kebutuhan atau prioritas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 active:scale-98 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !targetCost}
                  className="flex-1 py-2.5 rounded-2xl bg-[#18181B] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 active:scale-98 transition-all shadow-sm"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Wishlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
