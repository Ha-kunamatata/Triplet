import { useEffect, useRef, useState, useMemo } from 'react'
import { loadKakaoMaps } from '../../utils/kakaoMaps'

/* ── Day palette (up to 15 days) ───────────────────────── */
const DAY_COLORS = [
  '#3B82F6','#8B5CF6','#EC4899','#F97316','#10B981',
  '#EF4444','#FBBF24','#06B6D4','#84CC16','#6366F1',
  '#14B8A6','#F43F5E','#A855F7','#22C55E','#FB923C',
]

/* ── Category meta ──────────────────────────────────────── */
const CAT_COLORS = {
  attraction:'#1D9E75', restaurant:'#EF9F27', cafe:'#7F77DD',
  accommodation:'#378ADD', transport:'#7C3AED', shopping:'#EC4899', etc:'#94A3B8',
  FLIGHT:'#D4537E', STAY:'#378ADD', PLACE:'#1D9E75', TRANSPORT:'#7C3AED', MEMO:'#F59E0B',
}

const CAT_EMOJI = {
  attraction:'🗺️', restaurant:'🍽️', cafe:'☕', accommodation:'🏨',
  transport:'🚗', shopping:'🛍️', etc:'📌',
  FLIGHT:'✈️', STAY:'🏨', PLACE:'📍', TRANSPORT:'🚌', MEMO:'📝',
}

function getColor(item) { return CAT_COLORS[item.type ?? item.category] ?? '#3B82F6' }
function getEmoji(item) { return CAT_EMOJI[item.type ?? item.category] ?? '📍' }
function getTitle(item) {
  return item.title || item.name || item.flightNumber || item.fromName || '장소'
}

/* ── SVG pin marker ─────────────────────────────────────── */
function makePinSVG(color, emoji, num) {
  const label = num > 9 ? '•' : String(num)
  return 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="52" viewBox="0 0 36 52">
      <defs>
        <filter id="sh" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.28"/>
        </filter>
      </defs>
      <path d="M18 2C10.3 2 4 8.3 4 16C4 27.5 18 50 18 50S32 27.5 32 16C32 8.3 25.7 2 18 2Z" fill="${color}" filter="url(#sh)"/>
      <circle cx="18" cy="16" r="11.5" fill="white"/>
      <text x="18" y="20.5" text-anchor="middle" font-size="13" font-family="-apple-system,system-ui,sans-serif">${emoji}</text>
      <circle cx="29" cy="7" r="8" fill="#0F172A" stroke="white" stroke-width="1.5"/>
      <text x="29" y="10.5" text-anchor="middle" fill="white" font-size="8" font-weight="900" font-family="-apple-system,system-ui,sans-serif">${label}</text>
    </svg>`,
  )
}

/* ── Rich popup DOM ─────────────────────────────────────── */
function makeInfoDOM(item, color, dayNum, markerColor) {
  const title = getTitle(item)
  const emoji = getEmoji(item)
  const time = item.startTime || item.visitTime || item.departureTime?.slice(11, 16) || ''
  const place = item.place || item.address || item.name || ''
  const cost = item.cost > 0 ? `${Number(item.cost).toLocaleString('ko-KR')}원` : ''
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(title)},${item.lat},${item.lng}`
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`

  const div = document.createElement('div')
  div.style.cssText = [
    'min-width:210px;max-width:270px;',
    'background:#fff;border-radius:18px;',
    'box-shadow:0 8px 36px rgba(0,0,0,0.22);',
    'font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;',
    'overflow:hidden;',
  ].join('')

  div.innerHTML = `
    <div style="background:${markerColor};padding:12px 14px 10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
        <div style="display:flex;align-items:center;gap:5px">
          ${dayNum ? `<span style="background:rgba(0,0,0,0.2);color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:20px;letter-spacing:0.3px">Day ${dayNum}</span>` : ''}
          <span style="font-size:16px;line-height:1">${emoji}</span>
        </div>
        <button class="iw-close" style="width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,0.2);border:none;color:rgba(255,255,255,0.9);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;line-height:1;flex-shrink:0">✕</button>
      </div>
      <p style="color:#fff;font-size:15px;font-weight:800;line-height:1.25;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</p>
      ${time ? `<p style="color:rgba(255,255,255,0.85);font-size:11px;margin-top:4px;font-weight:500">⏰ ${time}</p>` : ''}
    </div>
    <div style="padding:10px 14px 12px">
      ${place ? `<p style="font-size:12px;color:#64748B;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${place}</p>` : ''}
      ${cost ? `<p style="font-size:15px;font-weight:800;color:${color};margin-bottom:8px">${cost}</p>` : ''}
      <div style="display:flex;gap:7px">
        <a href="${kakaoUrl}" target="_blank" rel="noopener"
          style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:700;background:#FFCD29;color:#3C1E1E;padding:8px 6px;border-radius:10px;text-decoration:none">
          🗺️ 카카오맵
        </a>
        <a href="${googleUrl}" target="_blank" rel="noopener"
          style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:700;background:#4285F4;color:#fff;padding:8px 6px;border-radius:10px;text-decoration:none">
          🌍 구글맵
        </a>
      </div>
    </div>
  `
  return div
}

/* ── Main Component ─────────────────────────────────────── */
export default function TripMap({
  schedules    = [],
  tripItems    = [],
  dates        = [],
  selectedDate = null,
  height       = 420,
}) {
  const mapRef       = useRef(null)
  const mapInst      = useRef(null)
  const markersRef   = useRef([])
  const polylinesRef = useRef([])
  const clusterRef   = useRef(null)

  const [status,   setStatus]   = useState('idle')
  const [showAll,  setShowAll]  = useState(false)
  const [locating, setLocating] = useState(false)

  const apiKey = import.meta.env.VITE_KAKAO_MAPS_API_KEY

  /* All geo-tagged items (merged) */
  const allGeoItems = useMemo(() => {
    const res = []
    schedules.forEach(s => { if (s.lat && s.lng) res.push({ ...s, _src: 'sched' }) })
    tripItems.forEach(i => { if (i.lat && i.lng) res.push({ ...i, _src: 'item' }) })
    return res
  }, [schedules, tripItems])

  /* Items for currently-selected day */
  const dayGeoItems = useMemo(() => {
    if (!selectedDate) return allGeoItems
    return allGeoItems.filter(i => i.date === selectedDate || i.checkIn === selectedDate)
  }, [allGeoItems, selectedDate])

  /* ── Initialize map once ─────────────────────────────── */
  useEffect(() => {
    if (!apiKey)                { setStatus('no-key');    return }
    if (allGeoItems.length === 0) { setStatus('no-coords'); return }
    if (mapInst.current)          { setStatus('ready');     return }

    setStatus('loading')
    loadKakaoMaps(apiKey)
      .then(() => {
        if (!mapRef.current) return
        const kakao = window.kakao.maps
        const first = allGeoItems[0]
        const map   = new kakao.Map(mapRef.current, {
          center: new kakao.LatLng(first.lat, first.lng),
          level: 5,
        })
        mapInst.current = map

        if (kakao.MarkerClusterer) {
          clusterRef.current = new kakao.MarkerClusterer({
            map,
            averageCenter: true,
            minLevel: 6,
            styles: [{
              width: '44px', height: '44px',
              background: 'rgba(59,130,246,0.9)',
              borderRadius: '50%', color: '#fff',
              textAlign: 'center', fontWeight: '800',
              lineHeight: '44px', fontSize: '14px',
              boxShadow: '0 4px 14px rgba(59,130,246,0.45)',
            }],
          })
        }
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [apiKey, allGeoItems.length])

  /* ── Refresh markers & polylines ─────────────────────── */
  useEffect(() => {
    if (status !== 'ready' || !mapInst.current || !window.kakao?.maps) return
    const kakao = window.kakao.maps
    const map   = mapInst.current

    /* Clear previous */
    markersRef.current.forEach(({ marker, overlay }) => {
      marker.setMap(null); overlay?.setMap(null)
    })
    markersRef.current = []
    polylinesRef.current.forEach(p => p.setMap(null))
    polylinesRef.current = []
    clusterRef.current?.clear()

    const items = showAll ? allGeoItems : dayGeoItems
    if (items.length === 0) return

    let activeOverlay = null
    const newMarkers  = []

    items.forEach((item, idx) => {
      const color    = getColor(item)
      const dateKey  = item.date || item.checkIn || ''
      const dayIdx   = dates.indexOf(dateKey)
      const markerColor = showAll
        ? DAY_COLORS[dayIdx >= 0 ? dayIdx % DAY_COLORS.length : 0]
        : color
      const pos = new kakao.LatLng(item.lat, item.lng)

      const mImg = new kakao.MarkerImage(
        makePinSVG(markerColor, getEmoji(item), idx + 1),
        new kakao.Size(36, 52),
        { offset: new kakao.Point(18, 52) },
      )
      const marker = new kakao.Marker({ position: pos, image: mImg })

      const infoDOM = makeInfoDOM(item, color, dayIdx >= 0 ? dayIdx + 1 : undefined, markerColor)
      const overlay = new kakao.CustomOverlay({
        position: pos, content: infoDOM,
        xAnchor: 0.5, yAnchor: 2.1, zIndex: 10,
      })

      infoDOM.querySelector('.iw-close')?.addEventListener('click', e => {
        e.stopPropagation(); overlay.setMap(null); activeOverlay = null
      })
      kakao.event.addListener(marker, 'click', () => {
        if (activeOverlay && activeOverlay !== overlay) activeOverlay.setMap(null)
        if (activeOverlay === overlay) {
          overlay.setMap(null); activeOverlay = null
        } else {
          overlay.setMap(map); map.panTo(pos); activeOverlay = overlay
        }
      })

      newMarkers.push({ marker, overlay })
      /* add directly unless clustering */
      if (!(showAll && items.length >= 8)) marker.setMap(map)
    })
    markersRef.current = newMarkers

    if (showAll && items.length >= 8 && clusterRef.current) {
      clusterRef.current.addMarkers(newMarkers.map(m => m.marker))
    }

    /* Route polylines */
    const addPolyline = (pts, color) => {
      if (pts.length < 2) return
      polylinesRef.current.push(new kakao.Polyline({
        map, path: pts.map(p => new kakao.LatLng(p.lat, p.lng)),
        strokeWeight: 3, strokeColor: color, strokeOpacity: 0.7, strokeStyle: 'shortdash',
      }))
    }

    if (showAll) {
      const byDay = {}
      items.forEach(i => {
        const d = i.date || i.checkIn || '__'
        ;(byDay[d] = byDay[d] ?? []).push(i)
      })
      Object.entries(byDay).forEach(([d, pts]) => {
        const dIdx = dates.indexOf(d)
        addPolyline(pts, DAY_COLORS[dIdx >= 0 ? dIdx % DAY_COLORS.length : 0])
      })
    } else {
      addPolyline(items, '#3B82F6')
    }

    /* Fit bounds */
    if (items.length === 1) {
      map.setCenter(new kakao.LatLng(items[0].lat, items[0].lng))
      map.setLevel(4)
    } else {
      const bounds = new kakao.LatLngBounds()
      items.forEach(i => bounds.extend(new kakao.LatLng(i.lat, i.lng)))
      map.setBounds(bounds, 60)
    }
  }, [status, showAll, dayGeoItems, allGeoItems, dates])

  /* ── Actions ─────────────────────────────────────────── */
  function locate() {
    if (!mapInst.current || !navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setLocating(false)
        mapInst.current.setCenter(new window.kakao.maps.LatLng(latitude, longitude))
        mapInst.current.setLevel(3)
      },
      () => setLocating(false),
    )
  }

  function fitBounds() {
    const items = showAll ? allGeoItems : dayGeoItems
    if (!items.length || !mapInst.current) return
    const kakao = window.kakao.maps
    if (items.length === 1) {
      mapInst.current.setCenter(new kakao.LatLng(items[0].lat, items[0].lng))
      mapInst.current.setLevel(4)
    } else {
      const bounds = new kakao.LatLngBounds()
      items.forEach(i => bounds.extend(new kakao.LatLng(i.lat, i.lng)))
      mapInst.current.setBounds(bounds, 60)
    }
  }

  /* ── Placeholders ────────────────────────────────────── */
  if (status === 'no-key')    return <MapPlaceholder icon="map" title="카카오맵 설정 필요" desc="VITE_KAKAO_MAPS_API_KEY를 설정하세요" />
  if (status === 'no-coords') return <MapPlaceholder icon="location_off" title="지도에 표시할 위치가 없어요" desc="장소 검색으로 위치를 등록하면 여기에 나타납니다" dim />
  if (status === 'error')     return <MapPlaceholder icon="error" title="지도를 불러오지 못했습니다" desc="잠시 후 다시 시도해 주세요" error />

  const displayCount = (showAll ? allGeoItems : dayGeoItems).length

  return (
    <div style={{ position: 'relative', width: '100%', height, background: '#E2E8F0', overflow: 'hidden' }}>

      {/* Loading overlay */}
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 2, background: '#F1F5F9' }}>
          <div style={{ width: 40, height: 40, border: '3.5px solid #E2E8F0', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'mapSpin 0.8s linear infinite' }} />
          <p style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>지도 불러오는 중...</p>
        </div>
      )}

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {status === 'ready' && (
        <>
          {/* ── Top-left: mode toggle + legend ── */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 165 }}>

            {/* Today / All toggle */}
            <button
              onClick={() => setShowAll(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: showAll ? '#3B82F6' : 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                color: showAll ? '#fff' : '#0F172A',
                border: 'none', borderRadius: 22, padding: '8px 16px',
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                boxShadow: showAll
                  ? '0 4px 16px rgba(59,130,246,0.45)'
                  : '0 2px 14px rgba(0,0,0,0.16)',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 15 }}>{showAll ? '🗺️' : '📅'}</span>
              {showAll ? '전체 여행' : '오늘 일정'}
            </button>

            {/* Day legend (all-mode) */}
            {showAll && dates.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)', borderRadius: 14,
                padding: '8px 12px', boxShadow: '0 2px 14px rgba(0,0,0,0.14)',
                maxHeight: 180, overflowY: 'auto',
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>Day 색상</p>
                {dates.map((d, i) => (
                  <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: DAY_COLORS[i % DAY_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#0F172A', fontWeight: 700 }}>Day {i + 1}</span>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>{d.slice(5).replace('-', '/')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Place count pill */}
            {displayCount > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 20, padding: '5px 12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>📍 {displayCount}곳</span>
              </div>
            )}
          </div>

          {/* ── Top-right: control buttons ── */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              {
                icon: locating ? 'progress_activity' : 'my_location',
                onClick: locate,
                title: '현재 위치',
                color: locating ? '#94A3B8' : '#3B82F6',
              },
              {
                icon: 'add',
                onClick: () => mapInst.current?.setLevel(Math.max(1, mapInst.current.getLevel() - 1)),
                title: '확대',
                color: '#0F172A',
              },
              {
                icon: 'remove',
                onClick: () => mapInst.current?.setLevel(Math.min(14, mapInst.current.getLevel() + 1)),
                title: '축소',
                color: '#0F172A',
              },
            ].map(({ icon, onClick, title, color }) => (
              <button
                key={icon}
                onClick={onClick}
                title={title}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 14px rgba(0,0,0,0.16)', color,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = '' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </button>
            ))}
          </div>

          {/* ── Bottom-right: fit bounds ── */}
          <button
            onClick={fitBounds}
            style={{
              position: 'absolute', bottom: 14, right: 14, zIndex: 5,
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: 'none', borderRadius: 22, padding: '8px 14px',
              fontSize: 12, fontWeight: 700, color: '#0F172A', cursor: 'pointer',
              boxShadow: '0 2px 14px rgba(0,0,0,0.16)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>fit_screen</span>
            전체 보기
          </button>
        </>
      )}

      <style>{`@keyframes mapSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── Placeholder ─────────────────────────────────────────── */
function MapPlaceholder({ icon, title, desc, dim, error }) {
  const color = error ? '#EF4444' : dim ? '#94A3B8' : '#3B82F6'
  const bg    = error ? '#FEF2F2' : '#F8FAFC'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 24px', background: bg, textAlign: 'center', gap: 12, minHeight: 200 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: error ? '#FEE2E2' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{title}</p>
      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>{desc}</p>
    </div>
  )
}
