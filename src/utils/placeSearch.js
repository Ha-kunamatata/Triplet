/**
 * 하이브리드 장소 검색 유틸리티
 * - 국내 / 한글 키워드 → 카카오 로컬 API (REST 키 있을 때) 또는 SDK Places 서비스
 * - 해외 / 영문 키워드  → Nominatim (OpenStreetMap, 무료, 키 불필요)
 * - 두 결과 병합 + 중복 제거
 */

import { KAKAO_CATEGORY_MAP } from '../constants'

// ──────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────

function hasKorean(str) {
  return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(str)
}

const CATEGORY_ICONS = {
  restaurant: { icon: 'restaurant',   color: '#EF9F27' },
  cafe:       { icon: 'local_cafe',   color: '#7F77DD' },
  attraction: { icon: 'photo_camera', color: '#1D9E75' },
  shopping:   { icon: 'shopping_bag', color: '#EC4899' },
  stay:       { icon: 'hotel',        color: '#378ADD' },
  activity:   { icon: 'sports',       color: '#F97316' },
  transport:  { icon: 'subway',       color: '#7C3AED' },
  other:      { icon: 'location_on',  color: '#94A3B8' },
}

// ──────────────────────────────────────────────
// 카카오 결과 → 공통 포맷
// ──────────────────────────────────────────────

export function normalizeKakao(place) {
  const category = KAKAO_CATEGORY_MAP[place.category_group_code] ?? 'other'
  return {
    id:           `kakao_${place.id}`,
    source:       'kakao',
    place_name:   place.place_name,
    address:      place.road_address_name || place.address_name || '',
    lat:          parseFloat(place.y),
    lng:          parseFloat(place.x),
    phone:        place.phone || '',
    place_url:    place.place_url || '',
    category,
    categoryCode: place.category_group_code || '',
    categoryName: place.category_group_name || '',
  }
}

// ──────────────────────────────────────────────
// Nominatim 타입 → 앱 카테고리
// ──────────────────────────────────────────────

function mapNominatimType(type, cls) {
  if (cls === 'amenity') {
    const map = {
      restaurant: 'restaurant', cafe: 'cafe', bar: 'restaurant',
      fast_food: 'restaurant', food_court: 'restaurant',
      hotel: 'stay', hostel: 'stay', motel: 'stay', guest_house: 'stay',
      museum: 'attraction', theatre: 'attraction', cinema: 'activity',
      arts_centre: 'attraction', place_of_worship: 'attraction',
      marketplace: 'shopping', supermarket: 'shopping',
      parking: 'transport', bus_station: 'transport', ferry_terminal: 'transport',
    }
    return map[type] || 'other'
  }
  if (cls === 'tourism') {
    const map = {
      attraction: 'attraction', museum: 'attraction', gallery: 'attraction',
      hotel: 'stay', guest_house: 'stay', hostel: 'stay', apartment: 'stay',
      viewpoint: 'attraction', theme_park: 'activity', zoo: 'activity',
      aquarium: 'activity', information: 'other',
    }
    return map[type] || 'attraction'
  }
  if (cls === 'shop') return 'shopping'
  if (cls === 'leisure') return 'activity'
  if (cls === 'railway' || cls === 'aeroway' || cls === 'public_transport') return 'transport'
  return 'other'
}

// ──────────────────────────────────────────────
// Nominatim 결과 → 공통 포맷
// ──────────────────────────────────────────────

export function normalizeNominatim(item) {
  const nameParts = item.display_name.split(', ')
  const place_name = nameParts[0]
  const category = mapNominatimType(item.type, item.class)
  return {
    id:           `nominatim_${item.place_id}`,
    source:       'nominatim',
    place_name,
    address:      item.display_name,
    lat:          parseFloat(item.lat),
    lng:          parseFloat(item.lon),
    phone:        '',
    place_url:    `https://www.openstreetmap.org/${item.osm_type}/${item.osm_id}`,
    category,
    categoryCode: '',
    categoryName: item.type || item.class || '',
  }
}

// ──────────────────────────────────────────────
// Nominatim 요청 (rate limit + sessionStorage 캐시)
// ──────────────────────────────────────────────

let _lastNominatimTime = 0

async function nominatimFetch(query) {
  const cacheKey = `nom_${query}`
  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {}

  const now = Date.now()
  const delay = Math.max(0, 1100 - (now - _lastNominatimTime))
  if (delay > 0) await new Promise(r => setTimeout(r, delay))
  _lastNominatimTime = Date.now()

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&accept-language=ko`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Triplet-Travel-App/1.0 (contact@example.com)' },
  })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  const data = await res.json()

  try { sessionStorage.setItem(cacheKey, JSON.stringify(data)) } catch {}
  return data
}

// ──────────────────────────────────────────────
// 카카오 REST API 검색 (VITE_KAKAO_REST_API_KEY 있을 때)
// ──────────────────────────────────────────────

async function kakaoRestSearch(query) {
  const key = import.meta.env.VITE_KAKAO_REST_API_KEY
  if (!key) return []
  const url =
    `https://dapi.kakao.com/v2/local/search/keyword.json` +
    `?query=${encodeURIComponent(query)}&size=7`
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.documents || []).map(normalizeKakao)
}

// ──────────────────────────────────────────────
// 카카오 SDK Places 검색 (REST 키 없을 때 fallback)
// ──────────────────────────────────────────────

function kakaoSdkSearch(query) {
  return new Promise(resolve => {
    if (!window.kakao?.maps?.services) { resolve([]); return }
    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(query, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        resolve(data.slice(0, 7).map(normalizeKakao))
      } else {
        resolve([])
      }
    })
  })
}

async function kakaoSearch(query) {
  const restKey = import.meta.env.VITE_KAKAO_REST_API_KEY
  if (restKey) return kakaoRestSearch(query)
  return kakaoSdkSearch(query)
}

// ──────────────────────────────────────────────
// 중복 제거 (lat/lng 근접 0.0005° ≈ 50m)
// ──────────────────────────────────────────────

function dedup(items) {
  const seen = []
  return items.filter(item => {
    const near = seen.some(s =>
      Math.abs(s.lat - item.lat) < 0.0005 &&
      Math.abs(s.lng - item.lng) < 0.0005
    )
    if (near) return false
    seen.push(item)
    return true
  })
}

// ──────────────────────────────────────────────
// 여행 컨텍스트 판단
// ──────────────────────────────────────────────

const DOMESTIC_CITIES = ['서울', '부산', '제주', '인천', '대구', '광주', '대전', '울산', '수원', '경주', '속초', '강릉']

export function getSearchContext(cities = []) {
  const hasKoreanCity = cities.some(c => DOMESTIC_CITIES.includes(c))
  const hasOverseas = cities.some(c => !DOMESTIC_CITIES.includes(c))
  if (hasOverseas && !hasKoreanCity) return 'overseas'
  if (hasKoreanCity && !hasOverseas) return 'domestic'
  return 'mixed'
}

// ──────────────────────────────────────────────
// 메인 검색 함수
// ──────────────────────────────────────────────

/**
 * @param {string} keyword 검색어
 * @param {'domestic'|'overseas'|'mixed'|'auto'} countryContext
 * @returns {Promise<Array>} 공통 포맷 결과 배열
 */
export async function searchPlace(keyword, countryContext = 'auto') {
  if (!keyword || keyword.trim().length < 2) return []

  const isKorean = hasKorean(keyword)
  const isOverseas = countryContext === 'overseas'
  const isDomestic = countryContext === 'domestic' || (countryContext === 'auto' && isKorean)

  if (isDomestic && !isOverseas) {
    // 카카오 우선 → 결과 없으면 Nominatim fallback
    const kakaoResults = await kakaoSearch(keyword)
    if (kakaoResults.length > 0) return kakaoResults
    try {
      const nomData = await nominatimFetch(keyword)
      return nomData.map(normalizeNominatim)
    } catch {
      return []
    }
  }

  if (isOverseas) {
    // Nominatim 우선 + 카카오 병행 (한인 식당 등)
    const [nomSettled, kakaoSettled] = await Promise.allSettled([
      nominatimFetch(keyword),
      kakaoSearch(keyword),
    ])
    const nomResults = nomSettled.status === 'fulfilled'
      ? nomSettled.value.map(normalizeNominatim)
      : []
    const kakaoResults = kakaoSettled.status === 'fulfilled' ? kakaoSettled.value : []
    return dedup([...nomResults, ...kakaoResults])
  }

  // mixed / auto + 영문: 두 소스 병렬
  const [nomSettled, kakaoSettled] = await Promise.allSettled([
    nominatimFetch(keyword),
    kakaoSearch(keyword),
  ])
  const kakaoFirst = kakaoSettled.status === 'fulfilled' ? kakaoSettled.value : []
  const nomResults = nomSettled.status === 'fulfilled'
    ? nomSettled.value.map(normalizeNominatim)
    : []
  return dedup([...kakaoFirst, ...nomResults])
}

export { CATEGORY_ICONS }
