import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTrip, getSchedules, deleteTrip, deleteSchedule } from '../firebase/firestore'
import { generateDateRange, formatDisplayDate, formatShortDate, getDDay, calcTripStatus } from '../utils/dateUtils'
import DayTab from '../components/schedule/DayTab'
import TripMap from '../components/maps/TripMap'
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
  const [viewMode, setViewMode] = useState('timeline') // 'timeline' | 'map'
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    Promise.allSettled([getTrip(tripId), getSchedules(tripId)])
      .then(([tRes, sRes]) => {
        const t = tRes.status === 'fulfilled' ? tRes.value : null
        const s = sRes.status === 'fulfilled' ? sRes.value : []
        setTrip(t)
        setSchedules(s)
        if (t) setSelectedDate(t.startDate)
      })
      .finally(() => setLoading(false))
  }, [tripId])

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)' }}>
      <div style={{ height: 270, background: 'linear-gradient(135deg,#93C5FD,#3B82F6)' }} />
      <div style={{ padding: '16px' }}><ScheduleSkeleton /></div>
    </div>
  )

  if (!trip) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
      <span style={{ fontSize: 56 }}>😕</span>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--c-text-2)', fontWeight: 600 }}>여행을 찾을 수 없습니다</p>
      <button onClick={() => navigate('/')} style={{ padding: '11px 24px', background: 'var(--c-primary)', color: '#fff', borderRadius: 'var(--r-full)', fontWeight: 700, boxShadow: 'var(--shadow-primary)' }}>
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

  async function handleDeleteSchedule(id) {
    await deleteSchedule(id)
    setSchedules(prev => prev.filter(s => s.id !== id))
    setToast({ message: '일정이 삭제되었습니다.' })
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', paddingBottom: 100 }}>

      {/* ══ Hero ══ */}
      <div style={{ height: 270, background: `linear-gradient(160deg,${bg1},${bg2})`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-55%)', fontSize: 120, opacity: 0.18, filter: 'blur(2px)', userSelect: 'none', pointerEvents: 'none' }}>
          {trip.emoji || '✈️'}
        </div>

        {/* Floating nav */}
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 14px)', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 16px', zIndex: 10 }}>
          <button onClick={() => navigate(-1)} style={floatBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate(`/trips/${tripId}/diary`)} style={{ ...floatBtn, width: 'auto', padding: '0 14px', fontSize: 13, fontWeight: 600, gap: 5, display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>book</span>일기
            </button>
            <button onClick={() => setShowDeleteModal(true)} style={floatBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
            </button>
          </div>
        </div>

        {/* Trip info overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.62),transparent)', padding: '44px 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>{trip.destination}
              </p>
              <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 12, marginTop: 6, display: 'flex', gap: 10 }}>
                <span>📅 {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}</span>
                <span>· {dates.length}일</span>
              </p>
            </div>
            <span style={{ flexShrink: 0, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '5px 14px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700 }}>
              {status === 'upcoming' ? getDDay(trip.startDate) : statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* ══ Stats ══ */}
      <div style={{ background: 'var(--c-surface)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid var(--c-border)' }}>
        <StatItem icon="calendar_today" label="기간" value={`${dates.length}일`} color="var(--c-primary)" />
        <StatItem icon="checklist" label="일정" value={`${schedules.length}개`} color="#A78BFA" divider />
        <StatItem icon="payments" label="예산" value={totalCost > 0 ? fmtCost(totalCost) : '-'} color="#F97316" divider />
      </div>

      {/* ══ Day tabs (sticky) ══ */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '8px 8px', gap: 2, scrollbarWidth: 'none' }}>
          {dates.map((date, i) => (
            <DayTab key={date} date={date} dayNumber={i + 1}
              isSelected={selectedDate === date}
              count={schedules.filter(s => s.date === date).length}
              onClick={() => setSelectedDate(date)}
            />
          ))}
        </div>

        {/* Timeline / Map toggle */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--c-border)', padding: '0 20px' }}>
          <ViewTab label="일정" icon="view_timeline" active={viewMode === 'timeline'} onClick={() => setViewMode('timeline')} />
          <ViewTab label="지도" icon="map" active={viewMode === 'map'} onClick={() => setViewMode('map')} />
        </div>
      </div>

      {/* ══ Content ══ */}
      {viewMode === 'timeline' ? (
        <>
          {/* Day header */}
          {selectedDate && (
            <div style={{ padding: '14px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)' }}>{formatDisplayDate(selectedDate)}</p>
                {daySchedules.length > 0 && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 2 }}>
                    일정 {daySchedules.length}개
                    {daySchedules.some(s => s.cost > 0) && ` · ${fmtCost(daySchedules.reduce((sum, s) => sum + (Number(s.cost) || 0), 0))}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div style={{ padding: '4px 14px 16px' }}>
            {daySchedules.length === 0 ? (
              <EmptyState icon="event_note" title="이 날의 일정이 없어요" description="+ 버튼으로 일정을 추가해보세요" />
            ) : (
              daySchedules.map((s, idx) => (
                <TimelineItem
                  key={s.id} schedule={s} isLast={idx === daySchedules.length - 1}
                  onEdit={() => navigate(`/trips/${tripId}/schedule/${s.id}/edit`)}
                  onDelete={() => handleDeleteSchedule(s.id)}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Map view */}
          <TripMap schedules={daySchedules} height={380} />

          {/* Schedule chip list below map */}
          {daySchedules.length > 0 && (
            <div style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }}>
              <p style={{ padding: '12px 16px 4px', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-3)' }}>
                {formatDisplayDate(selectedDate)} · {daySchedules.length}개 일정
              </p>
              <div style={{ display: 'flex', gap: 8, padding: '6px 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {daySchedules.map((s, idx) => {
                  const cat = SCHEDULE_CATEGORIES.find(c => c.key === s.category) ?? SCHEDULE_CATEGORIES.at(-1)
                  return (
                    <div key={s.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--c-surface2)', border: `1.5px solid ${cat.color}30`, borderRadius: 'var(--r-xl)', padding: '8px 14px', cursor: 'pointer', transition: 'all var(--t-fast)' }}
                      onClick={() => navigate(`/trips/${tripId}/schedule/${s.id}/edit`)}
                    >
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: cat.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)', whiteSpace: 'nowrap' }}>{s.title}</p>
                        {s.startTime && <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{s.startTime}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {daySchedules.length === 0 && (
            <EmptyState icon="event_note" title="이 날의 일정이 없어요" description="+ 버튼으로 일정을 추가해보세요" />
          )}
        </>
      )}

      {/* ══ FAB ══ */}
      <button
        onClick={() => navigate(`/trips/${tripId}/schedule/add`, { state: { date: selectedDate } })}
        style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom,0px) + 88px)', right: 20, width: 56, height: 56, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(59,130,246,0.45)', zIndex: 50, transition: 'transform var(--t-fast),box-shadow var(--t-fast)' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(59,130,246,0.55)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.45)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add</span>
      </button>

      {/* ══ Modals ══ */}
      {showDeleteModal && (
        <Modal title="여행을 삭제할까요?" onClose={() => setShowDeleteModal(false)} confirmLabel="삭제" onConfirm={async () => { await deleteTrip(tripId); navigate('/', { replace: true }) }} danger>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', lineHeight: 1.7 }}>
            <strong>'{trip.title}'</strong> 여행과 모든 일정, 일기가 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.
          </p>
        </Modal>
      )}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}

/* ── Sub-components ── */

function ViewTab({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '10px 0', marginRight: 24,
      fontSize: 'var(--text-sm)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
      color: active ? 'var(--c-primary)' : 'var(--c-text-3)',
      borderBottom: active ? '2.5px solid var(--c-primary)' : '2.5px solid transparent',
      background: 'none', transition: 'all var(--t-fast)',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 17, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
      {label}
    </button>
  )
}

function TimelineItem({ schedule, isLast, onEdit, onDelete }) {
  const cat = SCHEDULE_CATEGORIES.find(c => c.key === schedule.category) ?? SCHEDULE_CATEGORIES.at(-1)
  return (
    <div style={{ display: 'flex' }}>
      {/* Time column */}
      <div style={{ width: 54, flexShrink: 0, textAlign: 'right', paddingRight: 12, paddingTop: 15 }}>
        {schedule.startTime
          ? <><p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-2)', lineHeight: 1 }}>{schedule.startTime}</p>{schedule.endTime && <p style={{ fontSize: 10, color: 'var(--c-text-3)', marginTop: 3 }}>{schedule.endTime}</p>}</>
          : <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>-</p>
        }
      </div>

      {/* Connector */}
      <div style={{ width: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 13, height: 13, borderRadius: '50%', background: cat.color, marginTop: 14, flexShrink: 0, boxShadow: `0 0 0 3px ${cat.color}30,0 0 0 6px ${cat.color}10`, zIndex: 1 }} />
        {!isLast && <div style={{ flex: 1, width: 2, minHeight: 20, marginTop: 3, background: `linear-gradient(to bottom,${cat.color}50,var(--c-border))` }} />}
      </div>

      {/* Card */}
      <div style={{ flex: 1, paddingLeft: 10, paddingBottom: isLast ? 6 : 18 }}>
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', padding: '12px 14px', boxShadow: '0 2px 12px rgba(15,23,42,0.07)', border: `1px solid ${cat.color}20` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
              </div>
              <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{schedule.title}</p>
            </div>
            <div style={{ display: 'flex', flexShrink: 0 }}>
              {[['edit','편집',false],['delete','삭제',true]].map(([icon, title, danger]) => (
                <button key={icon} title={title}
                  onClick={icon === 'edit' ? onEdit : onDelete}
                  style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', transition: 'all var(--t-fast)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = danger ? '#FEF2F2' : 'var(--c-primary-light)'; e.currentTarget.style.color = danger ? 'var(--c-error)' : 'var(--c-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
            {schedule.place && (
              <span style={{ fontSize: 12, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>{schedule.place}
              </span>
            )}
            {schedule.placeAddress && (
              <span style={{ fontSize: 11, color: 'var(--c-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                {schedule.placeAddress}
              </span>
            )}
          </div>

          {schedule.memo && (
            <div style={{ marginTop: 8, background: 'var(--c-surface2)', borderRadius: 8, padding: '7px 10px', borderLeft: `3px solid ${cat.color}60` }}>
              <p style={{ fontSize: 12, color: 'var(--c-text-2)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{schedule.memo}</p>
            </div>
          )}

          {schedule.cost > 0 && (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', background: 'var(--c-primary-light)', padding: '3px 12px', borderRadius: 'var(--r-full)' }}>
                {Number(schedule.cost).toLocaleString('ko-KR')}원
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatItem({ icon, label, value, color, divider }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 8px', gap: 3, borderLeft: divider ? '1px solid var(--c-border)' : 'none' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--c-text-1)', lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{label}</span>
    </div>
  )
}

const floatBtn = { width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.20)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background var(--t-fast)' }

function getCoverGradient(emoji) {
  const m = { '✈️':['#60A5FA','#2563EB'],'🗺️':['#34D399','#059669'],'🏖️':['#FBBF24','#F97316'],'🏔️':['#6EE7B7','#10B981'],'🌆':['#A78BFA','#7C3AED'],'🌸':['#F9A8D4','#EC4899'],'🍜':['#FCD34D','#D97706'],'🎡':['#67E8F9','#0891B2'],'🏰':['#D4A574','#92400E'],'🌅':['#FCA5A5','#EF4444'],'🎭':['#C4B5FD','#8B5CF6'],'🚂':['#94A3B8','#475569'] }
  return m[emoji] ?? ['#93C5FD','#3B82F6']
}

function fmtCost(n) {
  if (n >= 100000) return `${Math.round(n / 10000)}만원`
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만원`
  return `${n.toLocaleString('ko-KR')}원`
}
