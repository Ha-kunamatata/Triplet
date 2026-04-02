import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createTrip } from '../firebase/firestore'
import PageHeader from '../components/layout/PageHeader'
import { TRIP_EMOJIS } from '../constants'

export default function CreateTripPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', destination: '', startDate: '', endDate: '', emoji: '✈️' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.endDate < form.startDate) return setError('귀국일은 출발일 이후여야 합니다.')
    setLoading(true)
    setError('')
    try {
      const id = await createTrip(user.uid, form)
      navigate(`/trips/${id}`, { replace: true })
    } catch {
      setError('여행 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)' }}>
      <PageHeader
        title="새 여행 만들기"
        actions={
          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              padding: '8px 18px', borderRadius: 'var(--r-full)',
              background: loading ? 'var(--c-border2)' : 'var(--c-primary)',
              color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
              boxShadow: loading ? 'none' : 'var(--shadow-primary)',
              transition: 'all var(--t-base)',
            }}
          >
            {loading ? '생성 중...' : '만들기'}
          </button>
        }
      />

      <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Emoji picker */}
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '18px', boxShadow: 'var(--shadow-xs)' }}>
          <label style={lbl}>여행 아이콘</label>

          {/* Selected preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--r-xl)',
              background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, boxShadow: 'var(--shadow-md)',
            }}>
              {form.emoji}
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-3)' }}>아이콘을 선택하세요</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TRIP_EMOJIS.map(e => (
              <button
                key={e} type="button" onClick={() => setForm(p => ({ ...p, emoji: e }))}
                style={{
                  fontSize: 26, width: 48, height: 48,
                  borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: form.emoji === e ? 'var(--c-primary-light)' : 'var(--c-surface2)',
                  border: `2px solid ${form.emoji === e ? 'var(--c-primary)' : 'transparent'}`,
                  transition: 'all var(--t-fast)',
                  transform: form.emoji === e ? 'scale(1.1)' : 'scale(1)',
                }}
              >{e}</button>
            ))}
          </div>
        </div>

        {/* Text fields */}
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '18px', boxShadow: 'var(--shadow-xs)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="여행 제목 *" value={form.title} onChange={set('title')} placeholder="예) 도쿄 벚꽃 여행" required />
          <Field label="여행지 *" value={form.destination} onChange={set('destination')} placeholder="예) 일본 도쿄" required />
        </div>

        {/* Dates */}
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '18px', boxShadow: 'var(--shadow-xs)' }}>
          <label style={{ ...lbl, marginBottom: 12 }}>여행 기간</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...lbl, marginBottom: 6 }}>출발일</label>
              <input type="date" value={form.startDate} onChange={set('startDate')} required style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...lbl, marginBottom: 6 }}>귀국일</label>
              <input type="date" value={form.endDate} onChange={set('endDate')} min={form.startDate} required style={inp} />
            </div>
          </div>
          {form.startDate && form.endDate && form.startDate <= form.endDate && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-primary)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 'var(--fw-semibold)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
              총 {Math.round((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1}일 여행
            </p>
          )}
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r-lg)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-error)' }}>error</span>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-error)' }}>{error}</p>
          </div>
        )}
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} required={required} style={{ ...inp, marginTop: 6 }} />
    </div>
  )
}

const lbl = { fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-2)', display: 'block' }
const inp = { width: '100%', padding: '13px 15px', border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)', fontSize: 'var(--text-base)', outline: 'none', boxSizing: 'border-box', display: 'block', background: 'var(--c-surface2)', color: 'var(--c-text-1)', transition: 'border-color var(--t-fast)' }
