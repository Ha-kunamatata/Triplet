import { useEffect, useRef, useState, useMemo } from 'react'
import { loadKakaoMaps } from '../../utils/kakaoMaps'
import { SCHEDULE_CATEGORIES } from '../../constants'

export default function TripMap({ schedules = [], height = 400 }) {
  const mapRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const apiKey = import.meta.env.VITE_KAKAO_MAPS_API_KEY

  const geoSchedules = useMemo(
    () => schedules.filter(s => s.lat && s.lng),
    [schedules],
  )

  useEffect(() => {
    if (!apiKey) { setStatus('no-key'); return }
    if (geoSchedules.length === 0) { setStatus('no-coords'); return }
    setStatus('loading')

    loadKakaoMaps(apiKey)
      .then(() => {
        if (!mapRef.current) return

        const kakao = window.kakao.maps
        const center = new kakao.LatLng(geoSchedules[0].lat, geoSchedules[0].lng)
        const map = new kakao.Map(mapRef.current, { center, level: 5 })

        // 범위 자동 조정
        if (geoSchedules.length > 1) {
          const bounds = new kakao.LatLngBounds()
          geoSchedules.forEach(s => bounds.extend(new kakao.LatLng(s.lat, s.lng)))
          map.setBounds(bounds)
        }

        // 번호 마커 (CustomOverlay)
        geoSchedules.forEach((s, idx) => {
          const cat = SCHEDULE_CATEGORIES.find(c => c.key === s.category) ?? SCHEDULE_CATEGORIES.at(-1)
          const pos = new kakao.LatLng(s.lat, s.lng)

          const content = `
            <div style="
              width:28px;height:28px;border-radius:50%;
              background:${cat.color};color:#fff;
              display:flex;align-items:center;justify-content:center;
              font-size:12px;font-weight:700;font-family:-apple-system,sans-serif;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
              border:2.5px solid #fff;
              cursor:pointer;
            ">${idx + 1}</div>
          `

          const overlay = new kakao.CustomOverlay({
            position: pos,
            content,
            yAnchor: 1.2,
          })
          overlay.setMap(map)

          // 말풍선 InfoWindow
          const infoContent = `
            <div style="
              padding:10px 13px;min-width:140px;max-width:200px;
              font-family:-apple-system,sans-serif;
              background:#fff;border-radius:10px;
              box-shadow:0 3px 12px rgba(0,0,0,0.15);
            ">
              <b style="font-size:13px;color:#0F172A;display:block;margin-bottom:4px">${s.title}</b>
              ${s.startTime ? `<span style="font-size:11px;color:#64748B">🕐 ${s.startTime}${s.endTime ? ' – ' + s.endTime : ''}</span><br>` : ''}
              ${s.place ? `<span style="font-size:11px;color:#64748B">📍 ${s.place}</span><br>` : ''}
              ${s.cost > 0 ? `<span style="font-size:12px;color:#3B82F6;font-weight:700">${Number(s.cost).toLocaleString('ko-KR')}원</span>` : ''}
            </div>
          `
          const infoWindow = new kakao.InfoWindow({ content: infoContent, removable: true })

          overlay.getContent && overlay.getContent()
          const el = overlay.getContent?.()
          if (el && typeof el === 'object') {
            el.addEventListener?.('click', () => infoWindow.open(map, new kakao.Marker({ position: pos })))
          }
        })

        // 경로 폴리라인
        if (geoSchedules.length > 1) {
          new kakao.Polyline({
            map,
            path: geoSchedules.map(s => new kakao.LatLng(s.lat, s.lng)),
            strokeWeight: 3,
            strokeColor: '#3B82F6',
            strokeOpacity: 0.75,
            strokeStyle: 'solid',
          })
        }

        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [apiKey, geoSchedules])

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#F8FAFC', textAlign: 'center', gap: 10 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--c-primary)' }}>map</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text-1)' }}>카카오맵 설정 필요</p>
      <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.6 }}>
        GitHub 저장소 Settings → Secrets에<br />
        <code style={{ background: 'var(--c-surface2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>VITE_KAKAO_MAPS_API_KEY</code> 를 추가하세요.
      </p>
    </div>
  )
}

function MapNoCoords({ schedules }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#F8FAFC', textAlign: 'center', gap: 10 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--c-text-3)' }}>location_off</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text-1)' }}>지도에 표시할 위치가 없어요</p>
      <p style={{ fontSize: 13, color: 'var(--c-text-3)', lineHeight: 1.6 }}>
        일정 추가 시 장소 검색을 통해<br />위치를 등록하면 지도에 표시됩니다.
      </p>
      {schedules.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 4 }}>현재 {schedules.length}개 일정에 위치 정보가 없습니다</p>
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
