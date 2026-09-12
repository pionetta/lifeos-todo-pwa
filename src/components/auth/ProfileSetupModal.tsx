import React, { useState } from 'react'
import {
  User,
  Camera,
  Trash2,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { compressAvatarImage } from '../../utils/image'

interface ProfileSetupModalProps {
  isOpen: boolean
  onComplete: () => void
}

export default function ProfileSetupModal({
  isOpen,
  onComplete,
}: ProfileSetupModalProps) {
  const { user, updateUserProfile } = useAuth()
  const meta = user?.user_metadata || {}
  const [fullName, setFullName] = useState(
    () => meta.full_name || meta.name || user?.email?.split('@')[0] || ''
  )
  const [avatarUrl, setAvatarUrl] = useState(
    () => meta.avatar_url || meta.picture || ''
  )
  const [loading, setLoading] = useState(false)
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen || !user) return null

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsProcessingAvatar(true)
    setErrorMsg(null)
    try {
      const base64 = await compressAvatarImage(file)
      setAvatarUrl(base64)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar foto'
      setErrorMsg(msg)
    } finally {
      setIsProcessingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setErrorMsg('Silakan masukkan nama Anda')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await updateUserProfile({
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      })

      if (res.error) {
        setErrorMsg(res.error.message)
      } else {
        onComplete()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan profil'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  const userInitial = fullName.trim()
    ? fullName.trim().slice(0, 2).toUpperCase()
    : 'ME'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="w-full max-w-[390px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Selamat Datang di LifeOS</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-[#18181B]">
            Lengkapi Profil Akunmu ✨
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Atur nama panggilan dan foto profilmu agar tampilan aplikasi terasa lebih personal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* FOTO PROFIL (OPSIONAL) */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 p-[3px] shadow-md">
                <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center font-black text-indigo-900 text-lg relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarUrl('')}
                    />
                  ) : (
                    <span className="tracking-wider">{userInitial}</span>
                  )}

                  {isProcessingAvatar && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Trigger Button */}
              <label
                htmlFor="setup-avatar-input"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-md hover:bg-indigo-600 active:scale-95 transition-all cursor-pointer"
                title="Ganti atau unggah foto"
              >
                <Camera className="w-4 h-4 stroke-[2.2]" />
                <input
                  id="setup-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">
                Foto Profil <span className="text-slate-400 font-normal">(Opsional)</span>
              </span>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>

          {/* INPUT NAMA */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>Nama Lengkap / Panggilan *</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Contoh: Udi / Rusdi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* ERROR FEEDBACK */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || isProcessingAvatar || !fullName.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-[#18181B] text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 active:scale-98 transition-all shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  <span>Simpan & Masuk ke LifeOS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
