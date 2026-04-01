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
    <div style={{ minHeight: '100dvh', background: '#fff' }}>
      <PageHeader
        title="새 여행 만들기"
        actions={
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '8px 18px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 700 }}>
            {loading ? '생성 중...' : '만들기'}
          </button>
        }
      />

      <form onSubmit={handleSubmit} style={{ padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 이모지 선택 */}
        <div>
          <label style={labelStyle}>여행 아이콘</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {TRIP_EMOJIS.map(e => (
              <button
                key={e} type="button" onClick={() => setForm(p => ({ ...p, emoji: e }))}
                style={{
                  fontSize: 28, padding: '6px 10px', borderRadius: 'var(--radius-md)',
                  background: form.emoji === e ? 'var(--primary-light)' : 'var(--bg)',
                  border: form.emoji === e ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >{e}</button>
            ))}
          </div>
        </div>

        <Field label="여행 제목" value={form.title} onChange={set('title')} placeholder="ex) 도쿄 벚꽃 여행" required />
        <Field label="여행지" value={form.destination} onChange={set('destination')} placeholder="ex) 일본 도쿄" required />

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>출발일</label>
            <input type="date" value={form.startDate} onChange={set('startDate')} required style={{ ...inputStyle, marginTop: 6 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>귀국일</label>
            <input type="date" value={form.endDate} onChange={set('endDate')} min={form.startDate} required style={{ ...inputStyle, marginTop: 6 }} />
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: 'var(--error)' }}>{error}</p>}
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} required={required} style={{ ...inputStyle, marginTop: 6 }} />
    </div>
  )
}

const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }
const inputStyle = { width: '100%', padding: '13px 15px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 15, outline: 'none', boxSizing: 'border-box', display: 'block' }
