import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTrip, getSchedules, deleteTrip, deleteSchedule } from '../firebase/firestore'
import { generateDateRange, formatDisplayDate, formatShortDate, getDDay, calcTripStatus } from '../utils/dateUtils'
import DayTab from '../components/schedule/DayTab'
import { ScheduleSkeleton } from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import Toast from '../components/common/Toast'
import { SCHEDULE_CATEGORIES, TRIP_STATUS } from '../constants'

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
    // Use allSettled so a failed schedules query doesn't hide the trip
    Promise.allSettled([getTrip(tripId), getSchedules(tripId)])
      .then(([tripRes, schRes]) => {
        const t = tripRes.status === 'fulfilled' ? tripRes.value : null
        const s = schRes.status === 'fulfilled' ? schRes.value : []
        setTrip(t)
        setSchedules(s)
        if (t) setSelectedDate(t.startDate)
      })
      .finally(() => setLoading(false))
  }, [tripId])

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)' }}>
      <div style={{ height: 260, background: 'linear-gradient(135deg, #93C5FD, #3B82F6)' }} />
      <div style={{ padding: '16px' }}><ScheduleSkeleton /></div>
    </div>
  )

  if (!trip) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <span style={{ fontSize: 48 }}>😕</span>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--c-text-2)' }}>여행을 찾을 수 없습니다.</p>
      <button onClick={() => navigate('/')} style={{ padding: '10px 24px', background: 'var(--c-primary)', color: '#fff', borderRadius: 'var(--r-full)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)' }}>
        홈으로 돌아가기
      </button>
    </div>
  )

  const dates = generateDateRange(trip.startDate, trip.endDate)
  const daySchedules = schedules.filter(s => s.date === selectedDate)
  const totalCost = schedules.reduce((sum, s) => sum + (Number(s.cost) || 0), 0)
  const status = calcTripStatus(trip.startDate, trip.endDate)
  const statusInfo = TRIP_STATUS[status]
  const [bg1, bg2] = getCoverGradient(trip.emoji)

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
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', paddingBottom: 100 }}>

      {/* ── Hero section ── */}
      <div style={{
        height: 270,
        background: `linear-gradient(160deg, ${bg1} 0%, ${bg2} 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

        {/* Large ghost emoji */}
        <div style={{
          position: 'absolute', top: '45%', left: '50%',
          transform: 'translate(-50%, -55%)',
          fontSize: 120, opacity: 0.18, filter: 'blur(2px)',
          userSelect: 'none', pointerEvents: 'none',
        }}>
          {trip.emoji || '✈️'}
        </div>

        {/* Floating action bar */}
        <div style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', padding: '0 16px',
          zIndex: 10,
        }}>
          <button onClick={() => navigate(-1)} style={floatBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate(`/trips/${tripId}/diary`)}
              style={{ ...floatBtn, padding: '0 14px', width: 'auto', fontSize: 13, fontWeight: 600, gap: 5, display: 'flex', alignItems: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>book</span>일기
            </button>
            <button onClick={() => setShowDeleteModal(true)} style={floatBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
            </button>
          </div>
        </div>

        {/* Trip info overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 100%)',
          padding: '40px 20px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>
                {trip.destination}
              </p>
              <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {trip.title}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 12, marginTop: 6, display: 'flex', gap: 10 }}>
                <span>📅 {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}</span>
                <span>· {dates.length}일</span>
              </p>
            </div>
            <div style={{ flexShrink: 0, marginLeft: 12 }}>
              <span style={{
                display: 'block', textAlign: 'center',
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.30)',
                color: '#fff', padding: '5px 14px',
                borderRadius: 'var(--r-full)',
                fontSize: 13, fontWeight: 700,
              }}>
                {status === 'upcoming' ? getDDay(trip.startDate) : statusInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        background: 'var(--c-surface)', margin: '0',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderBottom: '1px solid var(--c-border)',
      }}>
        <StatItem icon="calendar_today" label="기간" value={`${dates.length}일`} color="var(--c-primary)" />
        <StatItem icon="checklist" label="총 일정" value={`${schedules.length}개`} color="#A78BFA" divider />
        <StatItem icon="payments" label="총 예산" value={totalCost > 0 ? formatCost(totalCost) : '미입력'} color="#F97316" divider />
      </div>

      {/* ── Day tabs ── */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '8px 8px', gap: 2, scrollbarWidth: 'none' }}>
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

      {/* ── Date header ── */}
      {selectedDate && (
        <div style={{ padding: '14px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)' }}>
            {formatDisplayDate(selectedDate)}
          </p>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)' }}>
            {daySchedules.length > 0 && `${daySchedules.length}개 일정`}
          </span>
        </div>
      )}

      {/* ── Timeline schedule list ── */}
      <div style={{ padding: '8px 16px 16px' }}>
        {daySchedules.length === 0 ? (
          <EmptyState
            icon="event_note"
            title="이 날의 일정이 없어요"
            description="+ 버튼을 눌러 일정을 추가해보세요"
          />
        ) : (
          <div style={{ paddingLeft: 4 }}>
            {daySchedules.map((s, idx) => (
              <TimelineItem
                key={s.id}
                schedule={s}
                isLast={idx === daySchedules.length - 1}
                onEdit={() => navigate(`/trips/${tripId}/schedule/${s.id}/edit`)}
                onDelete={() => handleDeleteSchedule(s.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Floating add button ── */}
      <button
        onClick={() => navigate(`/trips/${tripId}/schedule/add`, { state: { date: selectedDate } })}
        style={{
          position: 'fixed',
          bottom: `calc(env(safe-area-inset-bottom, 0px) + 88px)`,
          right: 20,
          width: 56, height: 56,
          borderRadius: '50%',
          background: 'var(--c-primary)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(59,130,246,0.45)',
          zIndex: 50,
          transition: 'transform var(--t-fast), box-shadow var(--t-fast)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(59,130,246,0.55)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.45)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add</span>
      </button>

      {/* ── Modals ── */}
      {showDeleteModal && (
        <Modal title="여행을 삭제할까요?" onClose={() => setShowDeleteModal(false)} confirmLabel="삭제" onConfirm={handleDeleteTrip} danger>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', lineHeight: 1.7 }}>
            <strong>'{trip.title}'</strong> 여행과 모든 일정, 일기가 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.
          </p>
        </Modal>
      )}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}

/* ── Timeline Item Component ── */
function TimelineItem({ schedule, isLast, onEdit, onDelete }) {
  const cat = SCHEDULE_CATEGORIES.find(c => c.key === schedule.category) ?? SCHEDULE_CATEGORIES.at(-1)

  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
      {/* Time column */}
      <div style={{ width: 52, flexShrink: 0, textAlign: 'right', paddingRight: 12, paddingTop: 14 }}>
        {schedule.startTime && (
          <p style={{ fontSize: 12, color: 'var(--c-text-2)', fontWeight: 700, lineHeight: 1 }}>{schedule.startTime}</p>
        )}
        {schedule.endTime && (
          <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 3 }}>{schedule.endTime}</p>
        )}
        {!schedule.startTime && (
          <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>-</p>
        )}
      </div>

      {/* Timeline connector */}
      <div style={{ width: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 13, height: 13, borderRadius: '50%', flexShrink: 0, marginTop: 14,
          background: cat.color,
          boxShadow: `0 0 0 3px ${cat.color}30, 0 0 0 6px ${cat.color}12`,
          zIndex: 1,
        }} />
        {!isLast && (
          <div style={{
            flex: 1, width: 2, minHeight: 20, marginTop: 3,
            background: `linear-gradient(to bottom, ${cat.color}50, var(--c-border))`,
          }} />
        )}
      </div>

      {/* Content card */}
      <div style={{ flex: 1, paddingLeft: 10, paddingBottom: isLast ? 4 : 16 }}>
        <div style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--r-lg)',
          padding: '12px 14px',
          boxShadow: '0 2px 10px rgba(15,23,42,0.07)',
          border: `1px solid ${cat.color}25`,
        }}>
          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: cat.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
              </div>
              <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {schedule.title}
              </p>
            </div>
            <div style={{ display: 'flex', flexShrink: 0, marginLeft: 4 }}>
              <button onClick={onEdit} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', transition: 'background var(--t-fast), color var(--t-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-primary-light)'; e.currentTarget.style.color = 'var(--c-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
              </button>
              <button onClick={onDelete} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', transition: 'background var(--t-fast), color var(--t-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = 'var(--c-error)' }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
              </button>
            </div>
          </div>

          {/* Details */}
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
            {schedule.place && (
              <span style={{ fontSize: 12, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>
                {schedule.place}
              </span>
            )}
          </div>

          {schedule.memo && (
            <p style={{ fontSize: 12, color: 'var(--c-text-2)', marginTop: 7, lineHeight: 1.6, background: 'var(--c-surface2)', borderRadius: 8, padding: '6px 10px', borderLeft: `3px solid ${cat.color}60` }}>
              {schedule.memo}
            </p>
          )}

          {schedule.cost > 0 && (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: 'var(--c-primary)',
                background: 'var(--c-primary-light)',
                padding: '3px 12px', borderRadius: 'var(--r-full)',
              }}>
                {Number(schedule.cost).toLocaleString('ko-KR')}원
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Stat Item ── */
function StatItem({ icon, label, value, color, divider }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '14px 8px', gap: 3,
      borderLeft: divider ? '1px solid var(--c-border)' : 'none',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <span style={{ fontSize: 18, fontWeight: 'var(--fw-extrabold)', color: 'var(--c-text-1)', lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{label}</span>
    </div>
  )
}

/* ── Helpers ── */
const floatBtn = {
  width: 38, height: 38, borderRadius: '50%',
  background: 'rgba(0,0,0,0.32)',
  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.20)',
  color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background var(--t-fast)',
  cursor: 'pointer',
}

function getCoverGradient(emoji) {
  const map = {
    '✈️': ['#60A5FA', '#2563EB'], '🗺️': ['#34D399', '#059669'],
    '🏖️': ['#FBBF24', '#F97316'], '🏔️': ['#6EE7B7', '#10B981'],
    '🌆': ['#A78BFA', '#7C3AED'], '🌸': ['#F9A8D4', '#EC4899'],
    '🍜': ['#FCD34D', '#D97706'], '🎡': ['#67E8F9', '#0891B2'],
    '🏰': ['#D4A574', '#92400E'], '🌅': ['#FCA5A5', '#EF4444'],
    '🎭': ['#C4B5FD', '#8B5CF6'], '🚂': ['#94A3B8', '#475569'],
  }
  return map[emoji] ?? ['#93C5FD', '#3B82F6']
}

function formatCost(n) {
  if (n >= 10000) return `${Math.round(n / 1000).toLocaleString('ko-KR')}천원`
  return `${n.toLocaleString('ko-KR')}원`
}
