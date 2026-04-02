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

  return (
    <div
      onClick={() => navigate(`/trips/${trip.id}`)}
      style={{
        borderRadius: 'var(--r-2xl)', overflow: 'hidden', cursor: 'pointer',
        background: 'var(--c-surface)', boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--c-border)',
        transition: 'transform var(--t-base), box-shadow var(--t-base)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onTouchEnd={e => e.currentTarget.style.transform = ''}
    >
      {/* ── Cover ── */}
      <div style={{
        height: 160, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(145deg, ${bg1}, ${bg2})`,
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

        {/* Big ghost emoji */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 96, opacity: 0.25, filter: 'blur(1px)', userSelect: 'none', pointerEvents: 'none' }}>
          {trip.emoji || '✈️'}
        </div>

        {/* Bottom gradient overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />

        {/* Destination */}
        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>
            {trip.destination}
          </p>
        </div>

        {/* Top badges */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
          {status === 'ongoing' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 11px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 700 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 0 2px rgba(74,222,128,0.4)', animation: 'lp 1.5s ease-in-out infinite' }} />
              여행 중
            </span>
          )}
          {status === 'upcoming' && (
            <span style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 12px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 700 }}>
              {getDDay(trip.startDate)}
            </span>
          )}
          {status === 'completed' && (
            <span style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.75)', padding: '4px 12px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600 }}>
              완료
            </span>
          )}
        </div>

        {/* Style badge top-left */}
        {style && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 10px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>{style.icon}</span>
            {style.label}
          </div>
        )}
      </div>

      {/* ── Info ── */}
      <div style={{ padding: '14px 16px 16px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
          {trip.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>calendar_today</span>
            {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)} · {duration}일
          </span>
          <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700 }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <style>{`@keyframes lp{0%,100%{box-shadow:0 0 0 2px rgba(74,222,128,0.4)}50%{box-shadow:0 0 0 5px rgba(74,222,128,0.1)}}`}</style>
    </div>
  )
}
