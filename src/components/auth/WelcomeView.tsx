import { useState } from 'react'
import {
  Sparkles,
  CheckCircle2,
  Heart,
  Calendar,
  Trophy,
  ShieldCheck,
  Zap,
  LogIn,
  UserPlus,
  FlaskConical,
  RefreshCw
} from 'lucide-react'
import AuthModal from './AuthModal'
import { useAuth } from '../../context/useAuth'

interface WelcomeViewProps {
  onAuthSuccess?: (email: string) => void
}

export default function WelcomeView({
  onAuthSuccess,
}: WelcomeViewProps) {
  const { loginAsDemoUser, signInWithGoogle } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const handleQuickDemo = async () => {
    setIsDemoLoading(true)
    try {
      await loginAsDemoUser()
      onAuthSuccess?.('demo@lifeos.local')
    } catch (err) {
      console.error('Gagal masuk akun demo:', err)
    } finally {
      setIsDemoLoading(false)
    }
  }

  const handleQuickGoogle = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Gagal inisialisasi login Google:', err)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5FA] flex justify-center text-[#18181B] antialiased">
      {/* Mobile Screen Container */}
      <div className="w-full max-w-[430px] min-h-screen flex flex-col justify-between bg-[#F8F9FD] p-6 shadow-xl border-x border-slate-100/80 relative">
        
        {/* TOP BRANDING & INTRO */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/icon-todo-app.svg"
                alt="LifeOS App Icon"
                className="w-10 h-10 rounded-2xl shadow-sm object-cover"
              />
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#18181B]">
                  Life<span className="text-indigo-600">OS</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Personal Life Organizer
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-bold">
              <Zap className="w-3 h-3" />
              <span>Offline-First</span>
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <h2 className="text-2xl font-black tracking-tight text-[#18181B] leading-tight">
              Organisir Harimu, Raih Impianmu ✨
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Aplikasi personal life-tracker cerdas dengan manajemen to-do multi-scope, kalkulator tabungan wishlist, dan log pencapaian harian.
            </p>
          </div>

          {/* BENTO FEATURE PREVIEW SHOWCASE */}
          <div className="space-y-2.5 pt-1">
            {/* Bento 1: Hero Progress Preview (Soft Iris) */}
            <div className="bg-[#D7D9FE] rounded-3xl p-4 shadow-2xs flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 text-[10px] font-bold text-[#3538CD]">
                  <Sparkles className="w-3 h-3" />
                  <span>Daily Focus</span>
                </span>
                <p className="text-sm font-black text-[#18181B]">
                  Target Harian 85% Selesai
                </p>
                <p className="text-[11px] text-slate-600 font-semibold">
                  11 dari 13 to-do tercapai hari ini
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center text-[#3538CD] shadow-xs flex-shrink-0">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
            </div>

            {/* Bento Grid 2 Kolom Mini */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Card A: Wishlist Calculator (Mint) */}
              <div className="bg-[#D5F2EB] rounded-3xl p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-teal-800">
                    <Heart className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/60 text-teal-900">
                    74%
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#18181B]">Wishlist Calculator</h3>
                  <p className="text-[10px] text-slate-600 mt-0.5">Estimasi sisa & tempo</p>
                </div>
              </div>

              {/* Card B: Daily Wins Log (Peach) */}
              <div className="bg-[#FDEFD9] rounded-3xl p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-amber-800">
                    <Trophy className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/60 text-amber-900">
                    3 Wins
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#18181B]">Daily Wins & Notes</h3>
                  <p className="text-[10px] text-slate-600 mt-0.5">Refleksi micro-habits</p>
                </div>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex items-center justify-around p-2.5 rounded-2xl bg-white/80 border border-slate-100 text-[11px] font-semibold text-slate-600 shadow-2xs">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>IndexedDB Lokal</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sync Kalender</span>
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="space-y-2.5 pt-4 pb-2">
          {/* 1. Tombol Lanjutkan dengan Google */}
          <button
            onClick={handleQuickGoogle}
            disabled={isGoogleLoading || isDemoLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white text-slate-700 border border-slate-200/80 text-xs font-bold flex items-center justify-center gap-2.5 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-2xs disabled:opacity-60"
          >
            {isGoogleLoading ? (
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

          {/* 2. Tombol Masuk Email & Daftar Baru */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => openAuth('login')}
              className="py-3 rounded-2xl bg-[#18181B] text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Masuk Email</span>
            </button>

            <button
              onClick={() => openAuth('register')}
              className="py-3 rounded-2xl bg-white text-slate-700 border border-slate-200/80 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2]" />
              <span>Daftar Baru</span>
            </button>
          </div>

          {/* Tombol Cepat: Akun Demo (Tester Mode) */}
          <button
            onClick={handleQuickDemo}
            disabled={isDemoLoading || isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#5B21B6] text-xs font-bold flex items-center justify-between transition-all active:scale-98 border border-[#DDD6FE]/70 shadow-2xs disabled:opacity-60"
          >
            <div className="flex items-center gap-2">
              {isDemoLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FlaskConical className="w-3.5 h-3.5 text-[#6D28D9]" />
              )}
              <span>Coba dengan Akun Demo</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-black text-[#6D28D9] shadow-2xs uppercase tracking-wider">
              Tester Mode
            </span>
          </button>

          <div className="text-center pt-1">
            <p className="text-[10px] text-slate-400 font-medium">
              Akses akun aman & sinkronisasi cloud real-time via Supabase
            </p>
          </div>
        </div>

      </div>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={(email) => onAuthSuccess?.(email)}
      />
    </div>
  )
}
