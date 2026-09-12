import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { db } from '../db'

interface AuthResponse {
  user: User | null
  error: AuthError | Error | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isDemo: boolean
  signUp: (
    email: string,
    password: string,
    options?: { fullName?: string; avatarUrl?: string }
  ) => Promise<AuthResponse>
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  loginAsDemoUser: () => Promise<void>
  signOut: () => Promise<void>
  updateUserProfile: (data: {
    fullName?: string
    avatarUrl?: string
  }) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Seeding database Dexie dengan dummy data kaya untuk pengujian demo
 */
async function seedDemoDatabase() {
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()

  // 3 To-Do Harian
  const dailyTodos = [
    {
      title: 'Review rencana sprint mingguan',
      description: 'Evaluasi backlog dan prioritas to-do pekan ini',
      scope: 'daily' as const,
      category: 'Pekerjaan',
      dueDate: today,
      dueTime: '09:00',
      completed: true,
      synced: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Membaca buku Atomic Habits 15 menit',
      description: 'Target 1 chapter per hari untuk micro-habits',
      scope: 'daily' as const,
      category: 'Pengembangan Diri',
      dueDate: today,
      dueTime: '13:00',
      completed: false,
      synced: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Olahraga jogging sore 30 menit',
      description: 'Kardio santai keliling komplek rumah',
      scope: 'daily' as const,
      category: 'Kesehatan',
      dueDate: today,
      dueTime: '17:00',
      completed: false,
      synced: 0,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // 2 To-Do Mingguan
  const weeklyTodos = [
    {
      title: 'Evaluasi portofolio & update CV',
      description: 'Tambahkan showcase proyek LifeOS PWA',
      scope: 'weekly' as const,
      category: 'Karir',
      dueDate: today,
      completed: false,
      synced: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Belanja bulanan kebutuhan rumah',
      description: 'Bahan pokok, buah-buahan, dan vitamin',
      scope: 'weekly' as const,
      category: 'Pribadi',
      dueDate: today,
      completed: false,
      synced: 0,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // 2 Wishlist
  const wishlistsData = [
    {
      title: 'Liburan ke Labuan Bajo',
      type: 'place' as const,
      targetCost: 8000000,
      currentSaved: 5200000,
      notes: 'Paket trip Pulau Komodo & sailing kapal phinisi',
      targetDate: '2026-12-25',
      synced: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'MacBook Pro M-Series',
      type: 'item' as const,
      targetCost: 24000000,
      currentSaved: 16800000,
      notes: 'Upgrade workstation untuk pengembangan aplikasi',
      targetDate: '2027-03-30',
      synced: 0,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // 1 Daily Win & Reflection
  const dailyLogData = {
    date: today,
    quickNotes: 'Fokus hari ini sangat baik, semua tugas prioritas tinggi selesai tepat waktu.',
    dailyWins: [
      'Menyelesaikan to-do harian tepat waktu',
      'Konsisten minum air 2 liter',
      'Uji coba alur integrasi cloud berhasil',
    ],
    synced: 0,
    createdAt: now,
    updatedAt: now,
  }

  await db.todos.bulkAdd([...dailyTodos, ...weeklyTodos])
  await db.wishlists.bulkAdd(wishlistsData)
  await db.dailyLogs.add(dailyLogData)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('lifeos_demo_mode') === 'true'
  })

  useEffect(() => {
    let isMounted = true

    // 1. Cek sesi awal dari Supabase
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return
        if (error) {
          console.warn('Gagal membaca sesi awal Supabase:', error.message)
        }

        if (data.session) {
          setSession(data.session)
          setUser(data.session.user)
          setIsDemo(data.session.user.email === 'demo@lifeos.local')
        } else {
          // Jika tidak ada sesi Supabase tetapi ada flag demo di localStorage
          const savedDemo = localStorage.getItem('lifeos_demo_mode') === 'true'
          if (savedDemo) {
            const mockDemoUser: User = {
              id: 'demo-tester-offline-id',
              app_metadata: { provider: 'demo' },
              user_metadata: { name: 'Demo Tester' },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              email: 'demo@lifeos.local',
              role: 'authenticated',
            } as User

            const mockDemoSession: Session = {
              access_token: 'demo-access-token',
              token_type: 'bearer',
              expires_in: 86400,
              refresh_token: 'demo-refresh-token',
              user: mockDemoUser,
            } as Session

            setUser(mockDemoUser)
            setSession(mockDemoSession)
            setIsDemo(true)
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.warn('Kesalahan jaringan saat membaca sesi:', err)
        setLoading(false)
      })

    // 2. Listener perubahan sesi real-time dari Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return
      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
        setIsDemo(newSession.user.email === 'demo@lifeos.local')
      } else {
        const savedDemo = localStorage.getItem('lifeos_demo_mode') === 'true'
        if (!savedDemo) {
          setSession(null)
          setUser(null)
          setIsDemo(false)
        }
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Fungsi Registrasi Pengguna Baru
  const signUp = async (
    email: string,
    password: string,
    options?: { fullName?: string; avatarUrl?: string }
  ): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) {
      return {
        user: null,
        error: new Error('Supabase URL atau Anon Key belum dikonfigurasi di file .env'),
      }
    }

    try {
      const metadata: Record<string, any> = {
        profile_setup_completed: true,
      }
      if (options?.fullName) metadata.full_name = options.fullName
      if (options?.avatarUrl) metadata.avatar_url = options.avatarUrl

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        return { user: null, error }
      }

      if (data.user) {
        setUser(data.user)
      }

      return { user: data.user, error: null }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error('Terjadi kesalahan pendaftaran')
      return { user: null, error: errorObj }
    }
  }

  // Fungsi Masuk Akun Email + Password
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) {
      return {
        user: null,
        error: new Error('Supabase URL atau Anon Key belum dikonfigurasi di file .env'),
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { user: null, error }
      }

      setSession(data.session)
      setUser(data.user)
      setIsDemo(data.user.email === 'demo@lifeos.local')

      return { user: data.user, error: null }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error('Terjadi kesalahan saat masuk')
      return { user: null, error: errorObj }
    }
  }

  // Fungsi Masuk Akun dengan Google OAuth
  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error('Supabase belum dikonfigurasi di file .env'),
      }
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      return { error }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error('Gagal menginisialisasi login Google')
      return { error: errorObj }
    }
  }

  // Fungsi Cepat Masuk Akun Demo (Testing Mode)
  const loginAsDemoUser = async (): Promise<void> => {
    setLoading(true)
    const demoEmail = 'demo@lifeos.local'
    const demoPassword = 'demo123456'

    let authenticatedViaSupabase = false

    // 1. Coba login ke Supabase jika configured & online
    if (isSupabaseConfigured && navigator.onLine) {
      try {
        let signInRes = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        })

        // Jika akun demo belum terdaftar, buat akunnya terlebih dahulu
        if (signInRes.error) {
          await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
          })
          signInRes = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          })
        }

        if (!signInRes.error && signInRes.data.session) {
          setSession(signInRes.data.session)
          setUser(signInRes.data.user)
          setIsDemo(true)
          localStorage.setItem('lifeos_demo_mode', 'true')
          authenticatedViaSupabase = true
        }
      } catch (err) {
        console.warn('Gagal login via akun demo Supabase, beralih ke fallback offline:', err)
      }
    }

    // 2. Fallback lokal offline jika Supabase belum aktif / network error
    if (!authenticatedViaSupabase) {
      const mockDemoUser: User = {
        id: 'demo-tester-offline-id',
        app_metadata: { provider: 'demo' },
        user_metadata: { name: 'Demo Tester' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'demo@lifeos.local',
        role: 'authenticated',
      } as User

      const mockDemoSession: Session = {
        access_token: 'demo-access-token',
        token_type: 'bearer',
        expires_in: 86400,
        refresh_token: 'demo-refresh-token',
        user: mockDemoUser,
      } as Session

      setUser(mockDemoUser)
      setSession(mockDemoSession)
      setIsDemo(true)
      localStorage.setItem('lifeos_demo_mode', 'true')
    }

    // 3. Isi database lokal dengan dummy data jika kosong
    try {
      const todoCount = await db.todos.count()
      if (todoCount === 0) {
        await seedDemoDatabase()
      }
    } catch (seedErr) {
      console.warn('Gagal mengisi database demo:', seedErr)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi Keluar Akun (Sign Out & Clear Local Data)
  const signOut = async (): Promise<void> => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.warn('Gagal logout dari Supabase:', err)
    } finally {
      // Bersihkan state
      setUser(null)
      setSession(null)
      setIsDemo(false)

      // Bersihkan flags demo dan storage
      localStorage.removeItem('lifeos_demo_mode')
      localStorage.removeItem('lifeos_todos_initialized')
      localStorage.removeItem('lifeos_wishlists_initialized')
      localStorage.removeItem('lifeos_notes_initialized')
      localStorage.removeItem('lifeos_guest_mode')
      localStorage.removeItem('lifeos_demo_user')

      // Bersihkan IndexedDB lokal agar privasi data terjaga
      try {
        await Promise.all([
          db.todos.clear(),
          db.wishlists.clear(),
          db.dailyLogs.clear(),
        ])
        console.info('[LifeOS] Database lokal Dexie berhasil dibersihkan setelah logout.')
      } catch (dbErr) {
        console.error('Gagal membersihkan data lokal Dexie:', dbErr)
      }
    }
  }

  // Fungsi Update Profil Pengguna (Nama & Avatar)
  const updateUserProfile = async (profileData: {
    fullName?: string
    avatarUrl?: string
  }): Promise<{ error: Error | null }> => {
    try {
      const currentMeta = user?.user_metadata || {}
      const updates: Record<string, any> = {
        ...currentMeta,
        profile_setup_completed: true,
      }
      if (profileData.fullName !== undefined) updates.full_name = profileData.fullName
      if (profileData.avatarUrl !== undefined) updates.avatar_url = profileData.avatarUrl

      if (isSupabaseConfigured && user) {
        const { data, error } = await supabase.auth.updateUser({
          data: updates,
        })
        if (error) throw error
        if (data.user) {
          setUser(data.user)
        }
      } else if (user) {
        const updatedUser = {
          ...user,
          user_metadata: updates,
        }
        setUser(updatedUser as User)
      }

      if (user?.id) {
        localStorage.setItem(`lifeos_profile_setup_${user.id}`, 'true')
      }

      return { error: null }
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error('Gagal memperbarui profil')
      return { error: errorObj }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isDemo,
        signUp,
        signIn,
        signInWithGoogle,
        loginAsDemoUser,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
export type { AuthContextType }
