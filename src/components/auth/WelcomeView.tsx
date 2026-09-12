import { useState } from 'react'
import { LogIn, UserPlus, RefreshCw } from 'lucide-react'
import AuthModal from './AuthModal'
import { useAuth } from '../../context/useAuth'

interface WelcomeViewProps {
  onAuthSuccess?: (email: string) => void
}

export default function WelcomeView({ onAuthSuccess }: WelcomeViewProps) {
  const { signInWithGoogle } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
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
    <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center text-[#18181B] antialiased p-4">
      {/* Compact Card Container */}
      <div className="w-full max-w-[390px] bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-100 flex flex-col justify-between space-y-6">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-3.5 pt-2">
          {/* App Icon */}
          <div className="inline-flex p-3 rounded-3xl bg-slate-50 border border-slate-100 shadow-xs">
            <img
              src="/icon-todo-app.svg"
              alt="LifeOS App Icon"
              className="w-14 h-14 rounded-2xl shadow-sm object-cover"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-[#18181B]">
              Life<span className="text-indigo-600">OS</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-[260px] mx-auto leading-relaxed">
              Organisir to-do harian, tabungan impian, dan catatan refleksi dalam satu aplikasi.
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-2.5">
          {/* Google OAuth Button */}
          <button
            onClick={handleQuickGoogle}
            disabled={isGoogleLoading}
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

          {/* Email Login & Register Buttons */}
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
              <span>Daftar Akun</span>
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center pt-1 border-t border-slate-100/80">
          <p className="text-[11px] text-slate-400 font-medium">
            Personal Life OS • Offline-First PWA
          </p>
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
