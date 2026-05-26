import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createDiary, updateDiary, getDiary } from '../firebase/firestore'
import { DIARY_MOODS, DIARY_WEATHERS } from '../constants'

export default function DiaryEditPage() {
  const { tripId, diaryId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isEdit = !!diaryId

  const [form, setForm] = useState({ title: '', content: '', mood: '', weather: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showMeta, setShowMeta] = useState(false)
  const autoSaveRef = useRef(null)
  const diaryIdRef = useRef(diaryId)
  const isNewRef = useRef(!diaryId)

  useEffect(() => {
    if (!isEdit) return
    getDiary(diaryId).then(d => {
      if (d) setForm({ title: d.title, content: d.content, mood: d.mood ?? '', weather: d.weather ?? '' })
    })
  }, [isEdit, diaryId])

  const set = key => e => {
    const val = e.target.value
    setForm(p => {
      const next = { ...p, [key]: val }
      scheduleAutoSave(next)
      return next
    })
    setSaved(false)
  }
  const toggle = (key, val) => setForm(p => ({ ...p, [key]: p[key] === val ? '' : val }))

  function scheduleAutoSave(nextForm) {
    if (!nextForm.title?.trim() || !nextForm.content?.trim()) return
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(async () => {
      try {
        if (diaryIdRef.current) {
          await updateDiary(diaryIdRef.current, nextForm)
        } else if (isNewRef.current) {
          const id = await createDiary(user.uid, tripId, nextForm)
          diaryIdRef.current = id
          isNewRef.current = false
          window.history.replaceState(null, '', window.location.href.replace('/new', `/${id}/edit`))
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch {}
    }, 1400)
  }

  useEffect(() => () => clearTimeout(autoSaveRef.current), [])

  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0
  const charCount = form.content.length
  const canSave = form.title.trim() && form.content.trim()

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      if (isEdit) await updateDiary(diaryId, form)
      else await createDiary(user.uid, tripId, form)
      navigate(`/trips/${tripId}/diary`)
    } finally {
      setSaving(false)
    }
  }

  const selectedMood = DIARY_MOODS.find(m => m.key === form.mood)
  const selectedWeather = DIARY_WEATHERS.find(w => w.key === form.weather)

  return (
    <div className="fullscreen-page page-enter" style={{ background: 'var(--c-surface)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top nav ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `calc(env(safe-area-inset-top,0px) + 14px) 16px 14px`,
        borderBottom: '1px solid var(--c-border)',
        background: 'var(--c-surface-glass)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-2)', background: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)' }}>
              {isEdit ? '일기 수정' : '일기 쓰기'}
            </p>
            <p style={{ fontSize: 10, color: saved ? 'var(--c-success)' : 'var(--c-text-3)', transition: 'color 0.3s' }}>
              {saved ? '✓ 자동 저장됨' : form.content ? `${charCount}자 · ${wordCount}단어` : '글을 입력하면 자동 저장돼요'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Mood/Weather quick indicator */}
          {(selectedMood || selectedWeather) && (
            <button onClick={() => setShowMeta(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-full)', fontSize: 14 }}>
              {selectedMood && <span>{selectedMood.emoji}</span>}
              {selectedWeather && <span>{selectedWeather.emoji}</span>}
            </button>
          )}
          <button
            onClick={() => setShowMeta(m => !m)}
            style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showMeta ? 'var(--c-primary)' : 'var(--c-text-2)', background: showMeta ? 'var(--c-primary-light)' : 'var(--c-surface2)', border: `1.5px solid ${showMeta ? 'var(--c-primary)' : 'var(--c-border)'}` }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>mood</span>
          </button>
          <button
            onClick={handleSave} disabled={saving || !canSave}
            style={{
              padding: '8px 20px', borderRadius: 'var(--r-full)',
              background: !canSave ? 'var(--c-border2)' : 'var(--c-primary)',
              color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)',
              boxShadow: !canSave ? 'none' : 'var(--shadow-primary)',
              transition: 'all var(--t-base)',
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* ── Mood / Weather panel ── */}
      {showMeta && (
        <div style={{ background: 'var(--c-surface2)', borderBottom: '1px solid var(--c-border)', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-3)', marginBottom: 8 }}>오늘의 기분</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIARY_MOODS.map(m => (
                <button key={m.key} type="button" onClick={() => toggle('mood', m.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '8px 16px', borderRadius: 'var(--r-xl)',
                    background: form.mood === m.key ? 'var(--c-primary-light)' : 'var(--c-surface)',
                    border: `1.5px solid ${form.mood === m.key ? 'var(--c-primary)' : 'var(--c-border)'}`,
                    transition: 'all var(--t-fast)',
                    boxShadow: form.mood === m.key ? 'var(--shadow-primary)' : 'none',
                  }}>
                  <span style={{ fontSize: 24 }}>{m.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: form.mood === m.key ? 'var(--c-primary)' : 'var(--c-text-3)' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-3)', marginBottom: 8 }}>날씨</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIARY_WEATHERS.map(w => (
                <button key={w.key} type="button" onClick={() => toggle('weather', w.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '8px 16px', borderRadius: 'var(--r-xl)',
                    background: form.weather === w.key ? 'var(--c-primary-light)' : 'var(--c-surface)',
                    border: `1.5px solid ${form.weather === w.key ? 'var(--c-primary)' : 'var(--c-border)'}`,
                    transition: 'all var(--t-fast)',
                    boxShadow: form.weather === w.key ? 'var(--shadow-primary)' : 'none',
                  }}>
                  <span style={{ fontSize: 24 }}>{w.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: form.weather === w.key ? 'var(--c-primary)' : 'var(--c-text-3)' }}>{w.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Writing area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 20px 0' }}>
        {/* Mood/weather display strip */}
        {(selectedMood || selectedWeather) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {selectedMood && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--c-text-2)', fontWeight: 600, background: 'var(--c-surface2)', padding: '4px 12px', borderRadius: 'var(--r-full)', border: '1px solid var(--c-border)' }}>
                {selectedMood.emoji} {selectedMood.label}
              </span>
            )}
            {selectedWeather && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--c-text-2)', fontWeight: 600, background: 'var(--c-surface2)', padding: '4px 12px', borderRadius: 'var(--r-full)', border: '1px solid var(--c-border)' }}>
                {selectedWeather.emoji} {selectedWeather.label}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <input
          value={form.title}
          onChange={set('title')}
          placeholder="제목을 입력하세요"
          maxLength={80}
          style={{
            width: '100%', fontSize: 24, fontWeight: 900, color: 'var(--c-text-1)',
            border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font)', letterSpacing: -0.5,
            borderBottom: '2px solid var(--c-border)', paddingBottom: 14,
            marginBottom: 16, boxSizing: 'border-box',
            transition: 'border-color var(--t-fast)',
          }}
          onFocus={e => e.target.style.borderBottomColor = 'var(--c-primary)'}
          onBlur={e => e.target.style.borderBottomColor = 'var(--c-border)'}
        />

        {/* Body */}
        <textarea
          value={form.content}
          onChange={set('content')}
          placeholder={`오늘 하루 어떠셨나요?\n\n여행의 소중한 순간, 느낌, 맛있었던 음식, 아름다웠던 풍경을 자유롭게 기록해보세요...`}
          style={{
            flex: 1, width: '100%', minHeight: 300,
            fontSize: 'var(--text-base)', color: 'var(--c-text-1)',
            border: 'none', outline: 'none', resize: 'none',
            lineHeight: 2.0, background: 'transparent',
            fontFamily: 'var(--font)', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        padding: `12px 20px calc(12px + env(safe-area-inset-bottom,0px))`,
        borderTop: '1px solid var(--c-border)',
        background: 'var(--c-surface-glass)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)' }}>
          {charCount > 0 ? `${charCount.toLocaleString()}자` : '글을 입력하세요'}
        </p>
        <button
          onClick={handleSave} disabled={saving || !canSave}
          style={{
            padding: '10px 24px', borderRadius: 'var(--r-full)',
            background: !canSave ? 'var(--c-border2)' : 'var(--c-primary)',
            color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-extrabold)',
            boxShadow: !canSave ? 'none' : 'var(--shadow-primary)',
            transition: 'all var(--t-base)',
          }}
        >
          {saving ? '저장 중...' : isEdit ? '수정 완료' : '일기 저장'}
        </button>
      </div>
    </div>
  )
}
