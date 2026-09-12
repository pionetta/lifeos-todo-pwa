import { useState, useEffect } from 'react'
import MobileShell, { type NavTab } from './components/layout/MobileShell'
import BentoDashboard from './components/dashboard/BentoDashboard'
import TodoModule from './components/todo/TodoModule'
import WishlistModule from './components/wishlist/WishlistModule'
import DailyNotesModule from './components/notes/DailyNotesModule'
import ProfileModule from './components/profile/ProfileModule'
import WelcomeView from './components/auth/WelcomeView'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { initTodoNotificationChecker } from './utils/notifications'
import { registerBackgroundSyncListeners, pullCloudData, runFullSync } from './services/syncService'
import { supabase } from './lib/supabase'

import ProfileSetupModal from './components/auth/ProfileSetupModal'

function MainContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard')
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const { user, session, loading } = useAuth()

  // Periksa apakah profil pengguna baru perlu dilengkapi (pertama kali login via Google dsb.)
  useEffect(() => {
    if (user?.id) {
      const isSetupCompleted =
        Boolean(user.user_metadata?.profile_setup_completed) ||
        localStorage.getItem(`lifeos_profile_setup_${user.id}`) === 'true'
      
      if (!isSetupCompleted) {
        setShowProfileSetup(true)
      }
    }
  }, [user?.id, user?.user_metadata?.profile_setup_completed])

  // Tangani kembalinya sesi OAuth dari URL (hash token atau query code)
  useEffect(() => {
    const hasAuthHash =
      window.location.hash.includes('access_token=') ||
      window.location.hash.includes('error=')
    const hasAuthQuery = window.location.search.includes('code=')

    if (hasAuthHash || hasAuthQuery) {
      supabase.auth.getSession().then(({ data: { session: oauthSession }, error }) => {
        if (oauthSession) {
          console.info('[LifeOS] Sesi login Google berhasil dideteksi dan diaktifkan.')
        } else if (error) {
          console.warn('[LifeOS] Callback OAuth error:', error.message)
        }
        // Bersihkan token hash & query dari URL address bar tanpa reload
        if (window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      })
    }
  }, [])

  useEffect(() => {
    // Tarik data akun dari Supabase jika user sudah login
    if (user?.id) {
      pullCloudData(user.id).then((res) => {
        if (res.pulledCount > 0) {
          console.info(`[LifeOS] Data akun ${user.email} berhasil ditarik: ${res.pulledCount} item`)
        }
        runFullSync(user.id)
      })
    }

    // Inisialisasi background service (pengingat to-do & sinkronisasi otomatis)
    const cleanupNotifications = initTodoNotificationChecker(60000)
    const cleanupSync = registerBackgroundSyncListeners(5 * 60 * 1000)

    return () => {
      cleanupNotifications()
      cleanupSync()
    }
  }, [user?.id, user?.email])

  // Loading spinner minimal saat inisialisasi sesi awal Supabase
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5FA] flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // =========================================================================
  // STRICT AUTHENTICATION GATE
  // =========================================================================
  // JIKA BELUM LOGIN (!session || !user):
  // Aplikasi HANYA boleh menampilkan WelcomeView (Halaman Utama).
  // Jangan render MobileShell, floating bottom nav bar, ataupun dashboard to-do.
  if (!session || !user) {
    return <WelcomeView />
  }

  // JIKA SUDAH LOGIN (session valid):
  // Langsung buka antarmuka aplikasi penuh (MobileShell)
  return (
    <>
      <MobileShell activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'dashboard' && <BentoDashboard onNavigate={setActiveTab} />}
        {activeTab === 'todo' && <TodoModule />}
        {activeTab === 'wishlist' && <WishlistModule />}
        {activeTab === 'notes' && <DailyNotesModule />}
        {activeTab === 'account' && <ProfileModule />}
      </MobileShell>

      {/* MODAL SETUP PROFIL PERTAMA KALI (GOOGLE OAUTH / ONBOARDING) */}
      <ProfileSetupModal
        isOpen={showProfileSetup}
        onComplete={() => setShowProfileSetup(false)}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  )
}
