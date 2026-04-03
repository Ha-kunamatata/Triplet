import { AIRPORTS } from '../constants'

/**
 * IANA 타임존에서 UTC 오프셋(분) 반환
 * 예: 'Asia/Seoul' → 540 (UTC+9)
 */
export function getTimezoneOffsetMinutes(timezone, date = new Date()) {
  try {
    const formatted = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).format(date)
    // sv-SE → "YYYY-MM-DD HH:MM:SS"
    const localDate = new Date(formatted.replace(' ', 'T') + 'Z')
    return Math.round((localDate.getTime() - date.getTime()) / 60000)
  } catch {
    return 0
  }
}

/**
 * 공항 코드로 IANA 타임존 반환
 * 예: 'ICN' → 'Asia/Seoul'
 */
export function getAirportTimezone(airportCode) {
  const airport = AIRPORTS.find(a => a.code === airportCode)
  return airport?.tz ?? 'UTC'
}

/**
 * 로컬 datetime 문자열을 UTC 밀리초로 변환
 * @param {string} localDatetimeStr - "2025-06-25T14:30" (타임존 없음)
 * @param {string} timezone - IANA 타임존 ('Asia/Seoul')
 */
export function localToUTCMillis(localDatetimeStr, timezone) {
  if (!localDatetimeStr) return null
  const tempDate = new Date(localDatetimeStr + 'Z') // 임시로 UTC 취급
  const offset = getTimezoneOffsetMinutes(timezone, tempDate)
  return tempDate.getTime() - offset * 60000
}

/**
 * 항공 편도 비행 시간 계산 (분)
 * @param {string} depLocal - 출발 로컬 시간 "2025-06-25T14:30"
 * @param {string} arrLocal - 도착 로컬 시간 "2025-06-25T21:15"
 * @param {string} depTZ   - 출발 타임존 'Asia/Seoul'
 * @param {string} arrTZ   - 도착 타임존 'Europe/Paris'
 * @returns {number|null}  - 비행 시간 (분), 계산 불가 시 null
 */
export function getFlightDuration(depLocal, arrLocal, depTZ, arrTZ) {
  if (!depLocal || !arrLocal || !depTZ || !arrTZ) return null
  const depUTC = localToUTCMillis(depLocal, depTZ)
  const arrUTC = localToUTCMillis(arrLocal, arrTZ)
  if (depUTC === null || arrUTC === null) return null
  const diff = Math.round((arrUTC - depUTC) / 60000)
  return diff > 0 ? diff : null
}

/**
 * 분 → "X시간 Y분" 문자열
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

/**
 * datetime-local 입력값 ("2025-06-25T14:30") 에서 시간 문자열 추출
 * → "14:30"
 */
export function extractTime(datetimeLocal) {
  if (!datetimeLocal) return ''
  return datetimeLocal.slice(11, 16)
}

/**
 * datetime-local 입력값에서 날짜 추출
 * → "2025-06-25"
 */
export function extractDate(datetimeLocal) {
  if (!datetimeLocal) return ''
  return datetimeLocal.slice(0, 10)
}

/**
 * 날짜 + 시간 → datetime-local 형식
 * ("2025-06-25", "14:30") → "2025-06-25T14:30"
 */
export function toDatetimeLocal(date, time) {
  if (!date) return ''
  return `${date}T${time || '00:00'}`
}
