import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTrips, getSharedTrips } from '../firebase/firestore'
import { calcTripStatus, getDDay, formatShortDate, getTripDuration } from '../utils/dateUtils'
import TripCard from '../components/trip/TripCard'
import { TripCardSkeleton } from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import { TRIP_STATUS } from '../constants'

const FILTERS = [
  { key: 'all',       label: '전체' },
  { key: 'upcoming',  label: '예정' },
  { key: 'ongoing',   label: '여행 중' },
  { key: 'completed', label: '완료' },
]

const COVER_GRADIENTS = {
  '✈️':['#60A5FA','#2563EB'],'🗺️':['#34D399','#059669'],'🏖️':['#FBBF24','#F97316'],
  '🏔️':['#6EE7B7','#10B981'],'🌆':['#A78BFA','#7C3AED'],'🌸':['#F9A8D4','#EC4899'],
  '🍜':['#FCD34D','#D97706'],'🎡':['#67E8F9','#0891B2'],'🏰':['#D4A574','#92400E'],
  '🌅':['#FCA5A5','#EF4444'],'🎭':['#C4B5FD','#8B5CF6'],'🚂':['#94A3B8','#475569'],
}
function getCoverGradient(emoji) {
  return COVER_GRADIENTS[emoji] ?? ['#93C5FD', '#3B82F6']
}
function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return '좋은 새벽이에요 🌙'
  if (h < 12) return '좋은 아침이에요 ☀️'
  if (h < 18) return '좋은 오후에요 🌤'
  return '좋은 저녁이에요 🌆'
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [sharedTrips, setSharedTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    Promise.allSettled([
      getTrips(user.uid),
      getSharedTrips(user.uid),
    ]).then(([ownResult, sharedResult]) => {
      if (ownResult.status === 'fulfilled') setTrips(ownResult.value ?? [])
      if (sharedResult.status === 'fulfilled') setSharedTrips(sharedResult.value ?? [])
    }).finally(() => setLoading(false))
  }, [user])

  const allTrips  = [...trips, ...sharedTrips]
  const ongoing   = allTrips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'ongoing')
  const upcoming  = allTrips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'upcoming')
  const completed = allTrips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'completed')
  const filtered  = filter === 'all'
    ? trips
    : trips.filter(t => calcTripStatus(t.startDate, t.endDate) === filter)

  const initial = (user?.displayName ?? user?.email ?? '?')[0]?.toUpperCase() ?? '?'

  return (
    <div className="page-enter" style={{ minHeight: '100%', paddingBottom: 8 }}>

      {/* ══ Header ══ */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>

        {/* Top row: greeting + actions */}
        <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--c-text-3)', fontWeight: 500, marginBottom: 3 }}>{getGreeting()}</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-text-1)', letterSpacing: -0.6, lineHeight: 1.2 }}>
              {user?.displayName?.split(' ')[0] ?? '여행자'}님의 여행
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => navigate('/trips/new')}
              className="toss-btn"
              style={{
                width: 44, height: 44, borderRadius: 'var(--r-xl)',
                background: 'var(--c-primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-primary)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>add</span>
            </button>
          </div>
        </div>

        {/* Stats row */}
        {!loading && trips.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid var(--c-border)' }}>
            {[
              { value: upcoming.length,  label: '예정',    color: 'var(--c-primary)' },
              { value: ongoing.length,   label: '여행 중', color: 'var(--c-success)' },
              { value: completed.length, label: '완료',    color: 'var(--c-text-3)' },
            ].map(({ value, label, color }, i) => (
              <div key={label} style={{ padding: '12px 0', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--c-border)' : 'none' }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: value > 0 ? color : 'var(--c-text-3)', letterSpacing: -1, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 500, marginTop: 3 }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 16px 12px', scrollbarWidth: 'none' }}>
          {FILTERS.map(f => {
            const count = f.key === 'all' ? trips.length
              : f.key === 'upcoming' ? upcoming.length
              : f.key === 'ongoing' ? ongoing.length
              : completed.length
            const active = filter === f.key
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '7px 14px', borderRadius: 'var(--r-full)', flexShrink: 0,
                background: active ? 'var(--c-primary)' : 'var(--c-surface2)',
                color: active ? '#fff' : 'var(--c-text-2)',
                border: `1px solid ${active ? 'transparent' : 'var(--c-border)'}`,
                fontSize: 13, fontWeight: active ? 700 : 500,
                boxShadow: active ? 'var(--shadow-primary)' : 'none',
                transition: 'all 0.15s var(--ease)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {f.label}
                {!loading && count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, lineHeight: '16px', padding: '0 5px',
                    borderRadius: 'var(--r-full)', minWidth: 16, textAlign: 'center',
                    background: active ? 'rgba(255,255,255,0.25)' : 'var(--c-border)',
                    color: active ? '#fff' : 'var(--c-text-3)',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ══ Ongoing hero ══ */}
      {!loading && ongoing.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <OngoingBanner trip={ongoing[0]} onClick={() => navigate(`/trips/${ongoing[0].id}`)} />
        </div>
      )}

      {/* ══ Next trip countdown ══ */}
      {!loading && ongoing.length === 0 && upcoming.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <NextTripCard trip={upcoming[0]} onClick={() => navigate(`/trips/${upcoming[0].id}`)} />
        </div>
      )}

      {/* ══ Trip list ══ */}
      <div style={{ padding: '16px 16px 0' }}>
        {/* Section header */}
        {(ongoing.length > 0 || upcoming.length > 0) && filter === 'all' && trips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-1)', letterSpacing: -0.3 }}>전체 여행</p>
            <p style={{ fontSize: 12, color: 'var(--c-text-3)', fontWeight: 500 }}>{trips.length}개</p>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TripCardSkeleton /><TripCardSkeleton /><TripCardSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="flight_takeoff"
            title={filter === 'all' ? '아직 여행이 없어요' : `${FILTERS.find(f => f.key === filter)?.label} 여행이 없어요`}
            description="새로운 여행을 계획해보세요!"
            action="첫 여행 만들기"
            onAction={() => navigate('/trips/new')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((t, idx) => (
              <div key={t.id} style={{ animation: `slideInUp 0.26s var(--ease) ${idx * 0.045}s both` }}>
                <TripCard trip={t} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ Shared trips ══ */}
      {!loading && sharedTrips.length > 0 && (
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#8B5CF6', fontVariationSettings: "'FILL' 1" }}>group</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-1)', letterSpacing: -0.3 }}>공유받은 여행</p>
            <span style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 700, background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>{sharedTrips.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sharedTrips.map((t, idx) => (
              <div key={t.id} style={{ position: 'relative', animation: `slideInUp 0.26s var(--ease) ${idx * 0.045}s both` }}>
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#8B5CF6', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--r-full)', zIndex: 2, letterSpacing: 0.2 }}>공유됨</div>
                <TripCard trip={t} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══ Ongoing Banner ══ */
function OngoingBanner({ trip, onClick }) {
  if (!trip) return null
  const [bg1, bg2] = getCoverGradient(trip.emoji)
  const duration = getTripDuration(trip.startDate, trip.endDate)

  return (
    <div
      onClick={onClick}
      className="toss-btn"
      style={{
        background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
        borderRadius: 'var(--r-2xl)', padding: '20px 20px 16px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        marginBottom: 4, boxShadow: '0 8px 28px rgba(59,130,246,0.28)',
      }}
    >
      <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
      <div style={{ position:'absolute', bottom:-20, left:-10, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#4ADE80', display:'inline-block', flexShrink:0, animation:'livePulse 1.5s ease-in-out infinite', boxShadow:'0 0 0 3px rgba(74,222,128,0.35)' }} />
            <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.92)' }}>지금 여행 중</span>
          </div>
          {trip.destination && (
            <p style={{ color:'rgba(255,255,255,0.72)', fontSize:12, marginBottom:3 }}>{trip.destination}</p>
          )}
          <h2 style={{ color:'#fff', fontSize:20, fontWeight:800, lineHeight:1.2, letterSpacing:-0.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{trip.title}</h2>
          <p style={{ color:'rgba(255,255,255,0.76)', fontSize:12, marginTop:6 }}>
            {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)} · {duration}일
          </p>
        </div>
        <div style={{ fontSize:52, lineHeight:1, filter:'drop-shadow(0 4px 10px rgba(0,0,0,0.22))', marginLeft:12, flexShrink:0 }}>
          {trip.emoji || '✈️'}
        </div>
      </div>

      <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:5, color:'rgba(255,255,255,0.88)', fontSize:13, fontWeight:700, position:'relative' }}>
        <span>일정 보기</span>
        <span className="material-symbols-outlined" style={{ fontSize:16 }}>arrow_forward</span>
      </div>
      <style>{`@keyframes livePulse{0%,100%{box-shadow:0 0 0 3px rgba(74,222,128,0.35)}50%{box-shadow:0 0 0 7px rgba(74,222,128,0.08)}}`}</style>
    </div>
  )
}

/* ══ Next Trip Countdown ══ */
function NextTripCard({ trip, onClick }) {
  if (!trip) return null
  const [bg1, bg2] = getCoverGradient(trip.emoji)
  const dday = getDDay(trip.startDate)

  return (
    <div
      onClick={onClick}
      className="toss-btn"
      style={{
        background: 'var(--c-surface)',
        borderRadius: 'var(--r-2xl)',
        overflow: 'hidden', cursor: 'pointer',
        boxShadow: 'var(--shadow-card)',
        display: 'flex', marginBottom: 4,
        border: '1px solid var(--c-border)',
      }}
    >
      <div style={{ width: 76, background: `linear-gradient(160deg, ${bg1}, ${bg2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, flexShrink: 0 }}>
        {trip.emoji || '✈️'}
      </div>
      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginBottom: 2, fontWeight: 500 }}>다음 여행</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: -0.3 }}>{trip.title}</p>
            {trip.destination && (
              <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 2 }}>{trip.destination}</p>
            )}
          </div>
          <span style={{
            fontSize: 17, fontWeight: 900, color: 'var(--c-primary)',
            background: 'var(--c-primary-light)', padding: '5px 12px',
            borderRadius: 'var(--r-full)', flexShrink: 0,
          }}>
            {dday}
          </span>
        </div>
      </div>
    </div>
  )
}
