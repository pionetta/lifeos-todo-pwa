import React, { useState } from 'react'
import {
  X,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Coins,
  FileText
} from 'lucide-react'
import { db } from '../../db'
import { pushLocalData } from '../../services/syncService'

interface AddWishlistModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddWishlistModal({
  isOpen,
  onClose,
  onSuccess,
}: AddWishlistModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'place' | 'item'>('place')
  const [targetCost, setTargetCost] = useState('')
  const [currentSaved, setCurrentSaved] = useState('')
  const [notes, setNotes] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !targetCost) return

    setIsSubmitting(true)
    try {
      const now = new Date().toISOString()
      await db.wishlists.add({
        title: title.trim(),
        type,
        targetCost: Number(targetCost),
        currentSaved: Number(currentSaved) || 0,
        notes: notes.trim() || undefined,
        targetDate: targetDate || undefined,
        synced: 0,
        createdAt: now,
        updatedAt: now,
      })

      pushLocalData().catch(() => {})

      // Reset form
      setTitle('')
      setTargetCost('')
      setCurrentSaved('')
      setNotes('')
      setTargetDate('')
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Gagal menambahkan wishlist:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
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
            onClick={onClose}
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
                <span>Barang (Gadget/Aset)</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Nama Impian *</label>
            <input
              type="text"
              required
              placeholder={type === 'place' ? 'Contoh: Liburan ke Raja Ampat' : 'Contoh: Laptop Kerja Baru'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition-all shadow-2xs"
            />
          </div>

          {/* Target Cost & Current Saved */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Target Biaya (Rp) *</label>
              <div className="relative">
                <Coins className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="10000000"
                  value={targetCost}
                  onChange={(e) => setTargetCost(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Tabungan Saat Ini (Rp)</label>
              <div className="relative">
                <Coins className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={currentSaved}
                  onChange={(e) => setCurrentSaved(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Target Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Target Tanggal Capaian</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Catatan / Detail Rencana</label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                placeholder="Rincian tiket, spesifikasi, atau strategi tabungan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-2xl bg-[#18181B] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
