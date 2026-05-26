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
  if (!trip) return null

  const navigate = useNavigate()
  const status = calcTripStatus(trip.startDate ?? '', trip.endDate ?? '')
  const statusInfo = TRIP_STATUS[status] ?? TRIP_STATUS.upcoming
  const duration = getTripDuration(trip.startDate, trip.endDate)
  const [bg1, bg2] = COVER_GRADIENTS[trip.emoji] ?? ['#93C5FD', '#3B82F6']
  const tripStyle = TRIP_STYLES?.find(s => s.key === trip.travelStyle)
  const isOngoing = status === 'ongoing'
  const isUpcoming = status === 'upcoming'

  return (
    <div
      onClick={() => navigate(`/trips/${trip.id}`)}
      className="toss-btn"
      style={{
        borderRadius: 'var(--r-2xl)', overflow: 'hidden', cursor: 'pointer',
        background: 'var(--c-surface)',
        boxShadow: isOngoing
          ? '0 6px 24px rgba(59,130,246,0.2), 0 2px 8px rgba(59,130,246,0.1)'
          : '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.07)',
        border: isOngoing ? '1.5px solid rgba(59,130,246,0.2)' : '1px solid var(--c-border)',
        transition: 'transform 0.22s var(--ease), box-shadow 0.22s var(--ease)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 36px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = isOngoing
          ? '0 6px 24px rgba(59,130,246,0.2), 0 2px 8px rgba(59,130,246,0.1)'
          : '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.07)'
      }}
    >
      {/* ── Cover ── */}
      <div style={{
        height: 195, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(145deg, ${bg1}, ${bg2})`,
      }}>
        {/* Decorative depth circles */}
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.09)' }} />
        <div style={{ position:'absolute', bottom:-25, left:-15, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        <div style={{ position:'absolute', top:20, left:-30, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

        {/* Large watermark emoji */}
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-56%)',
          fontSize:120, opacity:0.18, filter:'blur(2px)',
          userSelect:'none', pointerEvents:'none', lineHeight:1,
        }}>
          {trip.emoji || '✈️'}
        </div>

        {/* Bottom gradient overlay */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:120,
          background:'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)',
        }} />

        {/* Title + destination overlay (Triple style) */}
        <div style={{ position:'absolute', bottom:12, left:14, right:14 }}>
          <h3 style={{
            color:'#fff', fontSize:17, fontWeight:800,
            letterSpacing:-0.4, lineHeight:1.25,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            textShadow:'0 1px 6px rgba(0,0,0,0.3)', marginBottom:3,
          }}>
            {trip.title || '여행'}
          </h3>
          {trip.destination && (
            <p style={{ color:'rgba(255,255,255,0.82)', fontSize:12, fontWeight:500, display:'flex', alignItems:'center', gap:3 }}>
              <span className="material-symbols-outlined" style={{ fontSize:12, fontVariationSettings:"'FILL' 1" }}>location_on</span>
              {trip.destination}
            </p>
          )}
        </div>

        {/* Top: status badge + style badge */}
        <div style={{ position:'absolute', top:10, left:12, right:12, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            {isOngoing && (
              <span style={{
                display:'flex', alignItems:'center', gap:5,
                background:'rgba(0,0,0,0.48)', backdropFilter:'blur(8px)',
                color:'#fff', padding:'4px 10px', borderRadius:'var(--r-full)',
                fontSize:11, fontWeight:700,
              }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ADE80', animation:'lp 1.5s ease-in-out infinite' }} />
                여행 중
              </span>
            )}
            {isUpcoming && (
              <span style={{
                background:'rgba(0,0,0,0.48)', backdropFilter:'blur(8px)',
                color:'#fff', padding:'4px 10px', borderRadius:'var(--r-full)',
                fontSize:11, fontWeight:800,
              }}>
                {getDDay(trip.startDate)}
              </span>
            )}
            {status === 'completed' && (
              <span style={{
                background:'rgba(0,0,0,0.3)', backdropFilter:'blur(6px)',
                color:'rgba(255,255,255,0.75)', padding:'4px 10px',
                borderRadius:'var(--r-full)', fontSize:11, fontWeight:600,
              }}>
                완료
              </span>
            )}
          </div>
          {tripStyle && (
            <span style={{
              background:'rgba(0,0,0,0.35)', backdropFilter:'blur(6px)',
              color:'rgba(255,255,255,0.9)', padding:'3px 8px',
              borderRadius:'var(--r-full)', fontSize:10, fontWeight:600,
            }}>
              {tripStyle.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Info Bar ── */}
      <div style={{ padding:'10px 14px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, minWidth:0, flex:1 }}>
          <span className="material-symbols-outlined" style={{ fontSize:13, color:'var(--c-text-3)', flexShrink:0 }}>calendar_today</span>
          <span style={{ fontSize:12, color:'var(--c-text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}
          </span>
          <span style={{ color:'var(--c-border2)', fontSize:11, flexShrink:0 }}>·</span>
          <b style={{ color:'var(--c-text-2)', fontWeight:700, fontSize:12, flexShrink:0 }}>{duration}일</b>
        </div>
        <span style={{
          background:statusInfo.bg, color:statusInfo.color,
          padding:'3px 10px', borderRadius:'var(--r-full)',
          fontSize:11, fontWeight:700, flexShrink:0,
        }}>
          {statusInfo.label}
        </span>
      </div>

      <style>{`@keyframes lp{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.5)}70%{box-shadow:0 0 0 6px rgba(74,222,128,0)}}`}</style>
    </div>
  )
}
