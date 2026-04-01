import { useNavigate } from 'react-router-dom'
import { calcTripStatus, getDDay, getTripDuration, formatShortDate } from '../../utils/dateUtils'
import { TRIP_STATUS } from '../../constants'

export default function TripCard({ trip }) {
  const navigate = useNavigate()
  const status = calcTripStatus(trip.startDate, trip.endDate)
  const statusInfo = TRIP_STATUS[status]
  const duration = getTripDuration(trip.startDate, trip.endDate)

  return (
    <div
      onClick={() => navigate(`/trips/${trip.id}`)}
      style={{
        background: '#fff', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onTouchEnd={e => e.currentTarget.style.transform = ''}
    >
      {/* 커버 영역 */}
      <div style={{
        height: 130, background: `linear-gradient(135deg, ${getCoverColor(trip.emoji)} 0%, ${getCoverColor(trip.emoji, true)} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64,
        position: 'relative',
      }}>
        {trip.emoji || '✈️'}
        {/* D-Day 뱃지 */}
        {status === 'upcoming' && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.35)', color: '#fff',
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            fontSize: 13, fontWeight: 700,
          }}>
            {getDDay(trip.startDate)}
          </span>
        )}
      </div>

      {/* 정보 영역 */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3 }}>{trip.destination}</p>
            <p style={{ fontSize: 17, fontWeight: 700 }}>{trip.title}</p>
          </div>
          <span style={{
            background: statusInfo.bg, color: statusInfo.color,
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8,
          }}>
            {statusInfo.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>calendar_today</span>
            {formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>
            {duration}일
          </span>
        </div>
      </div>
    </div>
  )
}

function getCoverColor(emoji, dark = false) {
  const map = {
    '✈️': dark ? '#3B7DD8' : '#6AACF0',
    '🏖️': dark ? '#E8873A' : '#F5B574',
    '🏔️': dark ? '#5B8A6C' : '#8DC4A0',
    '🌆': dark ? '#7B5EA7' : '#B08ADB',
    '🌸': dark ? '#D4607A' : '#F0A0B8',
    '🍜': dark ? '#C47A2A' : '#E8B060',
    '🎡': dark ? '#4A90C4' : '#7EC0E8',
    '🏰': dark ? '#8A7050' : '#C0A880',
  }
  return map[emoji] ?? (dark ? '#4A90E2' : '#7AB8F5')
}
