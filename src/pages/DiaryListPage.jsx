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
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 32 }}>
      <PageHeader
        title="여행 일기"
        subtitle={trip?.title}
        actions={
          <button
            onClick={() => navigate(`/trips/${tripId}/diary/new`)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
          </button>
        }
      />

      {loading ? <LoadingSpinner /> : diaries.length === 0 ? (
        <EmptyState icon="book" title="아직 일기가 없어요" description="여행의 소중한 순간을 기록해보세요" action="첫 일기 쓰기" onAction={() => navigate(`/trips/${tripId}/diary/new`)} />
      ) : (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {diaries.map(d => {
            const mood = DIARY_MOODS.find(m => m.key === d.mood)
            const weather = DIARY_WEATHERS.find(w => w.key === d.weather)
            return (
              <div key={d.id} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}
                onClick={() => navigate(`/trips/${tripId}/diary/${d.id}/edit`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      {mood && <span style={{ fontSize: 18 }}>{mood.emoji}</span>}
                      {weather && <span style={{ fontSize: 18 }}>{weather.emoji}</span>}
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{d.title}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {d.content}
                    </p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(d.id) }} style={{ padding: 4, color: 'var(--text-disabled)', marginLeft: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 10 }}>{timestampToStr(d.createdAt)}</p>
              </div>
            )
          })}
        </div>
      )}

      {deleteTarget && (
        <Modal title="일기를 삭제할까요?" onClose={() => setDeleteTarget(null)} confirmLabel="삭제" onConfirm={handleDelete} danger>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>삭제된 일기는 복구할 수 없습니다.</p>
        </Modal>
      )}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}
