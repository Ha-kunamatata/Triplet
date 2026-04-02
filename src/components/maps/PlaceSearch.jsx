import { useEffect, useRef, useState, useCallback } from 'react'
import { loadKakaoMaps } from '../../utils/kakaoMaps'

/**
 * 카카오 키워드 검색 + 선택 후 미니 맵 표시
 * API 키 없으면 일반 텍스트 input으로 fallback
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
    new window.kakao.maps.Marker({ position: center, map })
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
          setResults(data.slice(0, 6))
          setOpen(true)
        } else {
          setResults([])
          setOpen(false)
        }
      })
    }, 300)
  }, [ready, onChange])

  const handleSelect = useCallback(place => {
    const data = {
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
    }
    setSelected(data)
    setOpen(false)
    setResults([])
    onPlaceSelect(data)
  }, [onPlaceSelect])

  return (
    <div style={{ position: 'relative' }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <span className="material-symbols-outlined" style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 18, color: 'var(--c-text-3)', pointerEvents: 'none', zIndex: 1,
        }}>
          {ready ? 'search' : 'location_on'}
        </span>
        <input
          type="text"
          value={value}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={ready ? '장소명 또는 주소를 검색하세요' : '장소명을 입력하세요'}
          style={{
            width: '100%', height: 48, paddingLeft: 44, paddingRight: 16,
            border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)',
            fontSize: 'var(--text-base)', background: 'var(--c-surface2)',
            color: 'var(--c-text-1)', fontFamily: 'var(--font)',
            boxSizing: 'border-box', transition: 'border-color var(--t-fast)', outline: 'none',
          }}
          onFocusCapture={e => e.target.style.borderColor = 'var(--c-primary)'}
          onBlurCapture={e => e.target.style.borderColor = 'var(--c-border)'}
        />
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)',
          zIndex: 100, overflow: 'hidden',
        }}>
          {results.map(place => (
            <button
              key={place.id}
              type="button"
              onMouseDown={() => handleSelect(place)}
              style={{
                width: '100%', padding: '11px 14px', textAlign: 'left',
                borderBottom: '1px solid var(--c-border)', display: 'flex',
                alignItems: 'flex-start', gap: 10, background: 'transparent',
                cursor: 'pointer', transition: 'background var(--t-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-primary)', marginTop: 1, flexShrink: 0, fontVariationSettings: "'FILL' 1" }}>location_on</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.place_name}</p>
                <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {place.road_address_name || place.address_name}
                </p>
                {place.category_group_name && (
                  <p style={{ fontSize: 11, color: 'var(--c-primary)', marginTop: 1 }}>{place.category_group_name}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mini map after selection */}
      {selected && (
        <div style={{ marginTop: 8, borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--c-border)' }}>
          <div ref={miniMapRef} style={{ width: '100%', height: 160 }} />
          <div style={{ padding: '8px 12px', background: 'var(--c-surface)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--c-primary)', marginTop: 1, flexShrink: 0, fontVariationSettings: "'FILL' 1" }}>location_on</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</p>
              {selected.address && <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.address}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
