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
      if (isEdit) {
        await updateDiary(diaryId, form)
      } else {
        await createDiary(user.uid, tripId, form)
      }
      navigate(`/trips/${tripId}/diary`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={isEdit ? '일기 수정' : '일기 쓰기'}
        actions={
          <button onClick={handleSave} disabled={loading} style={{ padding: '8px 18px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 700 }}>
            {loading ? '저장 중...' : '저장'}
          </button>
        }
      />

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        {/* 기분 */}
        <div>
          <p style={lbl}>오늘의 기분</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {DIARY_MOODS.map(m => (
              <button key={m.key} type="button" onClick={() => toggle('mood', m.key)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: form.mood === m.key ? 'var(--primary-light)' : 'var(--bg)', border: `1.5px solid ${form.mood === m.key ? 'var(--primary)' : 'transparent'}`, gap: 3 }}>
                <span style={{ fontSize: 22 }}>{m.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: form.mood === m.key ? 'var(--primary)' : 'var(--text-secondary)' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 날씨 */}
        <div>
          <p style={lbl}>날씨</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {DIARY_WEATHERS.map(w => (
              <button key={w.key} type="button" onClick={() => toggle('weather', w.key)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: form.weather === w.key ? 'var(--primary-light)' : 'var(--bg)', border: `1.5px solid ${form.weather === w.key ? 'var(--primary)' : 'transparent'}`, gap: 3 }}>
                <span style={{ fontSize: 22 }}>{w.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: form.weather === w.key ? 'var(--primary)' : 'var(--text-secondary)' }}>{w.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <input
          value={form.title} onChange={set('title')} placeholder="제목"
          style={{ width: '100%', fontSize: 22, fontWeight: 700, border: 'none', outline: 'none', borderBottom: '1.5px solid var(--border)', paddingBottom: 12, boxSizing: 'border-box' }}
        />

        {/* 본문 */}
        <textarea
          value={form.content} onChange={set('content')} placeholder="오늘의 여행 이야기를 써보세요..."
          style={{ flex: 1, width: '100%', fontSize: 15, border: 'none', outline: 'none', resize: 'none', lineHeight: 1.8, minHeight: 300, boxSizing: 'border-box' }}
        />
      </div>
    </div>
  )
}

const lbl = { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }
