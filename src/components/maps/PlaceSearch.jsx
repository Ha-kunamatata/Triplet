import { useEffect, useRef, useState, useCallback } from 'react'
import { loadKakaoMaps } from '../../utils/kakaoMaps'
import { searchPlace, CATEGORY_ICONS, getSearchContext } from '../../utils/placeSearch'

const SOURCE_BADGE = {
  kakao:     { label: 'kakao',  bg: '#FFCD29', color: '#000' },
  nominatim: { label: 'OSM',   bg: '#7EBC6F', color: '#fff' },
  manual:    { label: '직접입력', bg: '#94A3B8', color: '#fff' },
}

/**
 * 하이브리드 장소 검색 컴포넌트
 * - 국내/한글 → 카카오, 해외/영문 → Nominatim, 자동 감지
 * - 결과 없을 시 수동 입력 모드 (지도 클릭으로 좌표 설정)
 * Props:
 *   value          string          현재 입력 텍스트
 *   onChange       (e) => void     input onChange 핸들러
 *   onPlaceSelect  (place) => void 장소 선택 콜백
 *   countryContext 'domestic'|'overseas'|'mixed'|'auto'
 */
export default function PlaceSearch({
  value,
  onChange,
  onPlaceSelect,
  countryContext = 'auto',
}) {
  const miniMapRef   = useRef(null)
  const clickMapRef  = useRef(null)  // 수동입력 모드 지도 ref
  const debounceRef  = useRef(null)
  const kakaoReadyRef = useRef(false)

  const [results,   setResults]   = useState([])
  const [selected,  setSelected]  = useState(null)
  const [open,      setOpen]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [mode,      setMode]      = useState('search') // 'search' | 'manual'
  const [manualForm, setManualForm] = useState({ name: '', address: '', lat: '', lng: '', category: 'other' })
  const [manualCoords, setManualCoords] = useState(null)

  // 카카오 SDK 로드 (지도 렌더링용)
  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_MAPS_API_KEY
    if (!apiKey) return
    loadKakaoMaps(apiKey)
      .then(() => { kakaoReadyRef.current = true })
      .catch(() => {})
  }, [])

  // 미니 맵 (선택된 장소 표시)
  useEffect(() => {
    if (!selected || !miniMapRef.current || !window.kakao?.maps) return
    const { lat, lng } = selected
    const center = new window.kakao.maps.LatLng(lat, lng)
    const map = new window.kakao.maps.Map(miniMapRef.current, { center, level: 3 })
    const catMeta = CATEGORY_ICONS[selected.category] ?? CATEGORY_ICONS.other
    const markerDiv = document.createElement('div')
    markerDiv.style.cssText = `
      width:30px;height:30px;border-radius:50%;
      background:${catMeta.color};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff;
    `
    markerDiv.textContent = '📍'
    new window.kakao.maps.CustomOverlay({ position: center, content: markerDiv, yAnchor: 1.3 }).setMap(map)
  }, [selected])

  // 수동입력 지도 (클릭으로 좌표 설정)
  useEffect(() => {
    if (mode !== 'manual' || !clickMapRef.current || !window.kakao?.maps) return
    let markerOverlay = null
    const map = new window.kakao.maps.Map(clickMapRef.current, {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780),
      level: 7,
    })
    window.kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
      const latlng = mouseEvent.latLng
      const lat = latlng.getLat()
      const lng = latlng.getLng()
      setManualCoords({ lat, lng })
      setManualForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))

      if (markerOverlay) markerOverlay.setMap(null)
      const pin = document.createElement('div')
      pin.style.cssText = `width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);`
      markerOverlay = new window.kakao.maps.CustomOverlay({ position: latlng, content: pin, yAnchor: 0.5 })
      markerOverlay.setMap(map)
    })
  }, [mode])

  // 검색 (debounce 500ms — Nominatim rate limit 여유)
  const handleInput = useCallback(e => {
    onChange(e)
    const q = e.target.value.trim()
    if (q.length < 2) { setResults([]); setOpen(false); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchPlace(q, countryContext)
        setResults(res)
        setOpen(res.length > 0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 500)
  }, [onChange, countryContext])

  const handleSelect = useCallback(place => {
    const data = {
      name:         place.place_name,
      address:      place.address,
      lat:          place.lat,
      lng:          place.lng,
      phone:        place.phone || '',
      website:      place.place_url || '',
      category:     place.category,
      categoryCode: place.categoryCode || '',
      source:       place.source,
    }
    setSelected(data)
    setOpen(false)
    setResults([])
    onPlaceSelect(data)
  }, [onPlaceSelect])

  const handleManualSubmit = useCallback(() => {
    const lat = parseFloat(manualForm.lat)
    const lng = parseFloat(manualForm.lng)
    if (!manualForm.name) return
    const data = {
      name:         manualForm.name,
      address:      manualForm.address,
      lat:          isNaN(lat) ? 0 : lat,
      lng:          isNaN(lng) ? 0 : lng,
      phone:        '',
      website:      '',
      category:     manualForm.category,
      categoryCode: '',
      source:       'manual',
    }
    setSelected(data)
    setMode('search')
    onPlaceSelect(data)
  }, [manualForm, onPlaceSelect])

  const catMeta = selected ? (CATEGORY_ICONS[selected.category] ?? CATEGORY_ICONS.other) : null
  const sourceBadge = selected ? (SOURCE_BADGE[selected.source] ?? SOURCE_BADGE.manual) : null

  // ── 수동 입력 모드 ──
  if (mode === 'manual') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button type="button" onClick={() => setMode('search')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--c-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            검색으로 돌아가기
          </button>
          <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>/ 직접 입력 모드</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="field">
            <label>장소명 *</label>
            <input className="input" type="text" placeholder="예: 에펠탑, 루브르 박물관"
              value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>주소</label>
            <input className="input" type="text" placeholder="주소 또는 설명"
              value={manualForm.address} onChange={e => setManualForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="field">
              <label>위도 (lat)</label>
              <input className="input" type="number" step="0.000001" placeholder="48.858844"
                value={manualForm.lat} onChange={e => setManualForm(f => ({ ...f, lat: e.target.value }))} />
            </div>
            <div className="field">
              <label>경도 (lng)</label>
              <input className="input" type="number" step="0.000001" placeholder="2.294351"
                value={manualForm.lng} onChange={e => setManualForm(f => ({ ...f, lng: e.target.value }))} />
            </div>
          </div>

          {/* 카테고리 */}
          <div className="field">
            <label>카테고리</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(CATEGORY_ICONS).map(([key, meta]) => (
                <button key={key} type="button"
                  onClick={() => setManualForm(f => ({ ...f, category: key }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 20, fontSize: 12,
                    border: `1.5px solid ${manualForm.category === key ? meta.color : 'var(--c-border)'}`,
                    background: manualForm.category === key ? meta.color + '18' : 'var(--c-surface)',
                    color: manualForm.category === key ? meta.color : 'var(--c-text-2)',
                    cursor: 'pointer',
                  }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* 지도 클릭으로 좌표 설정 */}
          {kakaoReadyRef.current && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--c-text-2)', marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>touch_app</span>
                {' '}지도를 클릭하면 좌표가 자동 입력됩니다
              </p>
              <div ref={clickMapRef} style={{ width: '100%', height: 200, borderRadius: 12, border: '1.5px solid var(--c-border)', overflow: 'hidden' }} />
            </div>
          )}

          <button type="button" className="btn btn-primary w-full" onClick={handleManualSubmit}
            disabled={!manualForm.name}
            style={{ marginTop: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
            이 장소로 설정
          </button>
        </div>
      </div>
    )
  }

  // ── 검색 모드 ──
  return (
    <div style={{ position: 'relative' }}>
      {/* 입력창 */}
      <div style={{ position: 'relative' }}>
        <span className="material-symbols-outlined" style={{
          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
          fontSize: 18, color: 'var(--c-primary)', pointerEvents: 'none', zIndex: 1, fontVariationSettings: "'FILL' 1",
        }}>search</span>
        <input
          type="text"
          value={value}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="장소명, 주소 검색 (국내: 카카오 / 해외: OpenStreetMap)"
          style={{
            width: '100%', height: 48, paddingLeft: 42, paddingRight: 60,
            border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)',
            fontSize: 15, background: 'var(--c-surface2)',
            color: 'var(--c-text-1)', fontFamily: 'var(--font)',
            boxSizing: 'border-box', transition: 'border-color 0.15s', outline: 'none',
          }}
          onFocusCapture={e => e.target.style.borderColor = 'var(--c-primary)'}
          onBlurCapture={e => e.target.style.borderColor = 'var(--c-border)'}
        />
        {loading && (
          <span className="material-symbols-outlined" style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18, color: 'var(--c-text-3)', animation: 'spin 1s linear infinite',
          }}>progress_activity</span>
        )}
      </div>

      {/* 드롭다운 결과 */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0,
          background: 'var(--c-surface)', border: '1.5px solid var(--c-border)',
          borderRadius: 14, boxShadow: '0 8px 28px rgba(15,23,42,0.12)',
          zIndex: 200, overflow: 'hidden', maxHeight: 320, overflowY: 'auto',
        }}>
          {results.map((place, i) => {
            const meta   = CATEGORY_ICONS[place.category] ?? CATEGORY_ICONS.other
            const badge  = SOURCE_BADGE[place.source] ?? SOURCE_BADGE.manual
            return (
              <button
                key={place.id}
                type="button"
                onMouseDown={() => handleSelect(place)}
                style={{
                  width: '100%', padding: '10px 14px', textAlign: 'left',
                  borderBottom: i < results.length - 1 ? '1px solid var(--c-border)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'transparent', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: meta.color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: meta.color, fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {place.place_name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {place.address}
                  </p>
                  {place.phone && (
                    <p style={{ fontSize: 11, color: meta.color, marginTop: 1 }}>{place.phone}</p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 6px', borderRadius: 8 }}>
                    {badge.label}
                  </span>
                  {place.categoryName && (
                    <span style={{ fontSize: 10, color: meta.color, background: meta.color + '15', padding: '2px 6px', borderRadius: 8, fontWeight: 600 }}>
                      {place.categoryName}
                    </span>
                  )}
                </div>
              </button>
            )
          })}

          {/* 결과 하단: 직접 입력 버튼 */}
          <button
            type="button"
            onMouseDown={() => { setOpen(false); setMode('manual') }}
            style={{
              width: '100%', padding: '10px 14px', textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'var(--c-surface2)', cursor: 'pointer',
              fontSize: 13, color: 'var(--c-text-2)', border: 'none',
              borderTop: '1px solid var(--c-border)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit_location_alt</span>
            원하는 장소가 없나요? 직접 입력하기
          </button>
        </div>
      )}

      {/* 결과 없음 + 직접 입력 */}
      {!loading && !open && value && value.trim().length >= 2 && results.length === 0 && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>검색 결과가 없습니다.</span>
          <button type="button" onClick={() => setMode('manual')}
            style={{ fontSize: 12, color: 'var(--c-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
            직접 입력하기
          </button>
        </div>
      )}

      {/* 선택된 장소 미니맵 */}
      {selected && (
        <div style={{ marginTop: 8, borderRadius: 14, overflow: 'hidden', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 12px rgba(15,23,42,0.08)' }}>
          {selected.lat && selected.lng && window.kakao?.maps ? (
            <div ref={miniMapRef} style={{ width: '100%', height: 150 }} />
          ) : null}
          <div style={{ padding: '10px 14px', background: 'var(--c-surface)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: catMeta.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: catMeta.color, fontVariationSettings: "'FILL' 1" }}>{catMeta.icon}</span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</p>
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: sourceBadge.color, background: sourceBadge.bg, padding: '1px 6px', borderRadius: 8 }}>{sourceBadge.label}</span>
              </div>
              {selected.address && (
                <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.address}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {selected.website && (
                <a href={selected.website} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: '#FFCD29', background: '#3C1E1E', padding: '4px 8px', borderRadius: 8, fontWeight: 700 }}>
                  지도
                </a>
              )}
              <button type="button" onClick={() => { setSelected(null); setMode('manual') }}
                style={{ fontSize: 11, color: 'var(--c-text-3)', background: 'var(--c-surface2)', padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                수정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* spin 애니메이션 */}
      <style>{`@keyframes spin { from { transform: translateY(-50%) rotate(0deg) } to { transform: translateY(-50%) rotate(360deg) } }`}</style>
    </div>
  )
}
