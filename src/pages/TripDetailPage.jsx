import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTrip, getSchedules, deleteTrip, deleteSchedule } from '../firebase/firestore'
import { generateDateRange, formatDisplayDate } from '../utils/dateUtils'
import PageHeader from '../components/layout/PageHeader'
import DayTab from '../components/schedule/DayTab'
import ScheduleItem from '../components/schedule/ScheduleItem'
import { ScheduleSkeleton } from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import Toast from '../components/common/Toast'

export default function TripDetailPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    Promise.all([getTrip(tripId), getSchedules(tripId)])
      .then(([t, s]) => {
        setTrip(t)
        setSchedules(s)
        if (t) setSelectedDate(t.startDate)
      })
      .finally(() => setLoading(false))
  }, [tripId])

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', paddingBottom: 80 }}>
      <div style={{ height: 56, background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }} />
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ScheduleSkeleton /><ScheduleSkeleton /><ScheduleSkeleton />
      </div>
    </div>
  )

  if (!trip) return (
    <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-text-2)' }}>여행을 찾을 수 없습니다.</div>
  )

  const dates = generateDateRange(trip.startDate, trip.endDate)
  const daySchedules = schedules.filter(s => s.date === selectedDate)
  const totalCost = schedules.reduce((sum, s) => sum + (Number(s.cost) || 0), 0)

  async function handleDeleteSchedule(scheduleId) {
    await deleteSchedule(scheduleId)
    setSchedules(prev => prev.filter(s => s.id !== scheduleId))
    setToast({ message: '일정이 삭제되었습니다.' })
  }

  async function handleDeleteTrip() {
    await deleteTrip(tripId)
    navigate('/', { replace: true })
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', paddingBottom: 80 }}>
      <PageHeader
        title={trip.title}
        subtitle={trip.destination}
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => navigate(`/trips/${tripId}/diary`)}
              style={{
                padding: '7px 14px', borderRadius: 'var(--r-full)',
                border: '1.5px solid var(--c-border)', background: 'var(--c-surface)',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
                color: 'var(--c-text-2)', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>book</span>
              일기
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{ width: 34, height: 34, borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', background: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
            </button>
          </div>
        }
      />

      {/* ── Stats card ── */}
      <div style={{ margin: '12px 16px', background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <StatItem icon="calendar_today" label="기간" value={`${dates.length}일`} />
          <StatItem icon="checklist" label="총 일정" value={`${schedules.length}개`} divider />
          <StatItem icon="payments" label="총 예산" value={totalCost > 0 ? `${(totalCost / 10000).toFixed(1)}만원` : '-'} divider />
        </div>
      </div>

      {/* ── Day tabs ── */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '8px 8px', gap: 4, scrollbarWidth: 'none' }}>
          {dates.map((date, i) => (
            <DayTab
              key={date} date={date} dayNumber={i + 1}
              isSelected={selectedDate === date}
              count={schedules.filter(s => s.date === date).length}
              onClick={() => setSelectedDate(date)}
            />
          ))}
        </div>
      </div>

      {/* ── Date header + Add button ── */}
      {selectedDate && (
        <div style={{ padding: '14px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-2)' }}>
            {formatDisplayDate(selectedDate)}
          </p>
          <button
            onClick={() => navigate(`/trips/${tripId}/schedule/add`, { state: { date: selectedDate } })}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', background: 'var(--c-primary)', color: '#fff',
              borderRadius: 'var(--r-full)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
              boxShadow: 'var(--shadow-primary)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
            일정 추가
          </button>
        </div>
      )}

      {/* ── Schedule list ── */}
      <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {daySchedules.length === 0 ? (
          <EmptyState
            icon="event_note"
            title="이 날의 일정이 없어요"
            description="일정을 추가해보세요"
            action="일정 추가"
            onAction={() => navigate(`/trips/${tripId}/schedule/add`, { state: { date: selectedDate } })}
          />
        ) : (
          daySchedules.map(s => (
            <ScheduleItem
              key={s.id} schedule={s}
              onEdit={() => navigate(`/trips/${tripId}/schedule/${s.id}/edit`)}
              onDelete={() => handleDeleteSchedule(s.id)}
            />
          ))
        )}
      </div>

      {/* ── Delete modal ── */}
      {showDeleteModal && (
        <Modal
          title="여행을 삭제할까요?"
          onClose={() => setShowDeleteModal(false)}
          confirmLabel="삭제"
          onConfirm={handleDeleteTrip}
          danger
        >
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', lineHeight: 1.7 }}>
            <strong>'{trip.title}'</strong> 여행과 모든 일정, 일기가 삭제됩니다.<br />
            이 작업은 되돌릴 수 없습니다.
          </p>
        </Modal>
      )}

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}

function StatItem({ icon, label, value, divider }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px 8px', gap: 4,
      borderLeft: divider ? '1px solid var(--c-border)' : 'none',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--c-primary)', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)' }}>{value}</span>
    </div>
  )
}
