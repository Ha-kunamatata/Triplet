import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { addSchedule, updateSchedule, getSchedules } from '../firebase/firestore'
import PageHeader from '../components/layout/PageHeader'
import PlaceSearch from '../components/maps/PlaceSearch'
import { SCHEDULE_CATEGORIES } from '../constants'

export default function AddSchedulePage() {
  const { tripId, scheduleId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = !!scheduleId

  const [form, setForm] = useState({
    title: '', category: 'attraction', date: location.state?.date ?? '',
    startTime: '', endTime: '', place: '', placeAddress: '', lat: null, lng: null, memo: '', cost: '',
  })
  const [saving, setSaving] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    getSchedules(tripId).then(all => {
      const s = all.find(x => x.id === scheduleId)
      if (s) setForm({
        title: s.title, category: s.category, date: s.date,
        startTime: s.startTime ?? '', endTime: s.endTime ?? '',
        place: s.place ?? '', placeAddress: s.placeAddress ?? '',
        lat: s.lat ?? null, lng: s.lng ?? null,
        memo: s.memo ?? '', cost: s.cost ?? '',
      })
    }).finally(() => setInitialLoading(false))
  }, [isEdit, scheduleId, tripId])

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }))

  const handlePlaceSelect = useCallback(({ name, address, lat, lng }) => {
    setForm(p => ({ ...p, place: name, placeAddress: address, lat, lng }))
  }, [])

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!form.title || !form.date) return
    setSaving(true)
    const data = { ...form, cost: Number(form.cost) || 0, order: Date.now() }
    try {
      if (isEdit) await updateSchedule(scheduleId, data)
      else await addSchedule(tripId, data)
      navigate(`/trips/${tripId}`)
    } finally {
      setSaving(false)
    }
  }

  const cat = SCHEDULE_CATEGORIES.find(c => c.key === form.category) ?? SCHEDULE_CATEGORIES[0]

  if (initialLoading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 14 }}>불러오는 중...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)' }}>
      {/* Header with category color accent */}
      <div style={{ background: `linear-gradient(135deg,${cat.color}25,${cat.color}10)`, borderBottom: `3px solid ${cat.color}` }}>
        <PageHeader
          title={isEdit ? '일정 수정' : '일정 추가'}
          noBorder
          actions={
            <button onClick={handleSubmit} disabled={saving || !form.title || !form.date} style={{
              padding: '8px 20px', borderRadius: 'var(--r-full)',
              background: (!form.title || !form.date) ? 'var(--c-border2)' : cat.color,
              color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
              boxShadow: (!form.title || !form.date) ? 'none' : `0 4px 14px ${cat.color}55`,
              transition: 'all var(--t-base)',
            }}>
              {saving ? '저장 중...' : isEdit ? '수정 완료' : '일정 추가'}
            </button>
          }
        />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Category ── */}
        <FormCard label="카테고리" icon="category">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
            {SCHEDULE_CATEGORIES.map(c => {
              const active = form.category === c.key
              return (
                <button
                  key={c.key} type="button"
                  onClick={() => setForm(p => ({ ...p, category: c.key }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 'var(--r-full)',
                    background: active ? c.color + '18' : 'var(--c-surface2)',
                    border: `1.5px solid ${active ? c.color : 'transparent'}`,
                    color: active ? c.color : 'var(--c-text-2)',
                    fontSize: 'var(--text-xs)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                    transition: 'all var(--t-fast)',
                    transform: active ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{c.icon}</span>
                  {c.label}
                </button>
              )
            })}
          </div>
        </FormCard>

        {/* ── Basic Info ── */}
        <FormCard label="기본 정보" icon="edit_note">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            <Field label="일정 이름 *" value={form.title} onChange={set('title')} placeholder="예) 도쿄 타워 전망대 방문" required accentColor={cat.color} />

            <div>
              <label style={lbl}>날짜 *</label>
              <input type="date" value={form.date} onChange={set('date')} required style={{ ...inp, marginTop: 6 }}
                onFocus={e => e.target.style.borderColor = cat.color}
                onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </div>

            <div>
              <label style={lbl}>시간</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <input type="time" value={form.startTime} onChange={set('startTime')} style={inp}
                    onFocus={e => e.target.style.borderColor = cat.color}
                    onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
                    placeholder="시작"
                  />
                </div>
                <span style={{ color: 'var(--c-text-3)', fontWeight: 700, fontSize: 18 }}>–</span>
                <div style={{ flex: 1 }}>
                  <input type="time" value={form.endTime} onChange={set('endTime')} style={inp}
                    onFocus={e => e.target.style.borderColor = cat.color}
                    onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
                    placeholder="종료"
                  />
                </div>
              </div>
            </div>
          </div>
        </FormCard>

        {/* ── Place (Google Places) ── */}
        <FormCard label="장소" icon="location_on">
          <div style={{ marginTop: 12 }}>
            <label style={lbl}>장소 검색</label>
            <div style={{ marginTop: 6 }}>
              <PlaceSearch
                value={form.place}
                onChange={e => setForm(p => ({ ...p, place: e.target.value, placeAddress: '', lat: null, lng: null }))}
                onPlaceSelect={handlePlaceSelect}
              />
            </div>
            {form.placeAddress && !form.lat && (
              <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 6 }}>{form.placeAddress}</p>
            )}
          </div>
        </FormCard>

        {/* ── Cost & Memo ── */}
        <FormCard label="비용 & 메모" icon="receipt_long">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            {/* Cost with currency visual */}
            <div>
              <label style={lbl}>예산</label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <input
                  type="number" value={form.cost} onChange={set('cost')}
                  placeholder="0"
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = cat.color}
                  onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
                />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--c-text-3)' }}>원</span>
              </div>
              {form.cost > 0 && (
                <p style={{ fontSize: 12, color: cat.color, fontWeight: 700, marginTop: 4 }}>
                  {Number(form.cost).toLocaleString('ko-KR')}원
                </p>
              )}
            </div>

            {/* Memo */}
            <div>
              <label style={lbl}>메모</label>
              <textarea
                value={form.memo} onChange={set('memo')}
                placeholder="예약 번호, 입장 방법, 준비물 등 메모를 남겨보세요..."
                rows={3}
                style={{ ...inp, marginTop: 6, height: 'auto', resize: 'none', lineHeight: 1.7, paddingTop: 12, paddingBottom: 12 }}
                onFocus={e => e.target.style.borderColor = cat.color}
                onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </div>
          </div>
        </FormCard>

        {/* Bottom save button */}
        <button type="submit" disabled={saving || !form.title || !form.date} style={{
          width: '100%', padding: '16px',
          background: (!form.title || !form.date) ? 'var(--c-border2)' : cat.color,
          color: '#fff', borderRadius: 'var(--r-xl)',
          fontSize: 'var(--text-base)', fontWeight: 'var(--fw-extrabold)',
          boxShadow: (!form.title || !form.date) ? 'none' : `0 4px 14px ${cat.color}50`,
          transition: 'all var(--t-base)', marginTop: 4,
        }}>
          {saving ? '저장 중...' : isEdit ? '✏️  수정 완료' : '✅  일정 추가하기'}
        </button>
      </form>
    </div>
  )
}

function FormCard({ label, icon, children }) {
  return (
    <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '16px 18px', boxShadow: 'var(--shadow-xs)', border: '1px solid var(--c-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-text-3)', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, required, accentColor }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} required={required} style={{ ...inp, marginTop: 6 }}
        onFocus={e => { if (accentColor) e.target.style.borderColor = accentColor }}
        onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
      />
    </div>
  )
}

const lbl = { fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-2)', display: 'block' }
const inp = {
  width: '100%', height: 48, padding: '0 15px',
  border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)',
  fontSize: 'var(--text-base)', outline: 'none',
  boxSizing: 'border-box', display: 'block',
  background: 'var(--c-surface2)', color: 'var(--c-text-1)',
  transition: 'border-color var(--t-fast)', fontFamily: 'var(--font)',
}
