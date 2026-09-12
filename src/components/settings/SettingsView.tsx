import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertCircle,
  Download,
  Server,
  Zap,
  LogOut,
  UserCheck,
  FlaskConical,
  Edit3,
  CloudDownload,
  CloudUpload,
  Trash2,
  RotateCcw,
  CheckSquare,
  Heart,
  FileText,
  ShieldCheck
} from 'lucide-react'
import { supabaseUrl, isSupabaseConfigured, supabase } from '../../lib/supabase'
import { db } from '../../db'
import { useAuth } from '../../context/useAuth'
import { requestNotificationPermission } from '../../utils/notifications'
import { pullCloudData, pushLocalData, runFullSync } from '../../services/syncService'
import ProfileSetupModal from '../auth/ProfileSetupModal'

interface SettingsViewProps {
  onClose: () => void
}

export default function SettingsView({ onClose }: SettingsViewProps) {
  const { user, signOut, isDemo } = useAuth()
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)

  // Notification states
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  )
  const [isReminderEnabled, setIsReminderEnabled] = useState<boolean>(() => {
    return localStorage.getItem('lifeos_reminder_enabled') !== 'false'
  })

  // Sync states
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Live Query database statistics
  const dbStats = useLiveQuery(async () => {
    const [todos, wishlists, logs] = await Promise.all([
      db.todos.count(),
      db.wishlists.count(),
      db.dailyLogs.count(),
    ])
    return { todos, wishlists, logs }
  }, []) || { todos: 0, wishlists: 0, logs: 0 }

  // Connection ping state
  const [pingStatus, setPingStatus] = useState<'connected' | 'checking' | 'error'>(
    isSupabaseConfigured ? 'connected' : 'error'
  )

  // User metadata
  const meta = user?.user_metadata || {}
  const userName = meta.full_name || meta.name || (user?.email ? user.email.split('@')[0] : 'Pengguna LifeOS')
  const userAvatar = meta.avatar_url || meta.picture || ''
  const userInitial = userName ? userName.slice(0, 2).toUpperCase() : 'OS'

  // Toggle Reminder
  const handleToggleReminder = () => {
    const nextState = !isReminderEnabled
    setIsReminderEnabled(nextState)
    localStorage.setItem('lifeos_reminder_enabled', nextState ? 'true' : 'false')
  }

  // Handle Logout
  const handleLogout = async () => {
    setIsSyncing(true)
    try {
      await signOut()
      onClose()
    } catch (err) {
      console.warn('Gagal logout:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  // Pull from Cloud
  const handleManualPull = async () => {
    if (!user) return
    setIsSyncing(true)
    setSyncStatus(null)

    try {
      const res = await pullCloudData(user.id)
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))

      if (res.error) {
        setSyncStatus({ type: 'error', message: `Gagal menarik data: ${res.error}` })
      } else {
        setSyncStatus({
          type: 'success',
          message: `Berhasil menarik ${res.pulledCount} data dari cloud!`,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menarik data'
      setSyncStatus({ type: 'error', message: msg })
    } finally {
      setIsSyncing(false)
    }
  }

  // Push to Cloud
  const handleManualPush = async () => {
    if (!user) return
    setIsSyncing(true)
    setSyncStatus(null)

    try {
      const res = await pushLocalData(user.id)
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))

      if (res.error) {
        setSyncStatus({ type: 'error', message: `Gagal mengunggah data: ${res.error}` })
      } else {
        setSyncStatus({
          type: 'success',
          message: `Berhasil mengunggah ${res.pushedCount} data lokal ke cloud!`,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah data'
      setSyncStatus({ type: 'error', message: msg })
    } finally {
      setIsSyncing(false)
    }
  }

  // Full Two-Way Sync
  const handleFullSync = async () => {
    if (!user) return
    setIsSyncing(true)
    setSyncStatus(null)

    try {
      const res = await runFullSync(user.id)
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))

      setSyncStatus({
        type: res.success ? 'success' : 'error',
        message: res.message,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal sinkronisasi'
      setSyncStatus({ type: 'error', message: msg })
    } finally {
      setIsSyncing(false)
    }
  }

  // Connection Ping Check
  const handleRefreshPing = () => {
    if (!isSupabaseConfigured) {
      setPingStatus('error')
      return
    }
    setPingStatus('checking')
    supabase
      .from('todos')
      .select('id')
      .limit(1)
      .then(
        () => setPingStatus('connected'),
        () => setPingStatus('error')
      )
  }

  // Request Notification Permission
  const handleRequestNotif = async () => {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
  }

  // Export JSON Backup
  const handleExportJson = async () => {
    const [todos, wishlists, dailyLogs] = await Promise.all([
      db.todos.toArray(),
      db.wishlists.toArray(),
      db.dailyLogs.toArray(),
    ])

    const backupData = {
      app: 'Personal Life OS',
      userEmail: user?.email || 'authenticated-user',
      exportedAt: new Date().toISOString(),
      data: { todos, wishlists, dailyLogs },
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `life_os_backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Clear Local Cache
  const handleClearLocalCache = async () => {
    const confirmed = window.confirm(
      'Bersihkan cache lokal? Data di Supabase cloud tetap aman dan dapat ditarik kembali.'
    )
    if (!confirmed) return

    setIsSyncing(true)
    try {
      localStorage.removeItem('lifeos_todos_initialized')
      localStorage.removeItem('lifeos_wishlists_initialized')
      localStorage.removeItem('lifeos_notes_initialized')
      setSyncStatus({
        type: 'info',
        message: 'Cache lokal berhasil dibersihkan.',
      })
    } catch (err) {
      console.warn('Gagal bersihkan cache:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex items-center gap-3 pt-1 pb-2 border-b border-slate-200/50">
        <button
          onClick={onClose}
          aria-label="Kembali"
          className="w-9 h-9 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shadow-2xs"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <div>
          <h1 className="text-lg font-black tracking-tight text-[#18181B]">
            Pengaturan & Akun
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">
            Kelola profil, sinkronisasi cloud, dan preferensi sistem
          </p>
        </div>
      </div>

      {/* SYNC STATUS TOAST */}
      {syncStatus && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200 ${
            syncStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
              : syncStatus.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200/60'
          }`}
        >
          {syncStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
          ) : syncStatus.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          ) : (
            <Zap className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
          )}
          <span className="leading-snug">{syncStatus.message}</span>
        </div>
      )}

      {/* KELOMPOK 1: AKUN & CLOUD (BENTO SOFT LAVENDER) */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Akun & Autentikasi</span>
          </div>
          {isDemo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black border border-purple-200">
              <FlaskConical className="w-3 h-3 text-purple-600" />
              <span>Demo Mode</span>
            </span>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between gap-3 bg-[#F8F9FD] p-3.5 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 p-[2px] shadow-sm flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-white overflow-hidden flex items-center justify-center font-black text-indigo-900 text-sm relative">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
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

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#18181B] truncate max-w-[170px]">
                  {userName}
                </h3>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                  title="Ubah Profil (Nama & Foto)"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                {user?.email || 'authenticated@user.local'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 disabled:opacity-50"
            title="Keluar dari Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Supabase Endpoint Indicator */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-500" />
            <div>
              <p className="font-bold text-slate-700">Endpoint Supabase Cloud</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
                {supabaseUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                pingStatus === 'connected'
                  ? 'bg-emerald-100 text-emerald-800'
                  : pingStatus === 'checking'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  pingStatus === 'connected'
                    ? 'bg-emerald-500'
                    : pingStatus === 'checking'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              <span>{pingStatus === 'connected' ? 'Terhubung' : pingStatus === 'checking' ? 'Cek...' : 'Error'}</span>
            </span>

            <button
              onClick={handleRefreshPing}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white active:scale-95"
              title="Ping Ulang"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* KELOMPOK 2: MANAJEMEN SINKRONISASI (BENTO STATS + ACTIONS) */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
            <span>Manajemen Sinkronisasi Cloud</span>
          </div>
          {lastSyncTime && (
            <span className="text-[10px] font-semibold text-slate-400">
              Sinkron: {lastSyncTime}
            </span>
          )}
        </div>

        {/* 3 Bento Cards for DB Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-[#D7D9FE]/60 rounded-2xl p-3 text-center space-y-0.5">
            <CheckSquare className="w-4 h-4 text-[#3538CD] mx-auto" />
            <p className="text-base font-black text-[#18181B]">{dbStats.todos}</p>
            <p className="text-[10px] font-bold text-slate-600">To-Do</p>
          </div>

          <div className="bg-[#D5F2EB]/70 rounded-2xl p-3 text-center space-y-0.5">
            <Heart className="w-4 h-4 text-teal-800 mx-auto" />
            <p className="text-base font-black text-[#18181B]">{dbStats.wishlists}</p>
            <p className="text-[10px] font-bold text-slate-600">Wishlists</p>
          </div>

          <div className="bg-[#FDEFD9] rounded-2xl p-3 text-center space-y-0.5">
            <FileText className="w-4 h-4 text-amber-800 mx-auto" />
            <p className="text-base font-black text-[#18181B]">{dbStats.logs}</p>
            <p className="text-[10px] font-bold text-slate-600">Catatan</p>
          </div>
        </div>

        {/* Action Buttons: Pull, Push, Full Sync */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleManualPull}
              disabled={isSyncing}
              className="py-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/80 flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-50"
            >
              <CloudDownload className="w-4 h-4 text-indigo-600" />
              <span>Tarik Cloud</span>
            </button>

            <button
              onClick={handleManualPush}
              disabled={isSyncing}
              className="py-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/80 flex items-center justify-center gap-1.5 active:scale-98 transition-all disabled:opacity-50"
            >
              <CloudUpload className="w-4 h-4 text-teal-600" />
              <span>Unggah Lokal</span>
            </button>
          </div>

          <button
            onClick={handleFullSync}
            disabled={isSyncing}
            className="w-full py-3 rounded-2xl bg-[#18181B] text-white text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-98 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : 'text-white'}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Dua Arah Penuh'}</span>
          </button>
        </div>
      </section>

      {/* KELOMPOK 3: NOTIFIKASI PENGINGAT (BENTO PEACH / WARM) */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Bell className="w-3.5 h-3.5 text-amber-600" />
          <span>Notifikasi Pengingat</span>
        </div>

        {/* Browser Notification Permission */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFF6EB] border border-[#FDEFD9]">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-amber-950">Izin Notifikasi Sistem</p>
            <p className="text-[11px] text-amber-800/80">
              {notifPermission === 'granted'
                ? 'Aktif (Browser siap menerima alarm deadline)'
                : 'Belum diizinkan oleh browser'}
            </p>
          </div>

          {notifPermission !== 'granted' ? (
            <button
              onClick={handleRequestNotif}
              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 active:scale-95 transition-all shadow-2xs"
            >
              Izinkan
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Aktif</span>
            </span>
          )}
        </div>

        {/* Toggle Daily Reminder */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-800">Pengingat Tugas Harian</p>
            <p className="text-[11px] text-slate-500">
              Kirim alarm berkala saat mendekati jam deadline tugas
            </p>
          </div>

          <button
            onClick={handleToggleReminder}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center ${
              isReminderEnabled ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                isReminderEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* KELOMPOK 4: BACKUP & DIAGNOSTIK */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Backup & Diagnostik</span>
        </div>

        <button
          onClick={handleExportJson}
          className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/80 flex items-center justify-between transition-all active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-indigo-600" />
            <div className="text-left">
              <p className="leading-snug">Ekspor Backup Data Lengkap (.json)</p>
              <p className="text-[10px] text-slate-400 font-normal">Unduh seluruh to-do, wishlist & catatan ke file lokal</p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400 rotate-180" />
        </button>

        <button
          onClick={handleClearLocalCache}
          className="w-full p-3.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200/60 flex items-center justify-between transition-all active:scale-98"
        >
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <div className="text-left">
              <p className="leading-snug">Bersihkan Cache & Refresh State</p>
              <p className="text-[10px] text-rose-600/70 font-normal">Mereset temporary cache tanpa menghapus data cloud</p>
            </div>
          </div>
          <Trash2 className="w-4 h-4 text-rose-500" />
        </button>
      </section>

      {/* FOOTER BADGE */}
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
        <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>Arsitektur Offline-First: Data tersimpan di IndexedDB lokal dan tersinkron ke cloud Supabase.</span>
      </div>

      {/* EDIT PROFILE MODAL */}
      <ProfileSetupModal
        isOpen={isEditProfileOpen}
        onComplete={() => setIsEditProfileOpen(false)}
      />
    </div>
  )
}
