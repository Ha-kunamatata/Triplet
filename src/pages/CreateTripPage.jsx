import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createTrip } from '../firebase/firestore'
import PageHeader from '../components/layout/PageHeader'
import { TRIP_EMOJIS, TRIP_STYLES, DEFAULT_CHECKLIST } from '../constants'

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
  const [step, setStep] = useState(1) // 1: 기본정보, 2: 스타일/아이콘
  const [form, setForm] = useState({
    title: '', destination: '', startDate: '', endDate: '', emoji: '✈️', travelStyle: 'mix',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }))
  const [bg1, bg2] = COVER_GRADIENTS[form.emoji] ?? ['#93C5FD', '#3B82F6']

  const tripDays = form.startDate && form.endDate && form.startDate <= form.endDate
    ? Math.round((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1
    : null

  const step1Valid = form.title && form.destination && form.startDate && form.endDate && form.startDate <= form.endDate

  async function handleSubmit() {
    if (!step1Valid) return
    setLoading(true)
    setError('')
    try {
      const id = await createTrip(user.uid, {
        ...form,
        checklist: DEFAULT_CHECKLIST,
      })
      navigate(`/trips/${id}`, { replace: true })
    } catch {
      setError('여행 생성에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  const selectedStyle = TRIP_STYLES.find(s => s.key === form.travelStyle)

  return (
    <div className="fullscreen-page page-enter" style={{ background: 'var(--c-bg)', paddingBottom: 32 }}>
      <PageHeader
        title="새 여행 만들기"
        actions={
          step === 1 ? (
            <button
              onClick={() => step1Valid && setStep(2)}
              disabled={!step1Valid}
              style={{
                padding: '8px 20px', borderRadius: 'var(--r-full)',
                background: step1Valid ? 'var(--c-primary)' : 'var(--c-border2)',
                color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 700,
                boxShadow: step1Valid ? 'var(--shadow-primary)' : 'none',
                transition: 'all var(--t-base)',
              }}
            >다음</button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '8px 20px', borderRadius: 'var(--r-full)',
                background: selectedStyle?.color ?? 'var(--c-primary)',
                color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 700,
                boxShadow: `0 4px 14px ${selectedStyle?.color ?? 'var(--c-primary)'}55`,
                transition: 'all var(--t-base)',
              }}
            >{loading ? '생성 중...' : '여행 시작'}</button>
          )
        }
      />

      {/* 스텝 인디케이터 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px 0', gap: 8 }}>
        {[1,2].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: s <= step ? 'var(--c-primary)' : 'var(--c-border)',
              color: s <= step ? '#fff' : 'var(--c-text-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, transition: 'all var(--t-base)',
            }}>{s}</div>
            <span style={{ fontSize: 12, color: s <= step ? 'var(--c-text-1)' : 'var(--c-text-3)', fontWeight: s === step ? 700 : 400 }}>
              {s === 1 ? '기본 정보' : '스타일 선택'}
            </span>
            {s < 2 && <div style={{ width: 32, height: 2, background: step > s ? 'var(--c-primary)' : 'var(--c-border)', borderRadius: 2, transition: 'background var(--t-base)' }} />}
          </div>
        ))}
      </div>

      {/* ── 미리보기 카드 ── */}
      <div style={{
        margin: '14px 16px 0',
        height: 164,
        background: `linear-gradient(160deg, ${bg1}, ${bg2})`,
        borderRadius: 'var(--r-2xl)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px',
        boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
        position: 'relative', overflow: 'hidden',
        transition: 'background 0.4s ease',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -10, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
          {form.destination && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>location_on</span>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{form.destination}</p>
            </div>
          )}
          <h2 style={{ color: form.title ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 22, fontWeight: 800, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {form.title || '여행 제목'}
          </h2>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {tripDays && <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>📅 {tripDays}일</span>}
            {selectedStyle && <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{selectedStyle.label} 여행</span>}
          </div>
        </div>
        <span style={{ fontSize: 68, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))', flexShrink: 0, zIndex: 1 }}>
          {form.emoji}
        </span>
      </div>

      <div key={step} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, animation: 'slideInUp 0.22s var(--ease) both' }}>
        {/* ────── STEP 1 ────── */}
        {step === 1 && <>
          <Section label="여행 정보" icon="luggage">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <Field label="여행 제목 *" value={form.title} onChange={set('title')} placeholder="예) 도쿄 벚꽃 여행" />
              <Field label="여행지 *" value={form.destination} onChange={set('destination')} placeholder="예) 일본 도쿄" icon="location_on" />
            </div>
          </Section>

          <Section label="여행 기간" icon="calendar_month">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <div>
                <label style={lbl}>출발일</label>
                <input type="date" value={form.startDate} onChange={set('startDate')} required style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>귀국일</label>
                <input type="date" value={form.endDate} onChange={set('endDate')} min={form.startDate} required style={{ ...inp, marginTop: 6 }} />
              </div>
            </div>
            {tripDays && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--c-primary-light)', borderRadius: 'var(--r-lg)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-primary)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--c-primary)', fontWeight: 700 }}>총 {tripDays}일 여행</span>
              </div>
            )}
            {form.startDate && form.endDate && form.endDate < form.startDate && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, padding: '10px 14px', background: '#FEF2F2', borderRadius: 'var(--r-lg)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-error)' }}>error</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--c-error)' }}>귀국일은 출발일 이후여야 합니다</span>
              </div>
            )}
          </Section>

          <button
            onClick={() => step1Valid && setStep(2)}
            disabled={!step1Valid}
            style={{
              width: '100%', padding: '16px',
              background: step1Valid ? 'var(--c-primary)' : 'var(--c-border2)',
              color: '#fff', borderRadius: 'var(--r-xl)',
              fontSize: 'var(--text-base)', fontWeight: 800,
              boxShadow: step1Valid ? 'var(--shadow-primary)' : 'none',
              transition: 'all var(--t-base)', marginTop: 4,
            }}
          >다음 단계 →</button>
        </>}

        {/* ────── STEP 2 ────── */}
        {step === 2 && <>
          <Section label="여행 스타일" icon="auto_awesome">
            <p style={{ fontSize: 13, color: 'var(--c-text-3)', marginTop: 6 }}>이번 여행의 분위기를 선택해주세요</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {TRIP_STYLES.map(s => {
                const active = form.travelStyle === s.key
                return (
                  <button
                    key={s.key} type="button"
                    onClick={() => setForm(p => ({ ...p, travelStyle: s.key }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 'var(--r-lg)',
                      background: active ? s.color + '12' : 'var(--c-surface2)',
                      border: `2px solid ${active ? s.color : 'transparent'}`,
                      transition: 'all var(--t-fast)', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 'var(--r-md)', background: active ? s.color : 'var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background var(--t-fast)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: active ? '#fff' : 'var(--c-text-3)', fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: active ? s.color : 'var(--c-text-1)' }}>{s.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 2 }}>{s.desc}</p>
                    </div>
                    {active && <span className="material-symbols-outlined" style={{ fontSize: 20, color: s.color, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>check_circle</span>}
                  </button>
                )
              })}
            </div>
          </Section>

          <Section label="여행 아이콘" icon="mood">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {TRIP_EMOJIS.map(e => (
                <button
                  key={e} type="button"
                  onClick={() => setForm(p => ({ ...p, emoji: e }))}
                  style={{
                    fontSize: 26, width: 52, height: 52,
                    borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: form.emoji === e ? 'var(--c-primary-light)' : 'var(--c-surface2)',
                    border: `2.5px solid ${form.emoji === e ? 'var(--c-primary)' : 'transparent'}`,
                    transition: 'all var(--t-fast)',
                    transform: form.emoji === e ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: form.emoji === e ? 'var(--shadow-primary)' : 'none',
                  }}
                >{e}</button>
              ))}
            </div>
          </Section>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r-lg)', padding: '12px 16px', display: 'flex', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-error)' }}>error</span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-error)' }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 4 }}>
            <button
              type="button" onClick={() => setStep(1)}
              style={{ padding: '16px', borderRadius: 'var(--r-xl)', background: 'var(--c-surface2)', color: 'var(--c-text-2)', fontSize: 'var(--text-base)', fontWeight: 700, border: '1.5px solid var(--c-border)' }}
            >← 이전</button>
            <button
              type="button" onClick={handleSubmit} disabled={loading}
              style={{
                padding: '16px', borderRadius: 'var(--r-xl)',
                background: selectedStyle?.color ?? 'var(--c-primary)',
                color: '#fff', fontSize: 'var(--text-base)', fontWeight: 800,
                boxShadow: `0 4px 16px ${selectedStyle?.color ?? 'var(--c-primary)'}50`,
                transition: 'all var(--t-base)',
              }}
            >{loading ? '생성 중...' : '✈️  여행 시작하기'}</button>
          </div>
        </>}
      </div>
    </div>
  )
}

function Section({ label, icon, children }) {
  return (
    <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '16px 18px', boxShadow: 'var(--shadow-xs)', border: '1px solid var(--c-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-text-3)', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, icon }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ position: 'relative', marginTop: 6 }}>
        {icon && <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--c-text-3)', pointerEvents: 'none', fontVariationSettings: "'FILL' 1" }}>{icon}</span>}
        <input
          value={value} onChange={onChange} placeholder={placeholder}
          style={{ ...inp, paddingLeft: icon ? 42 : 15 }}
        />
      </div>
    </div>
  )
}

const lbl = { fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--c-text-2)', display: 'block' }
const inp = { width: '100%', padding: '13px 15px', border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)', fontSize: 'var(--text-base)', outline: 'none', boxSizing: 'border-box', display: 'block', background: 'var(--c-surface2)', color: 'var(--c-text-1)', transition: 'border-color var(--t-fast)', fontFamily: 'var(--font)' }
