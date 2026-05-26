import { useState, useRef } from 'react'
import { parseKML } from '../../utils/kmlParser'

export default function KmlImportSheet({ selectedDate, onClose, onImport }) {
  const [places,   setPlaces]   = useState([])
  const [selected, setSelected] = useState(new Set())
  const [fileName, setFileName] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const fileRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.kml')) {
      setError('KML 파일(.kml)만 지원합니다. 아래 안내를 참고해 .kml 형식으로 다운로드하세요.')
      return
    }

    setError('')
    setFileName(file.name.replace(/\.kml$/i, ''))

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = parseKML(ev.target.result)
        if (parsed.length === 0) {
          setError('가져올 장소(마커)가 없어요. 마커가 포함된 지도인지 확인하세요.')
          return
        }
        setPlaces(parsed)
        setSelected(new Set(parsed.map(p => p.id)))
      } catch (err) {
        setError(err.message)
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    const toAdd = places.filter(p => selected.has(p.id))
    if (!toAdd.length) return
    setLoading(true)
    await onImport(toAdd)
    onClose()
  }

  function toggleAll(on) {
    setSelected(on ? new Set(places.map(p => p.id)) : new Set())
  }

  const layers = [...new Set(places.map(p => p.layer))].filter(Boolean)

  const renderPlaces = (list) => list.map(place => {
    const on = selected.has(place.id)
    return (
      <button
        key={place.id}
        onClick={() => {
          const next = new Set(selected)
          on ? next.delete(place.id) : next.add(place.id)
          setSelected(next)
        }}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '12px 14px', borderRadius: 14, width: '100%', textAlign: 'left',
          background: on ? 'var(--c-primary-dim)' : 'var(--c-surface2)',
          border: `1.5px solid ${on ? 'var(--c-primary)' : 'transparent'}`,
          transition: 'all var(--t-fast)', cursor: 'pointer',
        }}
      >
        {/* 체크박스 */}
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
          border: `2px solid ${on ? 'var(--c-primary)' : 'var(--c-border2)'}`,
          background: on ? 'var(--c-primary)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--t-fast)',
        }}>
          {on && <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#fff', fontVariationSettings: "'FILL' 1" }}>check</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)', marginBottom: 2 }}>{place.name}</p>
          {place.description && (
            <p style={{ fontSize: 12, color: 'var(--c-text-2)', lineHeight: 1.5, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {place.description}
            </p>
          )}
          <p style={{ fontSize: 11, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>location_on</span>
            {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
          </p>
        </div>
      </button>
    )
  })

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--c-surface)', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 680, maxHeight: '92dvh', display: 'flex', flexDirection: 'column', animation: 'sheetUp 0.28s var(--ease)', boxShadow: 'var(--shadow-xl)' }}
      >
        {/* 핸들 */}
        <div style={{ width: 36, height: 4, background: 'var(--c-border2)', borderRadius: 999, margin: '12px auto 0', flexShrink: 0 }} />

        {/* 헤더 */}
        <div style={{ padding: '14px 20px 14px', borderBottom: '1px solid var(--c-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg,#4285F4,#34A853)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              🗺️
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-1)', letterSpacing: -0.3 }}>내 지도 가져오기</p>
              <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 1 }}>Google 내지도 KML → 일정 자동 추가</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', background: 'var(--c-surface2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* 스크롤 본문 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* ── 파일 미선택 상태 ── */}
          {places.length === 0 && (
            <>
              {/* 안내 가이드 */}
              <div style={{ background: 'var(--c-surface2)', borderRadius: 16, padding: '16px', marginBottom: 16, border: '1px solid var(--c-border)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 12 }}>📖 Google 내지도에서 KML 가져오기</p>
                {[
                  { num: '1', text: '구글 지도 앱 또는 maps.google.com 접속', sub: '왼쪽 메뉴 → "내 지도" 선택' },
                  { num: '2', text: '가져올 지도 열기', sub: '원하는 지도를 탭' },
                  { num: '3', text: 'KML로 내보내기', sub: '⋮(더보기) → "KML/KMZ 내보내기" → KML 체크 후 다운로드' },
                  { num: '4', text: '아래 버튼으로 .kml 파일 선택', sub: '' },
                ].map(({ num, text, sub }) => (
                  <div key={num} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{num}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-1)', lineHeight: 1.4 }}>{text}</p>
                      {sub && <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2 }}>{sub}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* 파일 선택 버튼 */}
              <input ref={fileRef} type="file" accept=".kml" style={{ display: 'none' }} onChange={handleFile} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{ width: '100%', padding: '22px 16px', border: '2.5px dashed var(--c-border2)', borderRadius: 18, background: 'var(--c-surface2)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all var(--t-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-primary)'; e.currentTarget.style.background = 'var(--c-primary-dim)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border2)'; e.currentTarget.style.background = 'var(--c-surface2)' }}
              >
                <span style={{ fontSize: 36 }}>📂</span>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text-1)' }}>KML 파일 선택</p>
                  <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 3 }}>.kml 파일만 지원 (KMZ 불가)</p>
                </div>
              </button>

              {error && (
                <div style={{ marginTop: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-error)', flexShrink: 0, marginTop: 1 }}>error</span>
                  <p style={{ fontSize: 13, color: 'var(--c-error)', lineHeight: 1.55 }}>{error}</p>
                </div>
              )}
            </>
          )}

          {/* ── 장소 목록 ── */}
          {places.length > 0 && (
            <>
              {/* 요약 + 전체/해제 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>
                    📍 {fileName} — {places.length}곳
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--c-primary)', fontWeight: 600, marginTop: 2 }}>
                    {selected.size}개 선택됨
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleAll(true)} style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-primary)', padding: '6px 12px', borderRadius: 20, background: 'var(--c-primary-dim)', border: 'none', cursor: 'pointer' }}>전체 선택</button>
                  <button onClick={() => toggleAll(false)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-2)', padding: '6px 12px', borderRadius: 20, background: 'var(--c-surface2)', border: 'none', cursor: 'pointer' }}>전체 해제</button>
                </div>
              </div>

              {/* 레이어별 그룹 */}
              {layers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {layers.map(layer => {
                    const layerPlaces = places.filter(p => p.layer === layer)
                    const checkedCount = layerPlaces.filter(p => selected.has(p.id)).length
                    return (
                      <div key={layer}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {layer} ({layerPlaces.length})
                          </p>
                          <button
                            onClick={() => {
                              const next = new Set(selected)
                              const allOn = checkedCount === layerPlaces.length
                              layerPlaces.forEach(p => allOn ? next.delete(p.id) : next.add(p.id))
                              setSelected(next)
                            }}
                            style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-primary)', padding: '3px 8px', borderRadius: 8, background: 'var(--c-primary-dim)', border: 'none', cursor: 'pointer' }}
                          >
                            {checkedCount === layerPlaces.length ? '해제' : '전체'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {renderPlaces(layerPlaces)}
                        </div>
                      </div>
                    )
                  })}
                  {/* 레이어 없는 항목 */}
                  {places.filter(p => !p.layer).length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-3)', marginBottom: 8 }}>기타</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {renderPlaces(places.filter(p => !p.layer))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {renderPlaces(places)}
                </div>
              )}
            </>
          )}
        </div>

        {/* 푸터 버튼 */}
        <div style={{ padding: '14px 20px calc(28px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--c-border)', flexShrink: 0 }}>
          {places.length === 0 ? (
            <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--c-surface2)', fontSize: 15, fontWeight: 600, color: 'var(--c-text-2)', border: 'none', cursor: 'pointer' }}>닫기</button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setPlaces([]); setSelected(new Set()); setFileName(''); setError('') }}
                style={{ padding: '14px 18px', borderRadius: 14, background: 'var(--c-surface2)', fontSize: 14, fontWeight: 600, color: 'var(--c-text-2)', border: '1px solid var(--c-border)', cursor: 'pointer', flexShrink: 0 }}
              >
                다시 선택
              </button>
              <button
                onClick={handleImport}
                disabled={selected.size === 0 || loading}
                style={{ flex: 1, padding: '14px', borderRadius: 14, background: selected.size > 0 ? 'var(--c-primary)' : 'var(--c-border2)', color: '#fff', fontSize: 15, fontWeight: 800, boxShadow: selected.size > 0 ? 'var(--shadow-primary)' : 'none', border: 'none', cursor: selected.size > 0 ? 'pointer' : 'not-allowed', transition: 'all var(--t-fast)', letterSpacing: -0.2 }}
              >
                {loading ? '추가 중...' : `${selected.size}곳 일정에 추가`}
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes sheetUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}
