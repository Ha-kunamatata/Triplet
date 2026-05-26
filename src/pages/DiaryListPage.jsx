import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTrip, getDiaries, deleteDiary, createDiary } from '../firebase/firestore'
import { timestampToStr } from '../utils/dateUtils'
import { DIARY_MOODS, DIARY_WEATHERS } from '../constants'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useToast } from '../components/common/Toast'

const MOOD_COLORS = {
  happy: '#F59E0B', excited: '#EF4444', good: '#10B981',
  soso: '#6366F1', sad: '#3B82F6', tired: '#94A3B8',
}

export default function DiaryListPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [diaries, setDiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const { show: showToast, ToastEl } = useToast()
  const [filterMood, setFilterMood] = useState('')

  useEffect(() => {
    Promise.allSettled([getTrip(tripId), getDiaries(tripId)])
      .then(([tRes, dRes]) => {
        if (tRes.status === 'fulfilled') setTrip(tRes.value)
        if (dRes.status === 'fulfilled') setDiaries(dRes.value)
      })
      .finally(() => setLoading(false))
  }, [tripId])

  async function handleDelete(id) {
    const deleted = diaries.find(d => d.id === id)
    await deleteDiary(id)
    setDiaries(prev => prev.filter(d => d.id !== id))
    showToast('일기가 삭제되었습니다.', {
      action: '취소',
      duration: 4000,
      onAction: async () => {
        if (deleted) {
          const { id: _, ...data } = deleted
          const newId = await createDiary(data.userId, tripId, data)
          setDiaries(prev => [...prev, { id: newId, ...data }].sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0
            const tb = b.createdAt?.toMillis?.() ?? 0
            return tb - ta
          }))
        }
      },
    })
  }

  const moodCounts = diaries.reduce((acc, d) => {
    if (d.mood) acc[d.mood] = (acc[d.mood] ?? 0) + 1
    return acc
  }, {})

  const displayed = filterMood ? diaries.filter(d => d.mood === filterMood) : diaries
  const hasMoods = diaries.some(d => d.mood)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{
        background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)',
        padding: `calc(env(safe-area-inset-top,0px) + 14px) 20px 0`,
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-2)', background: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <div>
              <h1 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)' }}>여행 일기</h1>
              {trip && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 1 }}>{trip.title}</p>}
            </div>
          </div>
          <button
            onClick={() => navigate(`/trips/${tripId}/diary/new`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', borderRadius: 'var(--r-full)', background: 'var(--c-primary)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', boxShadow: 'var(--shadow-primary)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            새 일기
          </button>
        </div>

        {/* Mood filter chips */}
        {hasMoods && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
            <button onClick={() => setFilterMood('')}
              style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 700, background: !filterMood ? 'var(--c-primary)' : 'var(--c-surface2)', color: !filterMood ? '#fff' : 'var(--c-text-2)', border: 'none', transition: 'all 0.15s' }}>
              전체 {diaries.length}
            </button>
            {DIARY_MOODS.filter(m => moodCounts[m.key]).map(m => (
              <button key={m.key} onClick={() => setFilterMood(f => f === m.key ? '' : m.key)}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 700, background: filterMood === m.key ? MOOD_COLORS[m.key] + '20' : 'var(--c-surface2)', color: filterMood === m.key ? MOOD_COLORS[m.key] : 'var(--c-text-2)', border: `1.5px solid ${filterMood === m.key ? MOOD_COLORS[m.key] : 'transparent'}`, transition: 'all 0.15s' }}>
                {m.emoji} {m.label} <span style={{ opacity: 0.65 }}>·{moodCounts[m.key]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : diaries.length === 0 ? (
        <EmptyState
          icon="book"
          title="아직 일기가 없어요"
          description="여행의 소중한 순간을 기록해보세요 ✍️"
          action="첫 일기 쓰기"
          onAction={() => navigate(`/trips/${tripId}/diary/new`)}
        />
      ) : (
        <div style={{ padding: '16px' }}>

          {/* Mood summary bar */}
          {hasMoods && diaries.length >= 2 && (
            <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '14px 16px', marginBottom: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--c-border)', animation: 'slideInUp 0.3s var(--ease) both' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>여행 기분 요약</p>
              <div style={{ display: 'flex', gap: 0, height: 10, borderRadius: 'var(--r-full)', overflow: 'hidden', marginBottom: 10 }}>
                {DIARY_MOODS.filter(m => moodCounts[m.key]).map(m => (
                  <div key={m.key} style={{ flex: moodCounts[m.key], background: MOOD_COLORS[m.key] ?? 'var(--c-border2)', transition: 'flex 0.4s var(--ease)' }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DIARY_MOODS.filter(m => moodCounts[m.key]).sort((a, b) => (moodCounts[b.key] ?? 0) - (moodCounts[a.key] ?? 0)).map(m => (
                  <span key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--c-text-2)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: MOOD_COLORS[m.key] ?? 'var(--c-border2)', flexShrink: 0 }} />
                    {m.emoji} {m.label} {moodCounts[m.key]}일
                  </span>
                ))}
              </div>
            </div>
          )}

          {displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-text-3)' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>{DIARY_MOODS.find(m => m.key === filterMood)?.emoji}</p>
              <p style={{ fontSize: 14, fontWeight: 600 }}>해당 기분의 일기가 없어요</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {displayed.length}개의 기록
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {displayed.map((d, idx) => {
                  const mood    = DIARY_MOODS.find(m => m.key === d.mood)
                  const weather = DIARY_WEATHERS.find(w => w.key === d.weather)
                  const isLast  = idx === displayed.length - 1
                  const moodColor = MOOD_COLORS[d.mood] ?? 'var(--c-primary)'

                  return (
                    <div key={d.id} style={{ display: 'flex', gap: 0, animation: `slideInUp 0.28s var(--ease) ${idx * 0.06}s both` }}>
                      {/* Timeline connector */}
                      <div style={{ width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 4 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: moodColor, flexShrink: 0, boxShadow: `0 0 0 3px ${moodColor}30` }} />
                        {!isLast && <div style={{ flex: 1, width: 2, background: `linear-gradient(to bottom, ${moodColor}50, var(--c-border))`, minHeight: 24, marginTop: 4 }} />}
                      </div>

                      {/* Card */}
                      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginBottom: 6, fontWeight: 'var(--fw-semibold)' }}>
                          {timestampToStr(d.createdAt)}
                        </p>

                        <div
                          onClick={() => navigate(`/trips/${tripId}/diary/${d.id}/edit`)}
                          className="toss-btn"
                          style={{
                            background: 'var(--c-surface)', borderRadius: 'var(--r-xl)',
                            overflow: 'hidden', cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--c-border)',
                            transition: 'transform var(--t-base), box-shadow var(--t-base)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                        >
                          {/* Top accent bar — mood color */}
                          <div style={{ height: 4, background: mood ? `linear-gradient(90deg, ${moodColor}, ${moodColor}80)` : 'linear-gradient(90deg,#60A5FA,#A78BFA,#F9A8D4)' }} />

                          <div style={{ padding: '14px 16px 16px' }}>
                            {/* Mood & Weather badges */}
                            {(mood || weather) && (
                              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                                {mood && <DiaryBadge emoji={mood.emoji} label={mood.label} color={moodColor} />}
                                {weather && <DiaryBadge emoji={weather.emoji} label={weather.label} />}
                              </div>
                            )}

                            {/* Title */}
                            <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-extrabold)', color: 'var(--c-text-1)', marginBottom: 8, lineHeight: 1.3 }}>
                              {d.title}
                            </p>

                            {/* Content preview */}
                            <p style={{
                              fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', lineHeight: 1.75,
                              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {d.content}
                            </p>

                            {/* Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-primary)', fontWeight: 'var(--fw-semibold)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                자세히 보기 <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                              </span>
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(d.id) }}
                                style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', transition: 'all var(--t-fast)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'var(--c-error)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {ToastEl}
    </div>
  )
}

function DiaryBadge({ emoji, label, color }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 600, color: color ? 'var(--c-text-1)' : 'var(--c-text-2)', background: color ? color + '12' : 'var(--c-surface2)', border: `1px solid ${color ? color + '30' : 'var(--c-border)'}`, borderRadius: 'var(--r-full)', padding: '3px 10px' }}>
      <span style={{ fontSize: 13 }}>{emoji}</span>{label}
    </span>
  )
}
