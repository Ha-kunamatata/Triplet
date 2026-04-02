import { useNavigate } from 'react-router-dom'
import { calcTripStatus, getDDay, getTripDuration, formatShortDate } from '../../utils/dateUtils'
import { TRIP_STATUS } from '../../constants'

export default function TripCard({ trip }) {
  const navigate = useNavigate()
  const status = calcTripStatus(trip.startDate, trip.endDate)
  const statusInfo = TRIP_STATUS[status]
  const duration = getTripDuration(trip.startDate, trip.endDate)
  const [bg1, bg2] = getCoverGradient(trip.emoji)

  return (
    <div
      onClick={() => navigate(`/trips/${trip.id}`)}
      className="card"
      style={{
        overflow: 'hidden', cursor: 'pointer',
        transition: 'transform var(--t-base) var(--ease), box-shadow var(--t-base) var(--ease)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.985)' }}
      onTouchEnd={e => { e.currentTarget.style.transform = '' }}
    >
      {/* Cover */}
      <div style={{
        height: 148,
        background: `linear-gradient(135deg, ${bg1} 0%, ${bg2} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 68, position: 'relative', overflow: 'hidden',
      }}>
        {/* subtle pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
        <span style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))', position: 'relative', zIndex: 1 }}>{trip.emoji || '✈️'}</span>

        {/* D-Day badge */}
        {status === 'upcoming' && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.42)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            color: '#fff', padding: '4px 12px',
            borderRadius: 'var(--r-full)',
            fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)',
            letterSpacing: 0.3,
          }}>
            {getDDay(trip.startDate)}
          </span>
        )}

        {/* Ongoing pulse */}
        {status === 'ongoing' && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(0,0,0,0.42)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            color: '#fff', padding: '4px 11px',
            borderRadius: 'var(--r-full)',
            fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', boxShadow: '0 0 0 2px rgba(74,222,128,0.4)', animation: 'livePulse 1.5s ease-in-out infinite' }} />
            여행 중
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', fontWeight: 'var(--fw-medium)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trip.destination}
            </p>
            <p style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trip.title}
            </p>
          </div>
          <span style={{
            background: statusInfo.bg, color: statusInfo.color,
            padding: '3px 10px', borderRadius: 'var(--r-full)',
            fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {statusInfo.label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 10, color: 'var(--c-text-3)', fontSize: 'var(--text-xs)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span>
            {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
            {duration}일
          </span>
        </div>
      </div>

      <style>{`@keyframes livePulse { 0%,100%{box-shadow:0 0 0 2px rgba(74,222,128,0.4)} 50%{box-shadow:0 0 0 5px rgba(74,222,128,0.1)} }`}</style>
    </div>
  )
}

function getCoverGradient(emoji) {
  const map = {
    '✈️': ['#60A5FA', '#3B82F6'],
    '🏖️': ['#FBBF24', '#F97316'],
    '🏔️': ['#6EE7B7', '#10B981'],
    '🌆': ['#A78BFA', '#7C3AED'],
    '🌸': ['#F9A8D4', '#EC4899'],
    '🍜': ['#FCD34D', '#D97706'],
    '🎡': ['#67E8F9', '#0891B2'],
    '🏰': ['#D4A574', '#92400E'],
    '🗼': ['#93C5FD', '#2563EB'],
    '🌴': ['#86EFAC', '#16A34A'],
    '🎎': ['#FCA5A5', '#DC2626'],
    '⛷️': ['#BAE6FD', '#0284C7'],
  }
  return map[emoji] ?? ['#93C5FD', '#3B82F6']
}
