import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTrip, getDiaries, deleteDiary } from '../firebase/firestore'
import { timestampToStr } from '../utils/dateUtils'
import { DIARY_MOODS, DIARY_WEATHERS } from '../constants'
import PageHeader from '../components/layout/PageHeader'
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
      <PageHeader
        title="여행 일기"
        subtitle={trip?.title}
        actions={
          <button
            onClick={() => navigate(`/trips/${tripId}/diary/new`)}
            style={{
              height: 36, padding: '0 14px', borderRadius: 'var(--r-full)',
              background: 'var(--c-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)',
              boxShadow: 'var(--shadow-primary)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            새 일기
          </button>
        }
      />

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
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {diaries.map((d, idx) => {
            const mood    = DIARY_MOODS.find(m => m.key === d.mood)
            const weather = DIARY_WEATHERS.find(w => w.key === d.weather)
            const colors = ['#EFF6FF', '#F0FDF4', '#FFF7ED', '#FDF4FF', '#FEF2F2']
            const bg = colors[idx % colors.length]

            return (
              <div
                key={d.id}
                onClick={() => navigate(`/trips/${tripId}/diary/${d.id}/edit`)}
                style={{
                  background: 'var(--c-surface)', borderRadius: 'var(--r-2xl)',
                  overflow: 'hidden', cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform var(--t-base), box-shadow var(--t-base)',
                  border: '1px solid var(--c-border)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
              >
                {/* Color accent top bar */}
                <div style={{ height: 4, background: `linear-gradient(90deg, #60A5FA, #A78BFA)` }} />

                <div style={{ padding: '16px' }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {mood && (
                        <span style={{
                          fontSize: 'var(--text-xs)', background: 'var(--c-surface2)',
                          border: '1px solid var(--c-border)', borderRadius: 'var(--r-full)',
                          padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4,
                          color: 'var(--c-text-2)', fontWeight: 'var(--fw-medium)',
                        }}>
                          <span style={{ fontSize: 14 }}>{mood.emoji}</span>{mood.label}
                        </span>
                      )}
                      {weather && (
                        <span style={{
                          fontSize: 'var(--text-xs)', background: 'var(--c-surface2)',
                          border: '1px solid var(--c-border)', borderRadius: 'var(--r-full)',
                          padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4,
                          color: 'var(--c-text-2)', fontWeight: 'var(--fw-medium)',
                        }}>
                          <span style={{ fontSize: 14 }}>{weather.emoji}</span>{weather.label}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(d.id) }}
                      style={{
                        width: 30, height: 30, borderRadius: 'var(--r-sm)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--c-text-3)', transition: 'all var(--t-fast)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = 'var(--c-error)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </div>

                  <p style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)', marginBottom: 6, lineHeight: 1.3 }}>
                    {d.title}
                  </p>
                  <p style={{
                    fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', lineHeight: 1.7,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {d.content}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                      {timestampToStr(d.createdAt)}
                    </p>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-primary)', fontWeight: 'var(--fw-semibold)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      읽기 <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
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
