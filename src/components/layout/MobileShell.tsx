import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  CheckSquare,
  Heart,
  FileText,
  User,
  Wifi,
  WifiOff,
  Bell,
  Search
} from 'lucide-react'
import QuickSearchModal from '../search/QuickSearchModal'

export type NavTab = 'dashboard' | 'todo' | 'wishlist' | 'notes' | 'account'

interface MobileShellProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
  children: React.ReactNode
}

export default function MobileShell({
  activeTab,
  onTabChange,
  children,
}: MobileShellProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
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

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Beranda', icon: LayoutDashboard },
    { id: 'todo' as NavTab, label: 'Tugas', icon: CheckSquare },
    { id: 'wishlist' as NavTab, label: 'Wishlist', icon: Heart },
    { id: 'notes' as NavTab, label: 'Catatan', icon: FileText },
    { id: 'account' as NavTab, label: 'Akun', icon: User },
  ]

  return (
    <div className="min-h-screen bg-[#F4F5FA] flex justify-center text-[#18181B] antialiased">
      {/* Mobile Frame (Optimized for iPhone / Android viewports, max-w-[430px]) */}
      <div className="w-full max-w-[430px] min-h-screen flex flex-col bg-[#F8F9FD] shadow-xl border-x border-slate-100/80 relative">
        
        {/* TOP STATUS & APP BAR */}
        <header className="sticky top-0 z-40 bg-[#F8F9FD]/85 backdrop-blur-md px-5 pt-3 pb-2.5 border-b border-slate-200/40">
          <div className="flex items-center justify-between">
            {/* User Profile & Greeting */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-400 p-[2px] shadow-sm">
                  <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center font-bold text-slate-700 text-xs">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <span>UD</span>
                  </div>
                </div>
                {/* Real-time Connection Dot */}
                <span
                  title={isOnline ? 'Online' : 'Offline'}
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold tracking-tight text-[#18181B]">
                    Hello, Udi!
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
                aria-label="Pencarian"
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-95 transition-all"
              >
                <Search className="w-4 h-4 stroke-[2.2]" />
              </button>
              <button
                aria-label="Notifikasi"
                className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-95 transition-all relative"
              >
                <Bell className="w-4 h-4 stroke-[2.2]" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>
        </header>

        {/* SCROLLABLE TAB CONTENT */}
        <main className="flex-1 px-5 pt-3 pb-32 overflow-y-auto">
          {children}
        </main>

        {/* FLOATING BOTTOM NAVIGATION BAR (Frosted Glass Pill with Safe Area) */}
        <nav className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[390px] z-50">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-white/60 flex items-center justify-around">
            {navItems.map((item) => {
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
                  <span className="text-[11px] leading-none tracking-tight">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 w-1 h-1 bg-[#18181B] rounded-full"></span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* QUICK SEARCH MODAL */}
        <QuickSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={onTabChange}
        />

      </div>
    </div>
  )
}
