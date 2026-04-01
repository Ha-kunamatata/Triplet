import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTrip, getSchedules, deleteTrip, deleteSchedule } from '../firebase/firestore'
import { generateDateRange, formatDisplayDate } from '../utils/dateUtils'
import PageHeader from '../components/layout/PageHeader'
import DayTab from '../components/schedule/DayTab'
import ScheduleItem from '../components/schedule/ScheduleItem'
import LoadingSpinner from '../components/common/LoadingSpinner'
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
  const [activeTab, setActiveTab] = useState('schedule') // 'schedule' | 'diary'

  useEffect(() => {
    Promise.all([getTrip(tripId), getSchedules(tripId)])
      .then(([t, s]) => {
        setTrip(t)
        setSchedules(s)
        if (t) setSelectedDate(t.startDate)
      })
      .finally(() => setLoading(false))
  }, [tripId])

  if (loading) return <LoadingSpinner fullScreen />
  if (!trip) return <div style={{ padding: 32, textAlign: 'center' }}>여행을 찾을 수 없습니다.</div>

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
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 80 }}>
      <PageHeader
        title={trip.title}
        subtitle={trip.destination}
        actions={
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => navigate(`/trips/${tripId}/diary`)} style={{ padding: '6px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', background: '#fff' }}>
              일기
            </button>
            <button onClick={() => setShowDeleteModal(true)} style={{ padding: 6, color: 'var(--text-disabled)', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>more_vert</span>
            </button>
          </div>
        }
      />

      {/* 여행 요약 카드 */}
      <div style={{ margin: '12px 16px', background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <StatItem icon="calendar_today" label="기간" value={`${dates.length}일`} />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StatItem icon="checklist" label="총 일정" value={`${schedules.length}개`} />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StatItem icon="payments" label="총 예산" value={totalCost > 0 ? `${totalCost.toLocaleString('ko-KR')}원` : '-'} />
      </div>

      {/* Day 탭 */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 12px', gap: 4 }}>
          {dates.map((date, i) => (
            <DayTab
              key={date}
              date={date}
              dayNumber={i + 1}
              isSelected={selectedDate === date}
              count={schedules.filter(s => s.date === date).length}
              onClick={() => setSelectedDate(date)}
            />
          ))}
        </div>
      </div>

      {/* 선택된 날짜 */}
      {selectedDate && (
        <div style={{ padding: '12px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {formatDisplayDate(selectedDate)}
          </p>
          <button
            onClick={() => navigate(`/trips/${tripId}/schedule/add`, { state: { date: selectedDate } })}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            일정 추가
          </button>
        </div>
      )}

      {/* 일정 목록 */}
      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              key={s.id}
              schedule={s}
              onEdit={() => navigate(`/trips/${tripId}/schedule/${s.id}/edit`)}
              onDelete={() => handleDeleteSchedule(s.id)}
            />
          ))
        )}
      </div>

      {/* 삭제 모달 */}
      {showDeleteModal && (
        <Modal
          title="여행을 삭제할까요?"
          onClose={() => setShowDeleteModal(false)}
          confirmLabel="삭제"
          onConfirm={handleDeleteTrip}
          danger
        >
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            '{trip.title}' 여행과 모든 일정, 일기가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
        </Modal>
      )}

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}

function StatItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700 }}>{value}</span>
    </div>
  )
}
