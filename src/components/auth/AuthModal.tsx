import React, { useState } from 'react'
import {
  X,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../../context/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
  onSuccess: (email: string) => void
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}: AuthModalProps) {
  const { signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  if (!isOpen) return null

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setMessage(null)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setMessage({ type: 'error', text: error.message })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungkan Google'
      setMessage({ type: 'error', text: msg })
    } finally {
      setGoogleLoading(false)
    }
  }

  // Handle Form Submit (Email + Password)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setMessage(null)

    try {
      if (!isSupabaseConfigured) {
        setMessage({
          type: 'error',
          text: 'Konfigurasi Supabase belum terpasang di file .env.',
        })
        setLoading(false)
        return
      }

      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        if (data.session) {
          setMessage({
            type: 'success',
            text: 'Pendaftaran berhasil! Mengalihkan ke dashboard...',
          })
          setTimeout(() => {
            onSuccess(data.user?.email ?? email)
            onClose()
          }, 400)
        } else {
          setMessage({
            type: 'success',
            text: 'Pendaftaran berhasil! Silakan periksa inbox email untuk konfirmasi atau silakan login.',
          })
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        setMessage({ type: 'success', text: 'Berhasil masuk ke akun!' })
        setTimeout(() => {
          onSuccess(data.user?.email ?? email)
          onClose()
        }, 400)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan autentikasi'
      setMessage({ type: 'error', text: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-[400px] max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <img
              src="/icon-todo-app.svg"
              alt="LifeOS"
              className="w-8 h-8 rounded-xl shadow-2xs object-cover flex-shrink-0"
            />
            <h2 className="text-base font-extrabold text-[#18181B]">
              {mode === 'login' ? 'Masuk ke LifeOS' : 'Buat Akun Baru'}
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

        {/* 1. TOMBOL GOOGLE OAUTH */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 rounded-2xl bg-white text-slate-700 border border-slate-200/80 text-xs font-bold flex items-center justify-center gap-2.5 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-2xs disabled:opacity-60"
        >
          {googleLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>Lanjutkan dengan Google</span>
        </button>

        {/* Pembatas / Divider */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="border-t border-slate-200/70 w-full"></div>
          <span className="bg-white px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">
            atau dengan email
          </span>
        </div>

        {/* Mode Switcher: Masuk vs Daftar */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/90 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setMessage(null)
            }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setMessage(null)
            }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Daftar
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Email Pengguna *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Kata Sandi *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-start gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-rose-50 text-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{message.text}</span>
            </div>
          )}

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
              disabled={loading || googleLoading}
              className="flex-1 py-2.5 rounded-2xl bg-[#18181B] text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 active:scale-98 transition-all shadow-sm"
            >
              {loading
                ? 'Memproses...'
                : mode === 'login'
                ? 'Masuk'
                : 'Daftar Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
