import { useEffect, useRef, useState, useMemo } from 'react'
import { loadGoogleMaps, MAP_STYLE } from '../../utils/googleMaps'
import { SCHEDULE_CATEGORIES } from '../../constants'

export default function TripMap({ schedules = [], height = 400 }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const polylineRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | loading | ready | no-key | no-coords | error
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const geoSchedules = useMemo(
    () => schedules.filter(s => s.lat && s.lng),
    [schedules],
  )

  useEffect(() => {
    if (!apiKey) { setStatus('no-key'); return }
    if (geoSchedules.length === 0) { setStatus('no-coords'); return }
    setStatus('loading')

    loadGoogleMaps(apiKey)
      .then(() => {
        if (!mapRef.current) return

        const bounds = new window.google.maps.LatLngBounds()
        geoSchedules.forEach(s => bounds.extend({ lat: s.lat, lng: s.lng }))

        const map = new window.google.maps.Map(mapRef.current, {
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
          styles: MAP_STYLE,
          gestureHandling: 'cooperative',
        })
        map.fitBounds(bounds, { top: 60, right: 30, bottom: 30, left: 30 })
        mapInstanceRef.current = map

        // Clear previous markers
        markersRef.current.forEach(m => m.setMap(null))
        markersRef.current = []
        if (polylineRef.current) polylineRef.current.setMap(null)

        // Add numbered markers
        geoSchedules.forEach((s, idx) => {
          const cat = SCHEDULE_CATEGORIES.find(c => c.key === s.category) ?? SCHEDULE_CATEGORIES.at(-1)

          const marker = new window.google.maps.Marker({
            position: { lat: s.lat, lng: s.lng },
            map,
            title: s.title,
            label: { text: String(idx + 1), color: '#fff', fontWeight: 'bold', fontSize: '11px' },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: cat.color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2.5,
              scale: 14,
            },
            zIndex: geoSchedules.length - idx,
          })

          const infoContent = `
            <div style="font-family:-apple-system,sans-serif;padding:2px 4px;min-width:120px">
              <b style="font-size:13px;color:#0F172A">${s.title}</b>
              ${s.startTime ? `<p style="font-size:11px;color:#64748B;margin-top:3px">🕐 ${s.startTime}${s.endTime ? ' – ' + s.endTime : ''}</p>` : ''}
              ${s.place ? `<p style="font-size:11px;color:#64748B;margin-top:2px">📍 ${s.place}</p>` : ''}
              ${s.cost > 0 ? `<p style="font-size:12px;color:#3B82F6;font-weight:700;margin-top:4px">${Number(s.cost).toLocaleString('ko-KR')}원</p>` : ''}
            </div>
          `
          const infoWindow = new window.google.maps.InfoWindow({ content: infoContent })
          marker.addListener('click', () => {
            markersRef.current.forEach(m => m.infoWindow?.close())
            infoWindow.open(map, marker)
          })
          marker.infoWindow = infoWindow
          markersRef.current.push(marker)
        })

        // Route polyline with arrows
        if (geoSchedules.length > 1) {
          const path = geoSchedules.map(s => ({ lat: s.lat, lng: s.lng }))
          polylineRef.current = new window.google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#3B82F6',
            strokeOpacity: 0.75,
            strokeWeight: 3,
            map,
            icons: [{
              icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: '#3B82F6', fillOpacity: 1, strokeWeight: 0 },
              offset: '50%',
              repeat: '120px',
            }],
          })
        }

        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [apiKey, geoSchedules])

  // ── Placeholder states ──
  if (status === 'no-key') return <MapNoKey />
  if (status === 'no-coords') return <MapNoCoords schedules={schedules} />
  if (status === 'error') return <MapError />

  return (
    <div style={{ position: 'relative', width: '100%', height, background: '#f1f5f9' }}>
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 2, background: '#F1F5F9' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ fontSize: 13, color: 'var(--c-text-3)' }}>지도 불러오는 중...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

function MapNoKey() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', background: '#F8FAFC', textAlign: 'center', gap: 10,
    }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--c-primary)' }}>map</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text-1)' }}>Google Maps 설정 필요</p>
      <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.6 }}>
        GitHub 저장소 Settings → Secrets에<br />
        <code style={{ background: 'var(--c-surface2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>VITE_GOOGLE_MAPS_API_KEY</code> 를 추가하세요.
      </p>
    </div>
  )
}

function MapNoCoords({ schedules }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', background: '#F8FAFC', textAlign: 'center', gap: 10,
    }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--c-text-3)' }}>location_off</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text-1)' }}>지도에 표시할 위치가 없어요</p>
      <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.6 }}>
        일정 추가 시 장소 검색을 통해<br />위치를 등록하면 지도에 표시됩니다.
      </p>
      {schedules.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 4 }}>
          현재 {schedules.length}개 일정에 위치 정보가 없습니다
        </p>
      )}
    </div>
  )
}

function MapError() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#FEF2F2', textAlign: 'center', gap: 8 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--c-error)' }}>error</span>
      <p style={{ fontSize: 14, color: 'var(--c-error)' }}>지도를 불러오지 못했습니다</p>
    </div>
  )
}
