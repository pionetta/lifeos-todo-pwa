import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Database,
  CloudDownload,
  CloudUpload,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertCircle,
  Download,
  Server,
  Zap,
  Check,
  LogOut,
  UserCheck,
  FlaskConical,
  Edit3
} from 'lucide-react'
import { supabaseUrl, isSupabaseConfigured, supabase } from '../../lib/supabase'
import { db } from '../../db'
import { useAuth } from '../../context/useAuth'
import { requestNotificationPermission } from '../../utils/notifications'
import { pullCloudData, pushLocalData, runFullSync } from '../../services/syncService'
import ProfileSetupModal from '../auth/ProfileSetupModal'

export default function ProfileModule() {
  const { user, signOut, isDemo } = useAuth()
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)

  // Notification state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  )

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Live Query untuk metrik database statistik
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

  // Handle Logout (Keluar dari Akun & Reset ke Halaman Utama)
  const handleLogout = async () => {
    setIsSyncing(true)
    try {
      await signOut()
      setSyncStatus(null)
      setLastSyncTime(null)
    } catch (err) {
      console.warn('Gagal logout:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  // Manual Pull from Supabase
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

  // Manual Push to Supabase
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
          message: `Berhasil mengunggah ${res.pushedCount} data lokal ke akun cloud!`,
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

  // Manual Connection Ping
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

  // Request Notification
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

  const meta = user?.user_metadata || {}
  const userName = meta.full_name || meta.name || (user?.email ? user.email.split('@')[0] : 'Pengguna LifeOS')
  const userAvatar = meta.avatar_url || meta.picture || ''
  const userInitial = userName ? userName.slice(0, 2).toUpperCase() : 'OS'

  return (
    <div className="space-y-4 pt-1">
      {/* 1. KARTU PROFIL PENGGUNA TERAUTENTIKASI */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 p-[2px] shadow-sm flex-shrink-0">
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
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-[#18181B] truncate max-w-[170px]">
                {userName}
              </h2>
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Edit Nama atau Foto Profil"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              {isDemo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black border border-purple-200">
                  <FlaskConical className="w-3 h-3 text-purple-600" />
                  <span>Akun Demo</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">
              {user?.email}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-bold mt-1.5">
              <UserCheck className="w-3 h-3 stroke-[2.5]" />
              <span>{isDemo ? 'Database Lokal' : 'Cloud Sync Aktif'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isSyncing}
          className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 disabled:opacity-50 shadow-2xs"
          title="Keluar dari Akun"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </section>

      {/* 2. PANEL SINKRONISASI DATABASE SUPABASE */}
      <section className="bg-[#EBF5FF] rounded-3xl p-5 border border-blue-100/80 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-700">
              <Server className="w-4 h-4 stroke-[2.2]" />
            </span>
            <h3 className="text-sm font-extrabold text-blue-950">Status Sinkronisasi Cloud</h3>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
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
                  ? 'bg-emerald-600 animate-pulse'
                  : pingStatus === 'checking'
                  ? 'bg-amber-500 animate-spin'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {pingStatus === 'connected'
                ? 'Terhubung'
                : pingStatus === 'checking'
                ? 'Memeriksa...'
                : 'Belum Terhubung'}
            </span>
          </span>
        </div>

        {/* Info Endpoint & Terakhir Sinkron */}
        <div className="bg-white/80 rounded-2xl p-3 border border-blue-200/50 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">Endpoint Host:</span>
            <span className="font-mono font-bold text-blue-950 truncate max-w-[200px]">
              {supabaseUrl ? supabaseUrl.replace(/^https?:\/\//, '') : 'Belum diisi (.env)'}
            </span>
          </div>
          {lastSyncTime && (
            <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-blue-100/50">
              <span className="text-slate-500 font-semibold">Sinkron Terakhir:</span>
              <span className="font-bold text-slate-700">{lastSyncTime} WIB</span>
            </div>
          )}
        </div>

        {/* Metrik Data Lokal */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white/80 rounded-2xl p-2.5 border border-blue-200/50">
            <span className="text-base font-black text-slate-900 block">{dbStats.todos}</span>
            <span className="text-[10px] text-slate-500 font-bold">To-Dos</span>
          </div>
          <div className="bg-white/80 rounded-2xl p-2.5 border border-blue-200/50">
            <span className="text-base font-black text-slate-900 block">{dbStats.wishlists}</span>
            <span className="text-[10px] text-slate-500 font-bold">Wishlists</span>
          </div>
          <div className="bg-white/80 rounded-2xl p-2.5 border border-blue-200/50">
            <span className="text-base font-black text-slate-900 block">{dbStats.logs}</span>
            <span className="text-[10px] text-slate-500 font-bold">Daily Logs</span>
          </div>
        </div>

        {/* Status Pesan Sinkronisasi */}
        {syncStatus && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-200 ${
              syncStatus.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                : syncStatus.type === 'error'
                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                : 'bg-blue-100 text-blue-900 border border-blue-200'
            }`}
          >
            {syncStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700" />
            )}
            <span className="leading-snug">{syncStatus.message}</span>
          </div>
        )}

        {/* Action Buttons: Pull & Push */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleManualPull}
            disabled={isSyncing}
            className="py-2.5 px-3 rounded-2xl bg-white text-blue-950 text-xs font-extrabold shadow-xs hover:bg-blue-950 hover:text-white transition-all flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-60"
          >
            <CloudDownload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>Tarik Cloud (Pull)</span>
          </button>

          <button
            onClick={handleManualPush}
            disabled={isSyncing}
            className="py-2.5 px-3 rounded-2xl bg-white text-blue-950 text-xs font-extrabold shadow-xs hover:bg-blue-950 hover:text-white transition-all flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-60"
          >
            <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>Unggah Lokal (Push)</span>
          </button>
        </div>

        {/* Full Two-Way Sync Button & Refresh Ping */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFullSync}
            disabled={isSyncing}
            className="flex-1 py-2.5 rounded-2xl bg-blue-900 text-white text-xs font-extrabold shadow-sm hover:bg-blue-950 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Dua Arah'}</span>
          </button>

          <button
            onClick={handleRefreshPing}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 text-blue-950 transition-all border border-blue-200/50 shadow-xs"
            title="Tes Ping Endpoint"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. PENGATURAN NOTIFIKASI LOKAL */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
              <Bell className="w-4 h-4 stroke-[2.2]" />
            </span>
            <h3 className="text-sm font-extrabold text-[#18181B]">Notifikasi Jadwal To-Do</h3>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              notifPermission === 'granted'
                ? 'bg-emerald-100 text-emerald-800'
                : notifPermission === 'denied'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {notifPermission === 'granted'
              ? 'Aktif'
              : notifPermission === 'denied'
              ? 'Diblokir'
              : 'Belum Aktif'}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Notifikasi pengingat tenggat waktu to-do harian berbunyi langsung di browser perangkat Anda tanpa server eksternal.
        </p>

        {notifPermission !== 'granted' && (
          <button
            onClick={handleRequestNotif}
            className="w-full py-2.5 rounded-2xl bg-[#18181B] text-white text-xs font-bold hover:bg-slate-800 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Aktifkan Izin Notifikasi</span>
          </button>
        )}

        {notifPermission === 'granted' && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-2xl border border-emerald-100">
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Pengingat to-do aktif memantau deadline harian Anda.</span>
          </div>
        )}
      </section>

      {/* 4. SETTINGS & BACKUP ACTIONS */}
      <div className="bg-white rounded-3xl p-2 shadow-xs border border-slate-100 divide-y divide-slate-100 text-xs font-semibold">
        <button
          onClick={handleExportJson}
          className="w-full p-3.5 flex items-center justify-between text-slate-700 hover:bg-slate-50 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor Backup Data Lengkap (.json)</span>
          </div>
          <Download className="w-4 h-4 text-slate-400 stroke-[2]" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full p-3.5 flex items-center justify-between text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Keluar dari Akun (Kembali ke Halaman Awal)</span>
          </div>
        </button>
      </div>

      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
        <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>Data lokal tersinkron aman dengan enkripsi akun Supabase Anda.</span>
      </div>

      {/* MODAL EDIT PROFIL */}
      <ProfileSetupModal
        isOpen={isEditProfileOpen}
        onComplete={() => setIsEditProfileOpen(false)}
      />
    </div>
  )
}
