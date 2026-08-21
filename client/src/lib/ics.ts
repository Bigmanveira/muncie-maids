function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

interface IcsEvent {
  uid: string
  title: string
  description: string
  location: string
  start: Date
  durationHours: number
}

export function buildIcsContent(event: IcsEvent): string {
  const end = new Date(event.start.getTime() + event.durationHours * 60 * 60 * 1000)

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Muncie Maids//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${event.uid}@munciemaids`,
    `DTSTAMP:${toIcsDate(new Date(event.start))}`,
    `DTSTART:${toIcsDate(event.start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
