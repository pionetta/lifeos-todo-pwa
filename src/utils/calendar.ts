import type { Todo } from '../db'

/**
 * Format date and time into iCalendar / Google Calendar date string
 */
function formatDateTime(dueDate: string, dueTime?: string): { start: string; end: string } {
  const cleanDate = dueDate.replace(/-/g, '')

  if (dueTime) {
    const [hours, minutes] = dueTime.split(':').map(Number)
    const startDate = new Date(`${dueDate}T${dueTime}:00`)
    
    // Default duration: 1 hour
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

    const pad = (n: number) => String(n).padStart(2, '0')
    const start = `${cleanDate}T${pad(hours)}${pad(minutes)}00`
    
    const endYear = endDate.getFullYear()
    const endMonth = pad(endDate.getMonth() + 1)
    const endDay = pad(endDate.getDate())
    const endHour = pad(endDate.getHours())
    const endMin = pad(endDate.getMinutes())
    const end = `${endYear}${endMonth}${endDay}T${endHour}${endMin}00`

    return { start, end }
  } else {
    // All-day event
    const start = cleanDate
    const d = new Date(dueDate)
    d.setDate(d.getDate() + 1)
    const end = d.toISOString().slice(0, 10).replace(/-/g, '')
    return { start, end }
  }
}

/**
 * Menghasilkan tautan langsung untuk Google Calendar web
 */
export function generateGoogleCalendarUrl(todo: Todo): string {
  const title = encodeURIComponent(todo.title)
  const description = encodeURIComponent(
    [
      todo.description || '',
      `• Kategori: ${todo.category}`,
      `• Cakupan: ${todo.scope}`,
      '• Catatan: Dibuat via Personal Life OS PWA'
    ].filter(Boolean).join('\n')
  )

  const { start, end } = formatDateTime(todo.dueDate, todo.dueTime)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}`
}

/**
 * Mengekspor dan mengunduh berkas format .ics untuk kalender lokal (iOS/Android/Desktop)
 */
export function downloadICSFile(todo: Todo): void {
  const { start, end } = formatDateTime(todo.dueDate, todo.dueTime)
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const uid = `todo-${todo.id || Date.now()}@lifeos.local`

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LifeOS//Personal To-Do Organizer//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    todo.dueTime ? `DTSTART:${start}` : `DTSTART;VALUE=DATE:${start}`,
    todo.dueTime ? `DTEND:${end}` : `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${todo.title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(todo.description || `Kategori: ${todo.category}`).replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ]

  const icsContent = icsLines.join('\r\n')
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${todo.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
