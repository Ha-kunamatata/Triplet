import { useEffect, useRef, useState, useMemo } from 'react'
import { loadKakaoMaps } from '../../utils/kakaoMaps'
import { SCHEDULE_CATEGORIES, ITEM_TYPES, ITEM_TYPE_META } from '../../constants'

/* ── 카테고리별 색상 ─────────────────────── */
const CAT_COLORS = {
  attraction:    '#1D9E75',
  restaurant:    '#EF9F27',
  cafe:          '#7F77DD',
  accommodation: '#378ADD',
  transport:     '#7C3AED',
  shopping:      '#EC4899',
  etc:           '#94A3B8',
  // tripItem types
  FLIGHT:        '#D4537E',
  STAY:          '#378ADD',
  PLACE:         '#1D9E75',
  TRANSPORT:     '#7C3AED',
  MEMO:          '#F59E0B',
}

function getColor(item) {
  if (item.type) return CAT_COLORS[item.type] ?? '#3B82F6'
  return CAT_COLORS[item.category] ?? '#3B82F6'
}

function getTitle(item) {
  return item.title || item.name || item.flightNumber || item.fromName || '장소'
}

/* ── 핀 마커 SVG 생성 ───────────────────── */
function makePinSVG(color, number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
    <path d="M15 1C8.1 1 2.5 6.6 2.5 13.5C2.5 23.4 15 41 15 41S27.5 23.4 27.5 13.5C27.5 6.6 21.9 1 15 1Z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="15" cy="13.5" r="7" fill="white"/>
    <text x="15" y="17.5" text-anchor="middle" fill="${color}"
      font-size="9" font-weight="700" font-family="-apple-system,sans-serif">${number}</text>
  </svg>`
  return 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svg)
}

/* ── 정보 팝업 DOM 생성 ─────────────────── */
function makeInfoDOM(item, color) {
  const title  = getTitle(item)
  const time   = item.startTime || item.visitTime || item.departureTime?.slice(11, 16) || ''
  const place  = item.place || item.address || ''
  const cost   = item.cost > 0 ? `${Number(item.cost).toLocaleString('ko-KR')}원` : ''
  const lat    = item.lat
  const lng    = item.lng
  const mapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(title)},${lat},${lng}`

  const div = document.createElement('div')
  div.style.cssText = `
    padding:12px 14px;min-width:160px;max-width:220px;
    background:#fff;border-radius:12px;
    box-shadow:0 4px 20px rgba(0,0,0,0.18);
    font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;
    position:relative;
  `
  div.innerHTML = `
    <button class="iw-close" style="
      position:absolute;top:8px;right:8px;
      width:20px;height:20px;border:none;background:none;
      cursor:pointer;font-size:14px;color:#94A3B8;line-height:1;
    ">✕</button>
    <p style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:6px;padding-right:20px;line-height:1.3">${title}</p>
    ${time ? `<p style="font-size:12px;color:#64748B;margin-bottom:3px">⏰ ${time}</p>` : ''}
    ${place ? `<p style="font-size:11px;color:#94A3B8;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${place}</p>` : ''}
    ${cost ? `<p style="font-size:13px;font-weight:700;color:${color};margin-bottom:6px">${cost}</p>` : ''}
    <a href="${mapUrl}" target="_blank" rel="noopener"
      style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#3C1E1E;background:#FFCD29;padding:5px 10px;border-radius:8px;text-decoration:none;">
      🗺️ 카카오맵으로 보기
    </a>
  `
  return div
}

export default function TripMap({ schedules = [], height = 400 }) {
  const mapRef    = useRef(null)
  const [status, setStatus] = useState('idle')
  const apiKey = import.meta.env.VITE_KAKAO_MAPS_API_KEY

  const geoItems = useMemo(
    () => schedules.filter(s => s.lat && s.lng),
    [schedules],
  )

  useEffect(() => {
    if (!apiKey)             { setStatus('no-key');    return }
    if (geoItems.length === 0) { setStatus('no-coords'); return }
    setStatus('loading')

    loadKakaoMaps(apiKey)
      .then(() => {
        if (!mapRef.current) return
        const kakao = window.kakao.maps

        /* 지도 생성 */
        const center = new kakao.LatLng(geoItems[0].lat, geoItems[0].lng)
        const map = new kakao.Map(mapRef.current, { center, level: 5 })

        /* 범위 자동 조정 */
        if (geoItems.length > 1) {
          const bounds = new kakao.LatLngBounds()
          geoItems.forEach(s => bounds.extend(new kakao.LatLng(s.lat, s.lng)))
          map.setBounds(bounds, 60)
        }

        /* 열린 팝업 추적 */
        let activeOverlay = null

        /* 마커 + 팝업 */
        geoItems.forEach((item, idx) => {
          const color = getColor(item)
          const pos   = new kakao.LatLng(item.lat, item.lng)

          /* 핀 마커 이미지 */
          const markerImage = new kakao.MarkerImage(
            makePinSVG(color, idx + 1),
            new kakao.Size(30, 42),
            { offset: new kakao.Point(15, 42) },
          )
          const marker = new kakao.Marker({ position: pos, image: markerImage, map })

          /* 정보 팝업 CustomOverlay */
          const infoDOM = makeInfoDOM(item, color)
          const infoOverlay = new kakao.CustomOverlay({
            position: pos, content: infoDOM,
            xAnchor: 0.5, yAnchor: 1.8,
            zIndex: 10,
          })

          /* 닫기 버튼 */
          infoDOM.querySelector('.iw-close')?.addEventListener('click', e => {
            e.stopPropagation()
            infoOverlay.setMap(null)
            activeOverlay = null
          })

          /* 마커 클릭 → 팝업 토글 */
          kakao.event.addListener(marker, 'click', () => {
            if (activeOverlay && activeOverlay !== infoOverlay) {
              activeOverlay.setMap(null)
            }
            if (activeOverlay === infoOverlay) {
              infoOverlay.setMap(null)
              activeOverlay = null
            } else {
              infoOverlay.setMap(map)
              activeOverlay = infoOverlay
            }
          })
        })

        /* 경로 폴리라인 */
        if (geoItems.length > 1) {
          new kakao.Polyline({
            map,
            path:           geoItems.map(s => new kakao.LatLng(s.lat, s.lng)),
            strokeWeight:   3,
            strokeColor:    '#3B82F6',
            strokeOpacity:  0.65,
            strokeStyle:    'solid',
          })
        }

        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [apiKey, geoItems])

  if (status === 'no-key')    return <MapPlaceholder icon="map" title="카카오맵 설정 필요" desc={<>GitHub Secrets에 <code>VITE_KAKAO_MAPS_API_KEY</code> 를 추가하세요</>} />
  if (status === 'no-coords') return <MapPlaceholder icon="location_off" title="지도에 표시할 위치가 없어요" desc="장소 검색으로 위치를 등록하면 여기에 나타납니다" dim />
  if (status === 'error')     return <MapPlaceholder icon="error" title="지도를 불러오지 못했습니다" desc="잠시 후 다시 시도해 주세요" error />

  return (
    <div style={{ position: 'relative', width: '100%', height, background: '#E2E8F0', overflow: 'hidden' }}>
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 2, background: '#F1F5F9' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ fontSize: 13, color: 'var(--c-text-3)' }}>지도 불러오는 중...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* 범례 */}
      {status === 'ready' && geoItems.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 10, left: 10, zIndex: 5,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
          borderRadius: 10, padding: '6px 10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 11, color: '#64748B' }}>📍 {geoItems.length}개 장소</span>
        </div>
      )}
    </div>
  )
}

function MapPlaceholder({ icon, title, desc, dim, error }) {
  const color = error ? 'var(--c-error)' : dim ? 'var(--c-text-3)' : 'var(--c-primary)'
  const bg    = error ? '#FEF2F2' : 'var(--c-surface2)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 24px', background: bg, textAlign: 'center', gap: 10 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: error ? '#FEE2E2' : 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 26, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text-1)' }}>{title}</p>
      <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.7 }}>{desc}</p>
    </div>
  )
}
