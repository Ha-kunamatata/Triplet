import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createDiary, updateDiary, getDiary } from '../firebase/firestore'
import { DIARY_MOODS, DIARY_WEATHERS } from '../constants'
import PageHeader from '../components/layout/PageHeader'

export default function DiaryEditPage() {
  const { tripId, diaryId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isEdit = !!diaryId

  const [form, setForm] = useState({ title: '', content: '', mood: '', weather: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    getDiary(diaryId).then(d => {
      if (d) setForm({ title: d.title, content: d.content, mood: d.mood ?? '', weather: d.weather ?? '' })
    })
  }, [isEdit, diaryId])

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }))
  const toggle = (key, val) => setForm(p => ({ ...p, [key]: p[key] === val ? '' : val }))

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return
    setLoading(true)
    try {
      if (isEdit) await updateDiary(diaryId, form)
      else await createDiary(user.uid, tripId, form)
      navigate(`/trips/${tripId}/diary`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-surface)', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={isEdit ? '일기 수정' : '일기 쓰기'}
        actions={
          <button
            onClick={handleSave} disabled={loading || !form.title.trim() || !form.content.trim()}
            style={{
              padding: '8px 18px', borderRadius: 'var(--r-full)',
              background: (!form.title.trim() || !form.content.trim()) ? 'var(--c-border2)' : 'var(--c-primary)',
              color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
              boxShadow: (!form.title.trim() || !form.content.trim()) ? 'none' : 'var(--shadow-primary)',
              transition: 'all var(--t-base)',
            }}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        }
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Mood & Weather selectors */}
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 16, borderBottom: '1px solid var(--c-border)' }}>
          {/* Mood */}
          <div>
            <p style={lbl}>오늘의 기분</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {DIARY_MOODS.map(m => (
                <button key={m.key} type="button" onClick={() => toggle('mood', m.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '8px 14px', borderRadius: 'var(--r-lg)', gap: 3,
                    background: form.mood === m.key ? 'var(--c-primary-light)' : 'var(--c-surface2)',
                    border: `1.5px solid ${form.mood === m.key ? 'var(--c-primary)' : 'transparent'}`,
                    transition: 'all var(--t-fast)',
                    transform: form.mood === m.key ? 'scale(1.05)' : 'scale(1)',
                  }}>
                  <span style={{ fontSize: 22 }}>{m.emoji}</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: form.mood === m.key ? 'var(--c-primary)' : 'var(--c-text-3)' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div style={{ paddingBottom: 16 }}>
            <p style={lbl}>날씨</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {DIARY_WEATHERS.map(w => (
                <button key={w.key} type="button" onClick={() => toggle('weather', w.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '8px 14px', borderRadius: 'var(--r-lg)', gap: 3,
                    background: form.weather === w.key ? 'var(--c-primary-light)' : 'var(--c-surface2)',
                    border: `1.5px solid ${form.weather === w.key ? 'var(--c-primary)' : 'transparent'}`,
                    transition: 'all var(--t-fast)',
                    transform: form.weather === w.key ? 'scale(1.05)' : 'scale(1)',
                  }}>
                  <span style={{ fontSize: 22 }}>{w.emoji}</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: form.weather === w.key ? 'var(--c-primary)' : 'var(--c-text-3)' }}>{w.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Writing area */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            value={form.title} onChange={set('title')}
            placeholder="제목을 입력하세요"
            style={{
              width: '100%', fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)',
              border: 'none', outline: 'none', color: 'var(--c-text-1)',
              background: 'transparent', fontFamily: 'var(--font)',
              borderBottom: '2px solid var(--c-border)', paddingBottom: 12,
              boxSizing: 'border-box',
            }}
          />
          <textarea
            value={form.content} onChange={set('content')}
            placeholder="오늘의 여행 이야기를 자유롭게 써보세요..."
            style={{
              flex: 1, width: '100%', fontSize: 'var(--text-base)',
              border: 'none', outline: 'none', resize: 'none',
              lineHeight: 1.9, minHeight: 280,
              color: 'var(--c-text-1)', background: 'transparent',
              fontFamily: 'var(--font)', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
    </div>
  )
}

const lbl = { fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-2)' }
