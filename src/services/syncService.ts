import { db } from '../db'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface SyncResult {
  success: boolean
  pushedCount: number
  pulledCount: number
  message: string
}

/**
 * Mengambil ID pengguna aktif dari sesi Supabase Auth
 */
export async function getActiveUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.id ?? null
  } catch {
    return null
  }
}

/**
 * Mengambil data terbaru dari Supabase Cloud khusus untuk pengguna yang login (Pull)
 * Memasukkan/memperbarui data ke Dexie IndexedDB lokal dengan flag synced: 1
 */
export async function pullCloudData(targetUserId?: string): Promise<{ pulledCount: number; error?: string }> {
  if (!isSupabaseConfigured) return { pulledCount: 0 }

  const userId = targetUserId || (await getActiveUserId())
  if (!userId) {
    return { pulledCount: 0, error: 'Pengguna belum login (user_id tidak ditemukan)' }
  }

  // 0. Eksekusi tombstone deletions terlebih dahulu sebelum menarik data baru
  await processDeletedRecords(userId)

  // Ambil daftar record yang masih dalam antrean penghapusan
  const pendingDeletions = await db.deletedRecords.toArray()
  const deletedTodoIds = new Set(pendingDeletions.filter((p) => p.table === 'todos').map((p) => p.recordId))
  const deletedWishlistIds = new Set(pendingDeletions.filter((p) => p.table === 'wishlists').map((p) => p.recordId))

  let pulledItems = 0

  try {
    // 1. Pull Todos
    const { data: cloudTodos, error: todoErr } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)

    if (todoErr) {
      console.warn('[Sync] Gagal menarik todos:', todoErr.message)
    } else if (cloudTodos) {
      for (const ct of cloudTodos) {
        // Lewati jika item ini sedang dalam antrean hapus lokal
        if (ct.id && deletedTodoIds.has(ct.id)) continue

        const cloudUpdatedAt = ct.updated_at || new Date().toISOString()

        let existing = ct.id ? await db.todos.get(ct.id) : undefined
        if (!existing) {
          existing = await db.todos
            .where('dueDate')
            .equals(ct.due_date)
            .filter((t) => t.title === ct.title)
            .first()
        }

        const targetId = ct.id || existing?.id

        await db.todos.put({
          ...(targetId ? { id: targetId } : {}),
          title: ct.title,
          description: ct.description ?? undefined,
          scope: ct.scope || 'daily',
          category: ct.category || 'Umum',
          dueDate: ct.due_date,
          dueTime: ct.due_time ?? undefined,
          completed: Boolean(ct.completed),
          synced: 1,
          createdAt: ct.created_at || cloudUpdatedAt,
          updatedAt: cloudUpdatedAt,
        })
        pulledItems++
      }
    }

    // 2. Pull Wishlists
    const { data: cloudWishlists, error: wishErr } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)

    if (wishErr) {
      console.warn('[Sync] Gagal menarik wishlists:', wishErr.message)
    } else if (cloudWishlists) {
      for (const cw of cloudWishlists) {
        // Lewati jika item wishlist ini sedang dalam antrean hapus lokal
        if (cw.id && deletedWishlistIds.has(cw.id)) continue

        const cloudUpdatedAt = cw.updated_at || new Date().toISOString()

        let existing = cw.id ? await db.wishlists.get(cw.id) : undefined
        if (!existing) {
          existing = await db.wishlists
            .filter((w) => w.title === cw.title && w.type === cw.type)
            .first()
        }

        const targetId = cw.id || existing?.id

        await db.wishlists.put({
          ...(targetId ? { id: targetId } : {}),
          title: cw.title,
          type: cw.type,
          targetCost: Number(cw.target_cost) || 0,
          currentSaved: Number(cw.current_saved) || 0,
          notes: cw.notes ?? undefined,
          targetDate: cw.target_date ?? undefined,
          synced: 1,
          createdAt: cw.created_at || cloudUpdatedAt,
          updatedAt: cloudUpdatedAt,
        })
        pulledItems++
      }
    }

    // 3. Pull Daily Logs
    const { data: cloudLogs, error: logErr } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)

    if (logErr) {
      console.warn('[Sync] Gagal menarik daily_logs:', logErr.message)
    } else if (cloudLogs) {
      for (const cl of cloudLogs) {
        const cloudUpdatedAt = cl.updated_at || new Date().toISOString()
        const existing = await db.dailyLogs.where('date').equals(cl.date).first()
        const targetId = cl.id || existing?.id

        await db.dailyLogs.put({
          ...(targetId ? { id: targetId } : {}),
          date: cl.date,
          quickNotes: cl.quick_notes || '',
          dailyWins: Array.isArray(cl.daily_wins) ? cl.daily_wins : [],
          synced: 1,
          createdAt: cl.created_at || cloudUpdatedAt,
          updatedAt: cloudUpdatedAt,
        })
        pulledItems++
      }
    }

    return { pulledCount: pulledItems }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kesalahan saat pull data cloud'
    console.error('Error saat pullCloudData:', err)
    return { pulledCount: pulledItems, error: msg }
  }
}

/**
 * Mengunggah data lokal yang belum tersinkron (synced: 0) ke Supabase dengan user_id (Push).
 * Setelah berhasil, ubah flag menjadi synced: 1.
 */
export async function pushLocalData(targetUserId?: string): Promise<{ pushedCount: number; error?: string }> {
  if (!isSupabaseConfigured) return { pushedCount: 0 }

  const userId = targetUserId || (await getActiveUserId())
  if (!userId) {
    return { pushedCount: 0, error: 'Pengguna belum login (user_id tidak ditemukan)' }
  }

  let pushedCount = 0
  let lastError = ''

  try {
    // 1. PUSH: Todos lokal yang berstatus synced: 0 atau false
    const unsyncedTodos = await db.todos.filter((t) => !t.synced || t.synced === 0).toArray()
    for (const todo of unsyncedTodos) {
      if (!todo.id) continue
      const payload: Record<string, unknown> = {
        id: todo.id,
        user_id: userId,
        title: todo.title,
        description: todo.description ?? null,
        scope: todo.scope,
        category: todo.category,
        due_date: todo.dueDate,
        due_time: todo.dueTime ?? null,
        completed: todo.completed,
        created_at: todo.createdAt,
        updated_at: todo.updatedAt,
      }

      const { error } = await supabase.from('todos').upsert(payload)
      if (!error) {
        await db.todos.update(todo.id, { synced: 1 })
        pushedCount++
      } else {
        lastError = error.message
        console.warn('Gagal push todo ke Supabase:', error.message)
      }
    }

    // 2. PUSH: Wishlists lokal yang berstatus synced: 0 atau false
    const unsyncedWishlists = await db.wishlists.filter((w) => !w.synced || w.synced === 0).toArray()
    for (const wish of unsyncedWishlists) {
      if (!wish.id) continue
      const payload: Record<string, unknown> = {
        id: wish.id,
        user_id: userId,
        title: wish.title,
        type: wish.type,
        target_cost: wish.targetCost,
        current_saved: wish.currentSaved,
        notes: wish.notes ?? null,
        target_date: wish.targetDate ?? null,
        created_at: wish.createdAt,
        updated_at: wish.updatedAt,
      }

      const { error } = await supabase.from('wishlists').upsert(payload)
      if (!error) {
        await db.wishlists.update(wish.id, { synced: 1 })
        pushedCount++
      } else {
        lastError = error.message
        console.warn('Gagal push wishlist ke Supabase:', error.message)
      }
    }

    // 3. PUSH: Daily Logs lokal yang berstatus synced: 0 atau false
    const unsyncedLogs = await db.dailyLogs.filter((l) => !l.synced || l.synced === 0).toArray()
    for (const log of unsyncedLogs) {
      if (!log.id) continue
      const payload: Record<string, unknown> = {
        id: log.id,
        user_id: userId,
        date: log.date,
        quick_notes: log.quickNotes,
        daily_wins: log.dailyWins,
        created_at: log.createdAt,
        updated_at: log.updatedAt,
      }

      const { error } = await supabase.from('daily_logs').upsert(payload)
      if (!error) {
        await db.dailyLogs.update(log.id, { synced: 1 })
        pushedCount++
      } else {
        lastError = error.message
        console.warn('Gagal push daily log ke Supabase:', error.message)
      }
    }

    return { pushedCount, error: lastError || undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kesalahan saat push data lokal'
    return { pushedCount, error: msg }
  }
}

/**
 * Menjalankan sinkronisasi dua arah penuh (Push lokal ke cloud, lalu Pull cloud ke lokal)
 */
export async function runFullSync(targetUserId?: string): Promise<SyncResult> {
  if (typeof window === 'undefined') {
    return { success: false, pushedCount: 0, pulledCount: 0, message: 'Window is not defined' }
  }

  if (!navigator.onLine) {
    return { success: false, pushedCount: 0, pulledCount: 0, message: 'Perangkat sedang offline' }
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      pushedCount: 0,
      pulledCount: 0,
      message: 'Supabase belum terkonfigurasi di file .env',
    }
  }

  const userId = targetUserId || (await getActiveUserId())
  if (!userId) {
    return {
      success: false,
      pushedCount: 0,
      pulledCount: 0,
      message: 'Silakan masuk ke akun untuk sinkronisasi cloud',
    }
  }

  try {
    const { pushedCount, error: pushErr } = await pushLocalData(userId)
    const { pulledCount, error: pullErr } = await pullCloudData(userId)

    const combinedError = [pushErr, pullErr].filter(Boolean).join('; ')

    if (combinedError && pushedCount === 0 && pulledCount === 0) {
      return {
        success: false,
        pushedCount: 0,
        pulledCount: 0,
        message: `Gagal sinkronisasi: ${combinedError}`,
      }
    }

    return {
      success: true,
      pushedCount,
      pulledCount,
      message: `Sinkronisasi akun berhasil! (${pushedCount} terkirim, ${pulledCount} ditarik)`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Kesalahan sinkronisasi database'
    console.error('Error saat runFullSync:', errorMsg)
    return { success: false, pushedCount: 0, pulledCount: 0, message: errorMsg }
  }
}

/**
 * Membersihkan seluruh data lokal di IndexedDB saat user logout
 */
export async function clearLocalUserData(): Promise<void> {
  await Promise.all([
    db.todos.clear(),
    db.wishlists.clear(),
    db.dailyLogs.clear(),
    db.deletedRecords.clear(),
  ])
}

/**
 * Memproses dan mengeksekusi seluruh antrean penghapusan offline (Tombstone Sync).
 * Menghapus data di Supabase lalu membersihkan antrean agar data tidak ditarik kembali.
 */
export async function processDeletedRecords(targetUserId?: string): Promise<{ deletedCount: number }> {
  if (!isSupabaseConfigured) return { deletedCount: 0 }

  const userId = targetUserId || (await getActiveUserId())
  if (!userId) return { deletedCount: 0 }

  let deletedCount = 0

  try {
    const tombstones = await db.deletedRecords.toArray()
    if (tombstones.length === 0) return { deletedCount: 0 }

    for (const item of tombstones) {
      try {
        const { error } = await supabase
          .from(item.table)
          .delete()
          .eq('id', item.recordId)
          .eq('user_id', userId)

        if (!error) {
          if (item.id) {
            await db.deletedRecords.delete(item.id)
          }
          deletedCount++
        }
      } catch (err) {
        console.warn(`[Tombstone] Gagal sinkronisasi penghapusan ${item.table} #${item.recordId}:`, err)
      }
    }
  } catch (err) {
    console.warn('[Tombstone] Gagal membaca antrean penghapusan:', err)
  }

  return { deletedCount }
}

/**
 * Helper untuk menghapus todo dari Supabase secara langsung atau simpan ke deletedRecords jika offline/gagal
 */
export async function deleteTodoFromCloud(id: number): Promise<void> {
  const now = new Date().toISOString()
  try {
    await db.deletedRecords.add({
      table: 'todos',
      recordId: id,
      deletedAt: now,
    })
  } catch (err) {
    console.warn('Gagal mencatat tombstone todo:', err)
  }

  if (!isSupabaseConfigured || !navigator.onLine) return
  const userId = await getActiveUserId()
  if (!userId) return

  try {
    const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId)
    if (!error) {
      await db.deletedRecords.where({ table: 'todos', recordId: id }).delete()
    }
  } catch (err) {
    console.warn('Gagal menghapus todo dari cloud, antrean tombstone disimpan:', err)
  }
}

/**
 * Helper untuk menghapus wishlist dari Supabase secara langsung atau simpan ke deletedRecords jika offline/gagal
 */
export async function deleteWishlistFromCloud(id: number): Promise<void> {
  const now = new Date().toISOString()
  try {
    await db.deletedRecords.add({
      table: 'wishlists',
      recordId: id,
      deletedAt: now,
    })
  } catch (err) {
    console.warn('Gagal mencatat tombstone wishlist:', err)
  }

  if (!isSupabaseConfigured || !navigator.onLine) return
  const userId = await getActiveUserId()
  if (!userId) return

  try {
    const { error } = await supabase.from('wishlists').delete().eq('id', id).eq('user_id', userId)
    if (!error) {
      await db.deletedRecords.where({ table: 'wishlists', recordId: id }).delete()
    }
  } catch (err) {
    console.warn('Gagal menghapus wishlist dari cloud, antrean tombstone disimpan:', err)
  }
}

/**
 * Mendaftarkan listener event online dan interval auto-sync
 */
export function registerBackgroundSyncListeners(
  pollIntervalMs = 5 * 60 * 1000
): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => {
    console.info('[LifeOS PWA] Jaringan online terdeteksi. Menjalankan sinkronisasi database...')
    runFullSync()
  }

  window.addEventListener('online', handleOnline)

  const timer = setInterval(() => {
    if (navigator.onLine) {
      runFullSync()
    }
  }, pollIntervalMs)

  return () => {
    window.removeEventListener('online', handleOnline)
    clearInterval(timer)
  }
}
