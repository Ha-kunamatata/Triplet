import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, MAP_STYLE } from '../../utils/googleMaps'

/**
 * Google Places Autocomplete 입력 + 선택 후 미니 맵 표시
 * API 키 없으면 일반 텍스트 input으로 fallback
 */
export default function PlaceSearch({ value, onChange, onPlaceSelect }) {
  const inputRef = useRef(null)
  const miniMapRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [ready, setReady] = useState(false)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || !inputRef.current) return

    loadGoogleMaps(apiKey)
      .then(() => {
        if (!inputRef.current || !window.google?.maps?.places) return
        setReady(true)

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['establishment', 'geocode'],
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (!place.geometry) return

          const data = {
            name: place.name ?? '',
            address: place.formatted_address ?? '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }
          setSelected(data)
          onPlaceSelect(data)

          // Render mini map
          requestAnimationFrame(() => {
            if (!miniMapRef.current || !window.google) return
            const map = new window.google.maps.Map(miniMapRef.current, {
              center: { lat: data.lat, lng: data.lng },
              zoom: 15,
              mapTypeControl: false,
              fullscreenControl: false,
              streetViewControl: false,
              zoomControl: false,
              styles: MAP_STYLE,
              gestureHandling: 'none',
              clickableIcons: false,
            })
            new window.google.maps.Marker({
              position: { lat: data.lat, lng: data.lng },
              map,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
                scale: 10,
              },
            })
          })
        })
      })
      .catch(() => {}) // silently fall back to plain input
  }, [apiKey, onPlaceSelect])

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <span className="material-symbols-outlined" style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 18, color: 'var(--c-text-3)', pointerEvents: 'none', zIndex: 1,
        }}>
          {ready ? 'search' : 'location_on'}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={ready ? '장소명 또는 주소를 검색하세요' : '장소명을 입력하세요'}
          style={{
            width: '100%', height: 48, paddingLeft: 44, paddingRight: 16,
            border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)',
            fontSize: 'var(--text-base)', background: 'var(--c-surface2)',
            color: 'var(--c-text-1)', fontFamily: 'var(--font)',
            boxSizing: 'border-box', transition: 'border-color var(--t-fast)',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--c-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
        />
      </div>

      {/* Mini map after place selection */}
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
