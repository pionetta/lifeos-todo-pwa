import { db } from '../db'

// In-memory set of todo IDs that have already triggered a notification in this session
const notifiedTodoIds = new Set<number>()

/**
 * Meminta izin notifikasi ke browser
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Browser tidak mendukung Web Notifications API.')
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (err) {
    console.error('Error saat meminta izin notifikasi:', err)
    return 'denied'
  }
}

/**
 * Menampilkan notifikasi lokal di perangkat pengguna
 */
export function triggerLocalNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icon-todo-app.svg',
        badge: '/icon-todo-app.svg',
        ...options,
      })
    } catch (err) {
      console.error('Gagal menampilkan notifikasi:', err)
    }
  }
}

/**
 * Inisialisasi checker berkala yang memeriksa deadline to-do harian
 */
export function initTodoNotificationChecker(intervalMs = 60000): () => void {
  if (typeof window === 'undefined') return () => {}

  const checkDeadlines = async () => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return

    try {
      const todayStr = new Date().toISOString().slice(0, 10)
      const now = new Date()
      const currentHours = now.getHours()
      const currentMinutes = now.getMinutes()
      const currentTotalMin = currentHours * 60 + currentMinutes

      // Query incomplete daily todos for today
      const activeTodos = await db.todos
        .where('scope')
        .equals('daily')
        .filter((t) => !t.completed && t.dueDate === todayStr && !!t.dueTime)
        .toArray()

      for (const todo of activeTodos) {
        if (!todo.id || notifiedTodoIds.has(todo.id) || !todo.dueTime) continue

        const [th, tm] = todo.dueTime.split(':').map(Number)
        const todoTotalMin = th * 60 + tm
        const diffMinutes = todoTotalMin - currentTotalMin

        // Beri tahu jika waktu jatuh tempo tiba atau dalam 15 menit ke depan
        if (diffMinutes <= 15 && diffMinutes >= -5) {
          triggerLocalNotification(`Pengingat Tugas: ${todo.title}`, {
            body: `Waktu jatuh tempo: ${todo.dueTime}. Kategori: ${todo.category}`,
            tag: `todo-${todo.id}`,
          })
          notifiedTodoIds.add(todo.id)
        }
      }
    } catch (err) {
      console.error('Error saat memeriksa deadline to-do:', err)
    }
  }

  // Initial check
  checkDeadlines()

  // Periodic interval
  const timer = setInterval(checkDeadlines, intervalMs)

  return () => clearInterval(timer)
}
