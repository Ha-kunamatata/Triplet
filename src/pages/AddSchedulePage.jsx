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

  // 수정 모드: 기존 데이터 불러오기
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
      if (isEdit) {
        await updateSchedule(scheduleId, data)
      } else {
        await addSchedule(tripId, data)
      }
      navigate(`/trips/${tripId}`)
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div style={{ padding: 32, textAlign: 'center' }}>불러오는 중...</div>

  return (
    <div style={{ minHeight: '100dvh', background: '#fff' }}>
      <PageHeader
        title={isEdit ? '일정 수정' : '일정 추가'}
        actions={
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '8px 18px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 700 }}>
            {loading ? '저장 중...' : '저장'}
          </button>
        }
      />

      <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* 카테고리 */}
        <div>
          <label style={lbl}>카테고리</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {SCHEDULE_CATEGORIES.map(c => (
              <button
                key={c.key} type="button"
                onClick={() => setForm(p => ({ ...p, category: c.key }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                  borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600,
                  background: form.category === c.key ? c.color + '20' : 'var(--bg)',
                  border: `1.5px solid ${form.category === c.key ? c.color : 'transparent'}`,
                  color: form.category === c.key ? c.color : 'var(--text-secondary)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <F label="일정 이름 *" value={form.title} onChange={set('title')} placeholder="ex) 도쿄 타워 방문" required />

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

        <F label="장소명" value={form.place} onChange={set('place')} placeholder="ex) 도쿄 타워" />
        <F label="예산 (원)" value={form.cost} onChange={set('cost')} placeholder="0" type="number" />

        <div>
          <label style={lbl}>메모</label>
          <textarea value={form.memo} onChange={set('memo')} placeholder="간단한 메모를 남겨보세요" rows={3}
            style={{ ...inp, marginTop: 6, resize: 'none', lineHeight: 1.6 }} />
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
const lbl = { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }
const inp = { width: '100%', padding: '13px 15px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 15, outline: 'none', boxSizing: 'border-box', display: 'block' }
