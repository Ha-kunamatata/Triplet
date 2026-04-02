import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { addSchedule, updateSchedule, getSchedules } from '../firebase/firestore'
import PageHeader from '../components/layout/PageHeader'
import { SCHEDULE_CATEGORIES } from '../constants'

export default function AddSchedulePage() {
  const { tripId, scheduleId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = !!scheduleId

  const [form, setForm] = useState({
    title: '', category: 'attraction', date: location.state?.date ?? '',
    startTime: '', endTime: '', place: '', memo: '', cost: '',
  })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    getSchedules(tripId).then(all => {
      const s = all.find(x => x.id === scheduleId)
      if (s) setForm({ title: s.title, category: s.category, date: s.date, startTime: s.startTime ?? '', endTime: s.endTime ?? '', place: s.place ?? '', memo: s.memo ?? '', cost: s.cost ?? '' })
    }).finally(() => setInitialLoading(false))
  }, [isEdit, scheduleId, tripId])

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.date) return
    setLoading(true)
    const data = { ...form, cost: Number(form.cost) || 0, order: Date.now() }
    try {
      if (isEdit) await updateSchedule(scheduleId, data)
      else await addSchedule(tripId, data)
      navigate(`/trips/${tripId}`)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)' }}>
      불러오는 중...
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)' }}>
      <PageHeader
        title={isEdit ? '일정 수정' : '일정 추가'}
        actions={
          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              padding: '8px 18px', borderRadius: 'var(--r-full)',
              background: loading ? 'var(--c-border2)' : 'var(--c-primary)',
              color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
              boxShadow: loading ? 'none' : 'var(--shadow-primary)',
            }}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        }
      />

      <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Category */}
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '18px', boxShadow: 'var(--shadow-xs)' }}>
          <label style={lbl}>카테고리</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {SCHEDULE_CATEGORIES.map(c => (
              <button
                key={c.key} type="button"
                onClick={() => setForm(p => ({ ...p, category: c.key }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 'var(--r-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
                  background: form.category === c.key ? c.color + '18' : 'var(--c-surface2)',
                  border: `1.5px solid ${form.category === c.key ? c.color : 'transparent'}`,
                  color: form.category === c.key ? c.color : 'var(--c-text-2)',
                  transition: 'all var(--t-fast)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main info */}
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '18px', boxShadow: 'var(--shadow-xs)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <F label="일정 이름 *" value={form.title} onChange={set('title')} placeholder="예) 도쿄 타워 방문" required />

          <div>
            <label style={lbl}>날짜 *</label>
            <input type="date" value={form.date} onChange={set('date')} required style={{ ...inp, marginTop: 6 }} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>시작 시간</label>
              <input type="time" value={form.startTime} onChange={set('startTime')} style={{ ...inp, marginTop: 6 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>종료 시간</label>
              <input type="time" value={form.endTime} onChange={set('endTime')} style={{ ...inp, marginTop: 6 }} />
            </div>
          </div>
        </div>

        {/* Optional info */}
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '18px', boxShadow: 'var(--shadow-xs)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <F label="장소명" value={form.place} onChange={set('place')} placeholder="예) 도쿄 타워" />
          <F label="예산 (원)" value={form.cost} onChange={set('cost')} placeholder="0" type="number" />

          <div>
            <label style={lbl}>메모</label>
            <textarea
              value={form.memo} onChange={set('memo')}
              placeholder="간단한 메모를 남겨보세요"
              rows={3}
              style={{ ...inp, marginTop: 6, resize: 'none', lineHeight: 1.7 }}
            />
          </div>
        </div>
      </form>
    </div>
  )
}

function F({ label, value, onChange, placeholder, required, type = 'text' }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} style={{ ...inp, marginTop: 6 }} />
    </div>
  )
}

const lbl = { fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-2)', display: 'block' }
const inp = { width: '100%', padding: '13px 15px', border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)', fontSize: 'var(--text-base)', outline: 'none', boxSizing: 'border-box', display: 'block', background: 'var(--c-surface2)', color: 'var(--c-text-1)', transition: 'border-color var(--t-fast)', fontFamily: 'var(--font)' }
