import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTrip, getDiaries, deleteDiary } from '../firebase/firestore'
import { timestampToStr } from '../utils/dateUtils'
import { DIARY_MOODS, DIARY_WEATHERS } from '../constants'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import Toast from '../components/common/Toast'

export default function DiaryListPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [diaries, setDiaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    Promise.allSettled([getTrip(tripId), getDiaries(tripId)])
      .then(([tRes, dRes]) => {
        if (tRes.status === 'fulfilled') setTrip(tRes.value)
        if (dRes.status === 'fulfilled') setDiaries(dRes.value)
      })
      .finally(() => setLoading(false))
  }, [tripId])

  async function handleDelete() {
    await deleteDiary(deleteTarget)
    setDiaries(prev => prev.filter(d => d.id !== deleteTarget))
    setDeleteTarget(null)
    setToast({ message: '일기가 삭제되었습니다.' })
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{
        background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)',
        padding: `calc(env(safe-area-inset-top,0px) + 14px) 20px 14px`,
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            새 일기
          </button>
        </div>
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
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {diaries.length}개의 기록
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {diaries.map((d, idx) => {
              const mood    = DIARY_MOODS.find(m => m.key === d.mood)
              const weather = DIARY_WEATHERS.find(w => w.key === d.weather)
              const isLast  = idx === diaries.length - 1

              return (
                <div key={d.id} style={{ display: 'flex', gap: 0 }}>
                  {/* Timeline connector */}
                  <div style={{ width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--c-primary)', flexShrink: 0, boxShadow: '0 0 0 3px var(--c-primary-dim)' }} />
                    {!isLast && <div style={{ flex: 1, width: 2, background: 'linear-gradient(to bottom, var(--c-primary)40, var(--c-border))', minHeight: 24, marginTop: 4 }} />}
                  </div>

                  {/* Card */}
                  <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
                    {/* Date label */}
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginBottom: 6, fontWeight: 'var(--fw-semibold)' }}>
                      {timestampToStr(d.createdAt)}
                    </p>

                    <div
                      onClick={() => navigate(`/trips/${tripId}/diary/${d.id}/edit`)}
                      style={{
                        background: 'var(--c-surface)', borderRadius: 'var(--r-xl)',
                        overflow: 'hidden', cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--c-border)',
                        transition: 'transform var(--t-base), box-shadow var(--t-base)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                    >
                      {/* Top accent bar with gradient */}
                      <div style={{ height: 3, background: 'linear-gradient(90deg,#60A5FA,#A78BFA,#F9A8D4)' }} />

                      <div style={{ padding: '14px 16px 16px' }}>
                        {/* Mood & Weather badges */}
                        {(mood || weather) && (
                          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                            {mood && <Badge emoji={mood.emoji} label={mood.label} />}
                            {weather && <Badge emoji={weather.emoji} label={weather.label} />}
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
                            onClick={e => { e.stopPropagation(); setDeleteTarget(d.id) }}
                            style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', transition: 'all var(--t-fast)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = 'var(--c-error)' }}
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
        </div>
      )}

      {deleteTarget && (
        <Modal title="일기를 삭제할까요?" onClose={() => setDeleteTarget(null)} confirmLabel="삭제" onConfirm={handleDelete} danger>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', lineHeight: 1.7 }}>삭제된 일기는 복구할 수 없습니다.</p>
        </Modal>
      )}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}

function Badge({ emoji, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-medium)', color: 'var(--c-text-2)', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-full)', padding: '3px 10px' }}>
      <span style={{ fontSize: 13 }}>{emoji}</span>{label}
    </span>
  )
}
