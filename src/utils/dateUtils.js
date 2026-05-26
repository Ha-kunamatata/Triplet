const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime())
}

/** "2025-04-10" → "4월 10일 (목)" */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (!isValidDate(d)) return '-'
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`
}

/** "2025-04-10" → "4.10" */
export function formatShortDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (!isValidDate(d)) return '-'
  return `${d.getMonth() + 1}.${d.getDate()}`
}

/** 두 날짜 사이의 일수 (포함) */
export function getTripDuration(startDate, endDate) {
  if (!startDate || !endDate) return 1
  const diff = new Date(endDate) - new Date(startDate)
  if (isNaN(diff)) return 1
  return Math.max(1, Math.round(diff / 86400000) + 1)
}

/** startDate ~ endDate 사이 날짜 배열 */
export function generateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return []
  const dates = []
  const cur = new Date(startDate)
  const end = new Date(endDate)
  if (!isValidDate(cur) || !isValidDate(end)) return []
  let guard = 0
  while (cur <= end && guard < 366) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
    guard++
  }
  return dates
}

/** D-Day 문자열 */
export function getDDay(startDate) {
  if (!startDate) return 'D-?'
  const diff = Math.ceil((new Date(startDate) - new Date()) / 86400000)
  if (isNaN(diff)) return 'D-?'
  if (diff === 0) return 'D-Day'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

/** 여행 상태 자동 계산 */
export function calcTripStatus(startDate, endDate) {
  if (!startDate || !endDate) return 'upcoming'
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (!isValidDate(start) || !isValidDate(end)) return 'upcoming'
  end.setHours(23, 59, 59)
  if (now < start) return 'upcoming'
  if (now > end)   return 'completed'
  return 'ongoing'
}

/** Timestamp → 날짜 문자열 (Firestore Timestamp 대응) */
export function timestampToStr(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  if (!isValidDate(d)) return ''
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}
