import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createTrip } from '../firebase/firestore'
import PageHeader from '../components/layout/PageHeader'
import { TRIP_EMOJIS } from '../constants'

const COVER_GRADIENTS = {
  '✈️': ['#60A5FA','#2563EB'], '🗺️': ['#34D399','#059669'],
  '🏖️': ['#FBBF24','#F97316'], '🏔️': ['#6EE7B7','#10B981'],
  '🌆': ['#A78BFA','#7C3AED'], '🌸': ['#F9A8D4','#EC4899'],
  '🍜': ['#FCD34D','#D97706'], '🎡': ['#67E8F9','#0891B2'],
  '🏰': ['#D4A574','#92400E'], '🌅': ['#FCA5A5','#EF4444'],
  '🎭': ['#C4B5FD','#8B5CF6'], '🚂': ['#94A3B8','#475569'],
}

export default function CreateTripPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', destination: '', startDate: '', endDate: '', emoji: '✈️' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }))
  const [bg1, bg2] = COVER_GRADIENTS[form.emoji] ?? ['#93C5FD', '#3B82F6']

  const tripDays = form.startDate && form.endDate && form.startDate <= form.endDate
    ? Math.round((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.endDate < form.startDate) return setError('귀국일은 출발일 이후여야 합니다.')
    setLoading(true)
    setError('')
    try {
      const id = await createTrip(user.uid, form)
      navigate(`/trips/${id}`, { replace: true })
    } catch {
      setError('여행 생성에 실패했습니다. 다시 시도해주세요.')
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
            onClick={handleSubmit} disabled={loading || !form.title || !form.startDate || !form.endDate}
            style={{
              padding: '8px 20px', borderRadius: 'var(--r-full)',
              background: (!form.title || !form.startDate || !form.endDate) ? 'var(--c-border2)' : 'var(--c-primary)',
              color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
              boxShadow: (!form.title || !form.startDate || !form.endDate) ? 'none' : 'var(--shadow-primary)',
              transition: 'all var(--t-base)', cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '생성 중...' : '만들기'}
          </button>
        }
      />

      {/* ── Live Preview Card ── */}
      <div style={{
        margin: '16px 16px 0',
        height: 160,
        background: `linear-gradient(160deg, ${bg1}, ${bg2})`,
        borderRadius: 'var(--r-2xl)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px',
        boxShadow: 'var(--shadow-md)',
        position: 'relative', overflow: 'hidden',
        transition: 'background 0.4s ease',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4 }}>
            {form.destination || '여행지를 입력하세요'}
          </p>
          <h2 style={{ color: form.title ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: 800, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {form.title || '여행 제목'}
          </h2>
          {tripDays && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 }}>
              📅 {tripDays}일 여행
            </p>
          )}
        </div>
        <span style={{ fontSize: 64, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))', flexShrink: 0 }}>
          {form.emoji}
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Emoji picker */}
        <Section label="여행 아이콘">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {TRIP_EMOJIS.map(e => (
              <button
                key={e} type="button" onClick={() => setForm(p => ({ ...p, emoji: e }))}
                style={{
                  fontSize: 24, width: 46, height: 46,
                  borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: form.emoji === e ? 'var(--c-primary-light)' : 'var(--c-surface2)',
                  border: `2px solid ${form.emoji === e ? 'var(--c-primary)' : 'transparent'}`,
                  transition: 'all var(--t-fast)',
                  transform: form.emoji === e ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: form.emoji === e ? 'var(--shadow-primary)' : 'none',
                }}
              >{e}</button>
            ))}
          </div>
        </Section>

        {/* Text fields */}
        <Section label="여행 정보">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <Field label="여행 제목 *" value={form.title} onChange={set('title')} placeholder="예) 도쿄 벚꽃 여행" required />
            <Field label="여행지 *" value={form.destination} onChange={set('destination')} placeholder="예) 일본 도쿄" required />
          </div>
        </Section>

        {/* Dates */}
        <Section label="여행 기간">
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>출발일</label>
              <input type="date" value={form.startDate} onChange={set('startDate')} required style={{ ...inp, marginTop: 6 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>귀국일</label>
              <input type="date" value={form.endDate} onChange={set('endDate')} min={form.startDate} required style={{ ...inp, marginTop: 6 }} />
            </div>
          </div>
          {tripDays && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--c-primary-light)', borderRadius: 'var(--r-md)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--c-primary)' }}>check_circle</span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--c-primary)', fontWeight: 'var(--fw-semibold)' }}>총 {tripDays}일 여행</span>
            </div>
          )}
        </Section>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r-lg)', padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-error)', flexShrink: 0 }}>error</span>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-error)' }}>{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading || !form.title || !form.startDate || !form.endDate} style={{
          width: '100%', padding: '16px',
          background: (!form.title || !form.startDate || !form.endDate) ? 'var(--c-border2)' : 'var(--c-primary)',
          color: '#fff', borderRadius: 'var(--r-xl)',
          fontSize: 'var(--text-base)', fontWeight: 'var(--fw-extrabold)',
          boxShadow: (!form.title || !form.startDate || !form.endDate) ? 'none' : 'var(--shadow-primary)',
          transition: 'all var(--t-base)', cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: 4,
        }}>
          {loading ? '여행 만드는 중...' : '✈️  여행 시작하기'}
        </button>
      </form>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '16px 18px', boxShadow: 'var(--shadow-xs)' }}>
      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
      {children}
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
const inp = { width: '100%', padding: '13px 15px', border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)', fontSize: 'var(--text-base)', outline: 'none', boxSizing: 'border-box', display: 'block', background: 'var(--c-surface2)', color: 'var(--c-text-1)', transition: 'border-color var(--t-fast)', fontFamily: 'var(--font)' }
