import { ITEM_TYPES } from '../constants'

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createFlightItem(partial = {}) {
  return {
    id: uid(),
    type: ITEM_TYPES.FLIGHT,
    airline: '',
    flightNumber: '',
    departureAirport: '',
    arrivalAirport: '',
    departureTime: '',     // "YYYY-MM-DDTHH:MM" 로컬 시간
    arrivalTime: '',       // "YYYY-MM-DDTHH:MM" 로컬 시간
    departureTZ: '',
    arrivalTZ: '',
    seatNumber: '',
    bookingRef: '',
    terminal: '',
    notes: '',
    date: '',              // YYYY-MM-DD (출발일, 필터링용)
    dayIndex: 0,
    order: Date.now(),
    ...partial,
  }
}

export function createStayItem(partial = {}) {
  return {
    id: uid(),
    type: ITEM_TYPES.STAY,
    name: '',
    address: '',
    lat: null,
    lng: null,
    checkIn: '',           // "YYYY-MM-DD"
    checkOut: '',          // "YYYY-MM-DD"
    checkInTime: '15:00',
    checkOutTime: '11:00',
    bookingRef: '',
    phone: '',
    website: '',
    notes: '',
    cost: 0,
    date: '',              // 체크인 날짜 (필터링용)
    dayIndex: 0,
    order: Date.now(),
    ...partial,
  }
}

export function createPlaceItem(partial = {}) {
  return {
    id: uid(),
    type: ITEM_TYPES.PLACE,
    title: '',
    category: 'attraction',
    address: '',
    lat: null,
    lng: null,
    placeId: '',
    phone: '',
    website: '',
    visitTime: '',         // "HH:MM"
    endTime: '',           // "HH:MM"
    duration: 60,          // 분
    notes: '',
    cost: 0,
    date: '',              // YYYY-MM-DD
    dayIndex: 0,
    order: Date.now(),
    ...partial,
  }
}

export function createTransportItem(partial = {}) {
  return {
    id: uid(),
    type: ITEM_TYPES.TRANSPORT,
    mode: 'train',
    fromName: '',
    toName: '',
    departureTime: '',     // "YYYY-MM-DDTHH:MM"
    arrivalTime: '',       // "YYYY-MM-DDTHH:MM"
    bookingRef: '',
    notes: '',
    cost: 0,
    date: '',              // YYYY-MM-DD
    dayIndex: 0,
    order: Date.now(),
    ...partial,
  }
}

export function createMemoItem(partial = {}) {
  return {
    id: uid(),
    type: ITEM_TYPES.MEMO,
    title: '',
    content: '',
    color: '#F59E0B',
    date: '',              // YYYY-MM-DD
    dayIndex: 0,
    order: Date.now(),
    ...partial,
  }
}

/** 아이템의 정렬 기준 시간 문자열 반환 ("HH:MM" 형식) */
export function getItemSortTime(item) {
  switch (item.type) {
    case ITEM_TYPES.FLIGHT:    return item.departureTime?.slice(11, 16) || '00:00'
    case ITEM_TYPES.STAY:      return item.checkInTime || '00:00'
    case ITEM_TYPES.PLACE:     return item.visitTime || '99:99'
    case ITEM_TYPES.TRANSPORT: return item.departureTime?.slice(11, 16) || '99:99'
    case ITEM_TYPES.MEMO:      return '99:99'
    default:                   return item.startTime || '99:99'
  }
}

/** 아이템 표시용 시간 문자열 */
export function getItemDisplayTime(item) {
  switch (item.type) {
    case ITEM_TYPES.FLIGHT:
      return item.departureTime ? item.departureTime.slice(11, 16) : ''
    case ITEM_TYPES.STAY:
      return item.checkInTime || ''
    case ITEM_TYPES.PLACE:
      return item.visitTime || ''
    case ITEM_TYPES.TRANSPORT:
      return item.departureTime ? item.departureTime.slice(11, 16) : ''
    default:
      return item.startTime || ''
  }
}
