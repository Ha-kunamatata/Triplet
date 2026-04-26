import { useEffect, useRef, useState, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* Suppress Leaflet's broken default icon in bundlers */
delete L.Icon.Default.prototype._getIconUrl

/* ── Constants ──────────────────────────────────────────── */
const DAY_COLORS = [
  '#3B82F6','#8B5CF6','#EC4899','#F97316','#10B981',
  '#EF4444','#F59E0B','#06B6D4','#84CC16','#6366F1',
  '#14B8A6','#F43F5E','#A855F7','#22C55E','#FB923C',
]

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

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

function getColor(item)  { return CAT_COLORS[item.type ?? item.category] ?? '#3B82F6' }
function getEmoji(item)  { return CAT_EMOJI[item.type ?? item.category] ?? '📍' }
function getTitle(item)  { return item.title || item.name || item.flightNumber || item.fromName || '장소' }

/* ── Custom pin marker ──────────────────────────────────── */
function makeDivIcon(color, emoji, num) {
  const label = num > 9 ? '…' : String(num)
  return L.divIcon({
    className: '',
    iconSize:  [44, 62],
    iconAnchor:[22, 62],
    popupAnchor:[0, -64],
    html: `
      <div style="width:44px;height:62px;position:relative;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.38))">
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="62" viewBox="0 0 44 62">
          <path d="M22 2C13 2 5.5 9.5 5.5 18.5C5.5 32.5 22 60 22 60S38.5 32.5 38.5 18.5C38.5 9.5 31 2 22 2Z" fill="${color}"/>
          <circle cx="22" cy="18.5" r="13.5" fill="white"/>
          <circle cx="36" cy="8" r="9.5" fill="#0F172A" stroke="white" stroke-width="2"/>
          <text x="36" y="12" text-anchor="middle" fill="white" font-size="9" font-weight="900" font-family="system-ui,-apple-system,sans-serif">${esc(label)}</text>
        </svg>
        <div style="position:absolute;top:4px;left:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;pointer-events:none;user-select:none">${emoji}</div>
      </div>`,
  })
}

/* ── Popup HTML ─────────────────────────────────────────── */
function makePopupHTML(item, color, dayNum, markerColor) {
  const title    = esc(getTitle(item))
  const emoji    = getEmoji(item)
  const time     = esc(item.startTime || item.visitTime || item.departureTime?.slice(11,16) || '')
  const place    = esc(item.place || item.address || item.name || '')
  const cost     = item.cost > 0 ? `${Number(item.cost).toLocaleString('ko-KR')}원` : ''
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(getTitle(item))},${item.lat},${item.lng}`
  const googleUrl= `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`
  return `
    <div class="tmap-popup">
      <div class="tmap-popup-header" style="background:${markerColor}">
        <div class="tmap-popup-meta">
          ${dayNum ? `<span class="tmap-day-badge">Day ${dayNum}</span>` : ''}
          <span style="font-size:16px">${emoji}</span>
        </div>
        <p class="tmap-popup-title">${title}</p>
        ${time ? `<p class="tmap-popup-time">⏰ ${time}</p>` : ''}
      </div>
      <div class="tmap-popup-body">
        ${place ? `<p class="tmap-popup-place">${place}</p>` : ''}
        ${cost  ? `<p class="tmap-popup-cost" style="color:${color}">${cost}</p>` : ''}
        <div class="tmap-nav-row">
          <a href="${kakaoUrl}" target="_blank" rel="noopener" class="tmap-nav-btn tmap-nav-kakao">🗺️ 카카오맵</a>
          <a href="${googleUrl}" target="_blank" rel="noopener" class="tmap-nav-btn tmap-nav-google">🌍 구글맵</a>
        </div>
      </div>
    </div>`
}

/* ── MapControl button helper ───────────────────────────── */
function MapBtn({ icon, title, onClick, active, children, style: extraStyle }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        background: active ? '#3B82F6' : 'rgba(255,255,255,0.97)',
        backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
        color: active ? '#fff' : '#0F172A',
        border:'none', borderRadius: children ? 22 : '50%',
        padding: children ? '8px 16px' : 0,
        width: children ? 'auto' : 44, height: 44,
        fontSize:13, fontWeight:800, cursor:'pointer',
        boxShadow: active
          ? '0 4px 18px rgba(59,130,246,0.5)'
          : '0 2px 14px rgba(0,0,0,0.18)',
        transition:'all 0.18s',
        flexShrink:0,
        ...extraStyle,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.transform='scale(1.08)' }}
      onMouseLeave={e => { e.currentTarget.style.transform='' }}
    >
      {icon && <span className="material-symbols-outlined" style={{ fontSize:20, fontVariationSettings:"'FILL' 1" }}>{icon}</span>}
      {children}
    </button>
  )
}

/* ── Main Component ─────────────────────────────────────── */
export default function TripMap({
  schedules    = [],
  tripItems    = [],
  dates        = [],
  selectedDate = null,
  height       = 'clamp(300px,55vh,520px)',
}) {
  const mapContainerRef = useRef(null)
  const mapRef          = useRef(null)    // Leaflet Map instance
  const markersRef      = useRef(null)    // L.LayerGroup
  const linesRef        = useRef(null)    // L.LayerGroup
  const [status,   setStatus]   = useState('idle')
  const [showAll,  setShowAll]  = useState(false)
  const [locating, setLocating] = useState(false)

  const allGeoItems = useMemo(() => {
    const res = []
    schedules.forEach(s => { if (s.lat && s.lng) res.push({ ...s, _src:'sched' }) })
    tripItems.forEach(i => { if (i.lat && i.lng) res.push({ ...i, _src:'item'  }) })
    return res
  }, [schedules, tripItems])

  const dayGeoItems = useMemo(() => {
    if (!selectedDate) return allGeoItems
    return allGeoItems.filter(i => i.date === selectedDate || i.checkIn === selectedDate)
  }, [allGeoItems, selectedDate])

  /* ── Init map (once, when items are available) ────────── */
  useEffect(() => {
    if (allGeoItems.length === 0) { setStatus('no-coords'); return }
    if (!mapContainerRef.current || mapRef.current) return

    const first = allGeoItems[0]
    const map = L.map(mapContainerRef.current, {
      center: [first.lat, first.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    markersRef.current = L.layerGroup().addTo(map)
    linesRef.current   = L.layerGroup().addTo(map)
    mapRef.current     = map
    setStatus('ready')

    return () => {
      map.remove()
      mapRef.current     = null
      markersRef.current = null
      linesRef.current   = null
    }
  }, [allGeoItems.length])

  /* ── Update markers & polylines ────────────────────────── */
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return

    markersRef.current.clearLayers()
    linesRef.current.clearLayers()

    const items = showAll ? allGeoItems : dayGeoItems
    if (!items.length) return

    /* Markers */
    items.forEach((item, idx) => {
      const color    = getColor(item)
      const dateKey  = item.date || item.checkIn || ''
      const dayIdx   = dates.indexOf(dateKey)
      const mColor   = showAll
        ? DAY_COLORS[dayIdx >= 0 ? dayIdx % DAY_COLORS.length : 0]
        : color
      const dayNum   = dayIdx >= 0 ? dayIdx + 1 : undefined

      L.marker([item.lat, item.lng], { icon: makeDivIcon(mColor, getEmoji(item), idx + 1) })
        .bindPopup(makePopupHTML(item, color, dayNum, mColor), {
          className: 'tmap-popup-wrap',
          maxWidth: 280,
          minWidth: 220,
        })
        .addTo(markersRef.current)
    })

    /* Polylines */
    const addLine = (pts, color, dashed = false) => {
      if (pts.length < 2) return
      if (dashed) {
        L.polyline(pts.map(p => [p.lat, p.lng]), {
          color, weight: 3, opacity: 0.6, dashArray: '8 6',
        }).addTo(linesRef.current)
      } else {
        // 흰색 외곽선 + 색상 선으로 선명도 향상
        L.polyline(pts.map(p => [p.lat, p.lng]), {
          color: '#fff', weight: 7, opacity: 0.75,
        }).addTo(linesRef.current)
        L.polyline(pts.map(p => [p.lat, p.lng]), {
          color, weight: 4, opacity: 0.9,
        }).addTo(linesRef.current)
      }
    }

    if (showAll) {
      const byDay = {}
      items.forEach(i => {
        const d = i.date || i.checkIn || '__'
        ;(byDay[d] = byDay[d] ?? []).push(i)
      })
      Object.entries(byDay).forEach(([d, pts]) => {
        const dIdx = dates.indexOf(d)
        addLine(pts, DAY_COLORS[dIdx >= 0 ? dIdx % DAY_COLORS.length : 0], true)
      })
    } else {
      addLine(items, '#3B82F6')
    }

    /* Fit */
    if (items.length === 1) {
      mapRef.current.setView([items[0].lat, items[0].lng], 14)
    } else {
      mapRef.current.fitBounds(items.map(i => [i.lat, i.lng]), { padding: [50, 50], maxZoom: 15 })
    }
  }, [status, showAll, dayGeoItems, allGeoItems, dates])

  /* ── Actions ─────────────────────────────────────────── */
  function locate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setLocating(false)
        mapRef.current?.setView([latitude, longitude], 14)
      },
      () => setLocating(false),
    )
  }

  function fitAll() {
    const items = showAll ? allGeoItems : dayGeoItems
    if (!items.length) return
    items.length === 1
      ? mapRef.current?.setView([items[0].lat, items[0].lng], 14)
      : mapRef.current?.fitBounds(items.map(i => [i.lat, i.lng]), { padding: [50, 50] })
  }

  function openGoogleRoute() {
    const items = showAll ? allGeoItems : dayGeoItems
    if (!items.length) return
    const pts = items.map(i => `${i.lat},${i.lng}`)
    const url = pts.length === 1
      ? `https://www.google.com/maps/search/?api=1&query=${pts[0]}`
      : `https://www.google.com/maps/dir/${pts.join('/')}`
    window.open(url, '_blank', 'noopener')
  }

  /* ── Placeholders ────────────────────────────────────── */
  if (status === 'no-coords') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 24px', background:'#F8FAFC', textAlign:'center', gap:14, minHeight:220 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:32, color:'#3B82F6', fontVariationSettings:"'FILL' 1" }}>location_off</span>
        </div>
        <p style={{ fontSize:17, fontWeight:800, color:'#0F172A' }}>지도에 표시할 위치가 없어요</p>
        <p style={{ fontSize:13, color:'#64748B', lineHeight:1.7 }}>일정 추가 시 장소를 검색하면<br/>지도에 경로가 표시됩니다</p>
      </div>
    )
  }

  const displayCount = (showAll ? allGeoItems : dayGeoItems).length

  return (
    <div style={{ position:'relative', width:'100%', height, background:'#E2E8F0' }}>

      {/* Map container */}
      <div ref={mapContainerRef} style={{ width:'100%', height:'100%' }} />

      {status === 'ready' && (
        <>
          {/* ── Top-left controls ── */}
          <div style={{ position:'absolute', top:12, left:12, zIndex:1000, display:'flex', flexDirection:'column', gap:8, maxWidth:170 }}>

            {/* Today / All toggle */}
            <MapBtn active={showAll} onClick={() => setShowAll(p => !p)} style={{ borderRadius:22, width:'auto', padding:'8px 16px' }}>
              <span style={{ fontSize:15 }}>{showAll ? '🗺️' : '📅'}</span>
              {showAll ? '전체 여행' : '오늘 일정'}
            </MapBtn>

            {/* Day legend */}
            {showAll && dates.length > 0 && (
              <div style={{ background:'rgba(255,255,255,0.97)', backdropFilter:'blur(14px)', borderRadius:14, padding:'8px 12px', boxShadow:'0 2px 16px rgba(0,0,0,0.14)', maxHeight:180, overflowY:'auto' }}>
                <p style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:0.6, marginBottom:6 }}>Day 색상</p>
                {dates.map((d, i) => (
                  <div key={d} style={{ display:'flex', alignItems:'center', gap:7, padding:'2px 0' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:DAY_COLORS[i % DAY_COLORS.length], flexShrink:0 }} />
                    <span style={{ fontSize:11, color:'#0F172A', fontWeight:700 }}>Day {i+1}</span>
                    <span style={{ fontSize:10, color:'#94A3B8' }}>{d.slice(5).replace('-','/')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Place count */}
            {displayCount > 0 && (
              <div style={{ background:'rgba(255,255,255,0.97)', backdropFilter:'blur(14px)', borderRadius:20, padding:'5px 12px', boxShadow:'0 2px 10px rgba(0,0,0,0.12)', display:'inline-flex', alignItems:'center', gap:5, alignSelf:'flex-start' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#0F172A' }}>📍 {displayCount}곳</span>
              </div>
            )}
          </div>

          {/* ── Top-right controls ── */}
          <div style={{ position:'absolute', top:12, right:12, zIndex:1000, display:'flex', flexDirection:'column', gap:8 }}>
            <MapBtn icon={locating ? 'progress_activity' : 'my_location'} title="현재 위치" onClick={locate} style={{ color: locating ? '#94A3B8' : '#3B82F6' }} />
            <MapBtn icon="add" title="확대" onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom()||13)+1)} />
            <MapBtn icon="remove" title="축소" onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom()||13)-1)} />
          </div>

          {/* ── Bottom controls ── */}
          <div style={{ position:'absolute', bottom:14, left:12, right:12, zIndex:1000, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            {/* Google Maps route link */}
            <button
              onClick={openGoogleRoute}
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(14px)', border:'none', borderRadius:22, padding:'8px 14px', fontSize:12, fontWeight:800, color:'#0F172A', cursor:'pointer', boxShadow:'0 2px 14px rgba(0,0,0,0.16)' }}
            >
              <span style={{ fontSize:16 }}>🌍</span>구글맵에서 경로 보기
            </button>

            <MapBtn icon="fit_screen" title="전체 보기" onClick={fitAll} style={{ borderRadius:22, width:'auto', padding:'8px 14px', fontSize:12, gap:5 }}>
              전체 보기
            </MapBtn>
          </div>
        </>
      )}

      {/* Leaflet popup & tile override styles */}
      <style>{`
        .tmap-popup-wrap .leaflet-popup-content-wrapper {
          padding:0; border-radius:16px; overflow:hidden;
          box-shadow:0 8px 36px rgba(0,0,0,0.22); border:none;
        }
        .tmap-popup-wrap .leaflet-popup-content { margin:0; }
        .tmap-popup-wrap .leaflet-popup-tip-container { display:none; }
        .tmap-popup { font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif; min-width:210px; }
        .tmap-popup-header { padding:12px 14px 10px; }
        .tmap-popup-meta { display:flex; align-items:center; gap:6px; margin-bottom:5px; }
        .tmap-day-badge { background:rgba(0,0,0,0.22); color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:20px; }
        .tmap-popup-title { color:#fff; font-size:15px; font-weight:800; line-height:1.3; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .tmap-popup-time { color:rgba(255,255,255,0.85); font-size:11px; margin-top:3px; }
        .tmap-popup-body { padding:10px 14px 12px; background:#fff; }
        .tmap-popup-place { font-size:12px; color:#64748B; margin:0 0 5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .tmap-popup-cost { font-size:15px; font-weight:800; margin:0 0 8px; }
        .tmap-nav-row { display:flex; gap:7px; }
        .tmap-nav-btn { flex:1; text-align:center; font-size:12px; font-weight:700; padding:8px 6px; border-radius:10px; text-decoration:none; }
        .tmap-nav-kakao { background:#FFCD29; color:#3C1E1E; }
        .tmap-nav-google { background:#4285F4; color:#fff; }
        .leaflet-control-attribution { font-size:9px !important; }
      `}</style>
    </div>
  )
}
