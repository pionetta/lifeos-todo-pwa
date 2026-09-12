import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  CheckSquare,
  Heart,
  FileText,
  Wifi,
  WifiOff,
  Search,
  Settings,
  Plus
} from 'lucide-react'
import QuickSearchModal from '../search/QuickSearchModal'
import SettingsView from '../settings/SettingsView'
import { useAuth } from '../../context/useAuth'

export type NavTab = 'dashboard' | 'todo' | 'wishlist' | 'notes'

interface MobileShellProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
  onCenterCtaClick?: () => void
  children: React.ReactNode
}

export default function MobileShell({
  activeTab,
  onTabChange,
  onCenterCtaClick,
  children,
}: MobileShellProps) {
  const { user } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const leftNavItems = [
    { id: 'dashboard' as NavTab, label: 'Beranda', icon: LayoutDashboard },
    { id: 'todo' as NavTab, label: 'Tugas', icon: CheckSquare },
  ]

  const rightNavItems = [
    { id: 'wishlist' as NavTab, label: 'Wishlist', icon: Heart },
    { id: 'notes' as NavTab, label: 'Catatan', icon: FileText },
  ]

  // User details from metadata
  const meta = user?.user_metadata || {}
  const rawName = meta.full_name || meta.name || (user?.email ? user.email.split('@')[0] : 'Sobat')
  const userFirstName = rawName.split(' ')[0] || rawName
  const userAvatar = meta.avatar_url || meta.picture || ''
  const userInitial = userFirstName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#F4F5FA] flex justify-center text-[#18181B] antialiased">
      {/* Mobile Frame (Optimized for iPhone / Android viewports, max-w-[430px]) */}
      <div className="w-full max-w-[430px] min-h-screen flex flex-col bg-[#F8F9FD] shadow-xl border-x border-slate-100/80 relative">
        
        {/* TOP STATUS & APP BAR */}
        <header className="sticky top-0 z-40 bg-[#F8F9FD]/85 backdrop-blur-md px-5 pt-3 pb-2.5 border-b border-slate-200/40">
          <div className="flex items-center justify-between">
            {/* User Profile & Greeting */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Buka Pengaturan & Akun"
                className="relative active:scale-95 transition-transform text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-400 p-[2px] shadow-sm">
                  <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center font-black text-indigo-900 text-xs">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userFirstName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                </div>
                {/* Real-time Connection Dot */}
                <span
                  title={isOnline ? 'Online' : 'Offline'}
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </button>

              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold tracking-tight text-[#18181B]">
                    Hello, {userFirstName}!
                  </h1>
                  <span className="text-xs">✨</span>
                </div>
                {/* Real-time Status Badge */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isOnline
                        ? 'bg-emerald-100/80 text-emerald-800'
                        : 'bg-amber-100/90 text-amber-800'
                    }`}
                  >
                    {isOnline ? (
                      <>
                        <Wifi className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>Offline (Lokal)</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Action Icons */}
            <div className="flex items-center gap-2">
              <button
                aria-label="Pencarian Cepat"
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
              >
                <Search className="w-4 h-4 stroke-[2.2]" />
              </button>
              {/* TOMBOL PENGATURAN (GANTIKAN NOTIFIKASI) */}
              <button
                aria-label="Pengaturan"
                onClick={() => setIsSettingsOpen(true)}
                className={`w-9 h-9 rounded-full bg-white shadow-xs border flex items-center justify-center transition-all active:scale-95 ${
                  isSettingsOpen
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200/60 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT (PENGATURAN ATAU TAB UTAMA) */}
        <main className="flex-1 px-5 pt-3 pb-32 overflow-y-auto">
          {isSettingsOpen ? (
            <SettingsView onClose={() => setIsSettingsOpen(false)} />
          ) : (
            children
          )}
        </main>

        {/* FLOATING BOTTOM NAVIGATION BAR (HANYA DITAMPILKAN JIKA BUKAN DI HALAMAN PENGATURAN) */}
        {!isSettingsOpen && (
          <nav className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[390px] z-50">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-white/60 flex items-center justify-between relative">
              
              {/* LEFT 2 ITEMS: BERANDA & TUGAS */}
              <div className="flex-1 flex items-center justify-around">
                {leftNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      aria-label={item.label}
                      className={`flex-1 py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                        isActive
                          ? 'text-[#18181B] font-bold scale-102 bg-slate-100/70'
                          : 'text-slate-400 hover:text-slate-600 font-medium'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isActive ? 'stroke-[2.5] scale-110' : 'stroke-[2]'
                        }`}
                      />
                      <span className="text-[10px] leading-none tracking-tight">
                        {item.label}
                      </span>
                      {isActive && (
                        <span className="absolute bottom-1 w-1 h-1 bg-[#18181B] rounded-full"></span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* CENTER FLOATING CTA (+) BUTTON */}
              <div className="px-1 flex-shrink-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={onCenterCtaClick}
                  aria-label="Aksi Tambah Cepat"
                  className="relative -top-4 w-12 h-12 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(24,24,27,0.35)] hover:bg-slate-800 active:scale-90 transition-all duration-200 border-3 border-[#F8F9FD] group"
                >
                  <Plus className="w-6 h-6 text-white stroke-[2.8] transition-transform duration-200 group-hover:rotate-90" />
                </button>
              </div>

              {/* RIGHT 2 ITEMS: WISHLIST & CATATAN */}
              <div className="flex-1 flex items-center justify-around">
                {rightNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      aria-label={item.label}
                      className={`flex-1 py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                        isActive
                          ? 'text-[#18181B] font-bold scale-102 bg-slate-100/70'
                          : 'text-slate-400 hover:text-slate-600 font-medium'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isActive ? 'stroke-[2.5] scale-110' : 'stroke-[2]'
                        }`}
                      />
                      <span className="text-[10px] leading-none tracking-tight">
                        {item.label}
                      </span>
                      {isActive && (
                        <span className="absolute bottom-1 w-1 h-1 bg-[#18181B] rounded-full"></span>
                      )}
                    </button>
                  )
                })}
              </div>

            </div>
          </nav>
        )}

        {/* QUICK SEARCH MODAL */}
        <QuickSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={(tab) => {
            setIsSettingsOpen(false)
            onTabChange(tab)
          }}
        />

      </div>
    </div>
  )
}
