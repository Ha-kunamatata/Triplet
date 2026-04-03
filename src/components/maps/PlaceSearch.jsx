import { useEffect, useRef, useState, useCallback } from 'react'
import { loadKakaoMaps } from '../../utils/kakaoMaps'
import { KAKAO_CATEGORY_MAP } from '../../constants'

const CATEGORY_ICONS = {
  restaurant:  { icon: 'restaurant',    color: '#EF9F27' },
  cafe:        { icon: 'local_cafe',    color: '#7F77DD' },
  attraction:  { icon: 'photo_camera',  color: '#1D9E75' },
  shopping:    { icon: 'shopping_bag',  color: '#EC4899' },
  stay:        { icon: 'hotel',         color: '#378ADD' },
  activity:    { icon: 'sports',        color: '#F97316' },
  transport:   { icon: 'subway',        color: '#7C3AED' },
  other:       { icon: 'location_on',   color: '#94A3B8' },
}

/**
 * 카카오 키워드 검색 컴포넌트
 * - 카카오 SDK 사용 가능 시: 실시간 검색 + 선택 후 미니맵
 * - 키 없거나 로드 실패 시: 텍스트 입력 fallback
 * - onPlaceSelect 콜백: { name, address, lat, lng, phone, website, category, categoryCode }
 */
export default function PlaceSearch({ value, onChange, onPlaceSelect }) {
  const miniMapRef = useRef(null)
  const debounceRef = useRef(null)
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const apiKey = import.meta.env.VITE_KAKAO_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey) return
    loadKakaoMaps(apiKey)
      .then(() => setReady(true))
      .catch(() => {})
  }, [apiKey])

  // 미니 맵 렌더링
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
      font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.35);
      border:2px solid #fff;
    `
    markerDiv.textContent = '📍'
    new window.kakao.maps.CustomOverlay({ position: center, content: markerDiv, yAnchor: 1.2 }).setMap(map)
  }, [selected])

  const handleInput = useCallback(e => {
    onChange(e)
    const q = e.target.value.trim()
    if (!ready || q.length < 2) { setResults([]); setOpen(false); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const ps = new window.kakao.maps.services.Places()
      ps.keywordSearch(q, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(data.slice(0, 7))
          setOpen(true)
        } else {
          setResults([])
          setOpen(false)
        }
      })
    }, 280)
  }, [ready, onChange])

  const handleSelect = useCallback(place => {
    const category = KAKAO_CATEGORY_MAP[place.category_group_code] ?? 'other'
    const data = {
      name:         place.place_name,
      address:      place.road_address_name || place.address_name,
      lat:          parseFloat(place.y),
      lng:          parseFloat(place.x),
      phone:        place.phone || '',
      website:      place.place_url || '',
      categoryCode: place.category_group_code || '',
      category,
    }
    setSelected(data)
    setOpen(false)
    setResults([])
    onPlaceSelect(data)
  }, [onPlaceSelect])

  const catMeta = selected ? (CATEGORY_ICONS[selected.category] ?? CATEGORY_ICONS.other) : null

  return (
    <div style={{ position: 'relative' }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <span className="material-symbols-outlined" style={{
          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
          fontSize: 18, color: ready ? 'var(--c-primary)' : 'var(--c-text-3)',
          pointerEvents: 'none', zIndex: 1, fontVariationSettings: "'FILL' 1",
        }}>
          {ready ? 'search' : 'location_on'}
        </span>
        <input
          type="text"
          value={value}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder={ready ? '장소명, 주소 검색 (카카오 연동)' : '장소명을 직접 입력하세요'}
          style={{
            width: '100%', height: 48, paddingLeft: 42, paddingRight: 16,
            border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)',
            fontSize: 15, background: 'var(--c-surface2)',
            color: 'var(--c-text-1)', fontFamily: 'var(--font)',
            boxSizing: 'border-box', transition: 'border-color 0.15s', outline: 'none',
          }}
          onFocusCapture={e => e.target.style.borderColor = 'var(--c-primary)'}
          onBlurCapture={e => e.target.style.borderColor = 'var(--c-border)'}
        />
        {ready && (
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 11, background: '#FFCD29', color: '#000',
            padding: '2px 7px', borderRadius: 10, fontWeight: 700, pointerEvents: 'none',
          }}>kakao</span>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0,
          background: 'var(--c-surface)', border: '1.5px solid var(--c-border)',
          borderRadius: 14, boxShadow: '0 8px 28px rgba(15,23,42,0.12)',
          zIndex: 200, overflow: 'hidden',
        }}>
          {results.map((place, i) => {
            const cat = KAKAO_CATEGORY_MAP[place.category_group_code] ?? 'other'
            const meta = CATEGORY_ICONS[cat]
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
                    {place.road_address_name || place.address_name}
                  </p>
                  {place.phone && (
                    <p style={{ fontSize: 11, color: meta.color, marginTop: 1 }}>{place.phone}</p>
                  )}
                </div>
                {place.category_group_name && (
                  <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: meta.color, background: meta.color + '15', padding: '3px 7px', borderRadius: 8 }}>
                    {place.category_group_name}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* 선택된 장소 미니맵 */}
      {selected && (
        <div style={{ marginTop: 8, borderRadius: 14, overflow: 'hidden', border: '1.5px solid var(--c-border)', boxShadow: '0 2px 12px rgba(15,23,42,0.08)' }}>
          <div ref={miniMapRef} style={{ width: '100%', height: 150 }} />
          <div style={{ padding: '10px 14px', background: 'var(--c-surface)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: catMeta.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: catMeta.color, fontVariationSettings: "'FILL' 1" }}>{catMeta.icon}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</p>
              {selected.address && (
                <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.address}</p>
              )}
            </div>
            {selected.website && (
              <a href={selected.website} target="_blank" rel="noopener noreferrer"
                style={{ flexShrink: 0, fontSize: 11, color: '#FFCD29', background: '#3C1E1E', padding: '4px 8px', borderRadius: 8, fontWeight: 700 }}>
                지도
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
