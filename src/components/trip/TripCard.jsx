import { useNavigate } from 'react-router-dom'
import { calcTripStatus, getDDay, getTripDuration, formatShortDate } from '../../utils/dateUtils'
import { TRIP_STATUS, TRIP_STYLES } from '../../constants'

const COVER_GRADIENTS = {
  '✈️':['#60A5FA','#2563EB'],'🗺️':['#34D399','#059669'],'🏖️':['#FBBF24','#F97316'],
  '🏔️':['#6EE7B7','#10B981'],'🌆':['#A78BFA','#7C3AED'],'🌸':['#F9A8D4','#EC4899'],
  '🍜':['#FCD34D','#D97706'],'🎡':['#67E8F9','#0891B2'],'🏰':['#D4A574','#92400E'],
  '🌅':['#FCA5A5','#EF4444'],'🎭':['#C4B5FD','#8B5CF6'],'🚂':['#94A3B8','#475569'],
}

export default function TripCard({ trip }) {
  const navigate = useNavigate()
  const status = calcTripStatus(trip.startDate, trip.endDate)
  const statusInfo = TRIP_STATUS[status]
  const duration = getTripDuration(trip.startDate, trip.endDate)
  const [bg1, bg2] = COVER_GRADIENTS[trip.emoji] ?? ['#93C5FD', '#3B82F6']
  const style = TRIP_STYLES.find(s => s.key === trip.travelStyle)
  const isOngoing = status === 'ongoing'

  return (
    <div
      onClick={() => navigate(`/trips/${trip.id}`)}
      className="toss-btn"
      style={{
        borderRadius: 'var(--r-2xl)', overflow: 'hidden', cursor: 'pointer',
        background: 'var(--c-surface)',
        boxShadow: isOngoing ? '0 8px 28px rgba(59,130,246,0.18)' : 'var(--shadow-sm)',
        border: isOngoing ? '1.5px solid rgba(59,130,246,0.25)' : '1px solid var(--c-border)',
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isOngoing ? '0 8px 28px rgba(59,130,246,0.18)' : 'var(--shadow-sm)' }}
    >
      {/* ── Cover ── */}
      <div style={{ height: 148, position: 'relative', overflow: 'hidden', background: `linear-gradient(145deg, ${bg1}, ${bg2})` }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.09)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -10, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-52%)', fontSize: 88, opacity: 0.22, filter: 'blur(1px)', userSelect: 'none', pointerEvents: 'none' }}>
          {trip.emoji || '✈️'}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, background: 'linear-gradient(to top, rgba(0,0,0,0.52), transparent)' }} />

        {/* 여행지 */}
        <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>location_on</span>
            {trip.destination}
          </p>
          {style && (
            <span style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 600 }}>
              {style.label}
            </span>
          )}
        </div>

        {/* 상태 뱃지 */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          {isOngoing && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 11px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', animation: 'lp 1.5s ease-in-out infinite' }} />
              여행 중
            </span>
          )}
          {status === 'upcoming' && (
            <span style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 12px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 800 }}>
              {getDDay(trip.startDate)}
            </span>
          )}
          {status === 'completed' && (
            <span style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 'var(--r-full)', fontSize: 11 }}>
              완료
            </span>
          )}
        </div>
      </div>

      {/* ── Info — Toss 스타일 ── */}
      <div style={{ padding: '13px 16px 15px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6, letterSpacing: -0.3 }}>
          {trip.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>calendar_today</span>
            {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}
            <span style={{ color: 'var(--c-border2)', margin: '0 2px' }}>·</span>
            <b style={{ color: 'var(--c-text-2)', fontWeight: 700 }}>{duration}일</b>
          </span>
          <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '3px 9px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700 }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <style>{`@keyframes lp{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.5)}70%{box-shadow:0 0 0 5px rgba(74,222,128,0)}}`}</style>
    </div>
  )
}
