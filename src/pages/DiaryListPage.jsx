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
    Promise.all([getTrip(tripId), getDiaries(tripId)])
      .then(([t, d]) => { setTrip(t); setDiaries(d) })
      .finally(() => setLoading(false))
  }, [tripId])

  async function handleDelete() {
    await deleteDiary(deleteTarget)
    setDiaries(prev => prev.filter(d => d.id !== deleteTarget))
    setDeleteTarget(null)
    setToast({ message: '일기가 삭제되었습니다.' })
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', paddingBottom: 32 }}>
      <PageHeader
        title="여행 일기"
        subtitle={trip?.title}
        actions={
          <button
            onClick={() => navigate(`/trips/${tripId}/diary/new`)}
            style={{
              width: 36, height: 36, borderRadius: 'var(--r-xl)',
              background: 'var(--c-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-primary)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : diaries.length === 0 ? (
        <EmptyState
          icon="book"
          title="아직 일기가 없어요"
          description="여행의 소중한 순간을 기록해보세요"
          action="첫 일기 쓰기"
          onAction={() => navigate(`/trips/${tripId}/diary/new`)}
        />
      ) : (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {diaries.map(d => {
            const mood    = DIARY_MOODS.find(m => m.key === d.mood)
            const weather = DIARY_WEATHERS.find(w => w.key === d.weather)
            return (
              <div
                key={d.id}
                onClick={() => navigate(`/trips/${tripId}/diary/${d.id}/edit`)}
                style={{
                  background: 'var(--c-surface)', borderRadius: 'var(--r-xl)',
                  padding: '18px', boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer', transition: 'box-shadow var(--t-fast), transform var(--t-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = '' }}
              >
                {/* Top row: mood/weather + delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {mood && (
                      <span style={{ fontSize: 13, background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-full)', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-text-2)', fontWeight: 'var(--fw-medium)' }}>
                        <span style={{ fontSize: 14 }}>{mood.emoji}</span>{mood.label}
                      </span>
                    )}
                    {weather && (
                      <span style={{ fontSize: 13, background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-full)', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-text-2)', fontWeight: 'var(--fw-medium)' }}>
                        <span style={{ fontSize: 14 }}>{weather.emoji}</span>{weather.label}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(d.id) }}
                    style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', flexShrink: 0, transition: 'background var(--t-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  </button>
                </div>

                <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)', marginBottom: 6 }}>
                  {d.title}
                </p>
                <p style={{
                  fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', lineHeight: 1.65,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {d.content}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 12 }}>
                  {timestampToStr(d.createdAt)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {deleteTarget && (
        <Modal title="일기를 삭제할까요?" onClose={() => setDeleteTarget(null)} confirmLabel="삭제" onConfirm={handleDelete} danger>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>삭제된 일기는 복구할 수 없습니다.</p>
        </Modal>
      )}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
