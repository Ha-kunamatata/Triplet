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
      if (ownResult.status === 'fulfilled') setTrips(ownResult.value)
      if (sharedResult.status === 'fulfilled') setSharedTrips(sharedResult.value)
      else console.error('[HomePage] getSharedTrips failed:', sharedResult.reason)
    }).finally(() => setLoading(false))
  }, [user])

  const allTrips  = [...trips, ...sharedTrips]
  const ongoing  = allTrips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'ongoing')
  const upcoming = allTrips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'upcoming')
  const completed = allTrips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'completed')
  const filtered = filter === 'all' ? trips : trips.filter(t => calcTripStatus(t.startDate, t.endDate) === filter)

  return (
      <div style={{ minHeight: '100%' }}>
      {/* ── Top header — Toss 스타일 ── */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        {/* 인사 + 버튼 */}
        <div style={{ padding: '20px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--c-text-3)', fontWeight: 500, marginBottom: 2 }}>{getGreeting()}</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-text-1)', letterSpacing: -0.7, lineHeight: 1.2 }}>
              {user?.displayName ?? '여행자'}님의 여행
            </h1>
          </div>
          <button
            onClick={() => navigate('/trips/new')}
            className="toss-btn"
            style={{
              width: 46, height: 46, borderRadius: 'var(--r-xl)',
              background: 'linear-gradient(135deg, var(--c-primary) 0%, #6366F1 100%)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)', flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>add</span>
          </button>
        </div>

        {/* 통계 그리드 — Toss 스타일 큰 숫자 */}
        {!loading && trips.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
            {[
              { value: upcoming.length,  label: '예정',    icon: 'flight_takeoff', color: 'var(--c-primary)' },
              { value: ongoing.length,   label: '여행 중', icon: 'explore',        color: '#10B981' },
              { value: completed.length, label: '완료',    icon: 'check_circle',   color: 'var(--c-text-3)' },
            ].map(({ value, label, icon, color }, i) => (
              <div key={label} style={{ padding: '14px 0', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--c-border)' : 'none' }}>
                <p style={{ fontSize: 26, fontWeight: 900, color: value > 0 ? color : 'var(--c-text-3)', letterSpacing: -1, lineHeight: 1 }}>{value}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'var(--c-text-3)', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  <p style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 500 }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 필터 탭 */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 16px 12px', scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '7px 16px', borderRadius: 'var(--r-full)', flexShrink: 0,
              background: filter === f.key ? 'var(--c-primary)' : 'var(--c-surface2)',
              color: filter === f.key ? '#fff' : 'var(--c-text-2)',
              border: 'none',
              fontSize: 13, fontWeight: filter === f.key ? 700 : 500,
              boxShadow: filter === f.key ? '0 2px 10px rgba(59,130,246,0.3)' : 'none',
              transition: 'all 0.15s',
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Ongoing trip hero banner ── */}
      {!loading && ongoing.length > 0 && (
        <div style={{ padding: '14px 16px 0' }}>
          {ongoing.slice(0, 1).map(t => (
            <OngoingBanner key={t.id} trip={t} onClick={() => navigate(`/trips/${t.id}`)} />
          ))}
        </div>
      )}

      {/* ── Next trip countdown ── */}
      {!loading && ongoing.length === 0 && upcoming.length > 0 && (
        <div style={{ padding: '14px 16px 0' }}>
          <NextTripCard trip={upcoming[0]} onClick={() => navigate(`/trips/${upcoming[0].id}`)} />
        </div>
      )}

      {/* ── Trip list ── */}
      <div style={{ padding: '14px 16px' }}>
        {(ongoing.length > 0 || (ongoing.length === 0 && upcoming.length > 0)) && filter === 'all' && (
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            전체 여행
          </p>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 14,
          }}>
            {filtered.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        )}

        {/* 공유받은 여행 */}
        {!loading && sharedTrips.length > 0 && (
          <div style={{ padding: '20px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#8B5CF6', fontVariationSettings: "'FILL' 1" }}>group</span>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text-1)' }}>공유받은 여행</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {sharedTrips.map(t => (
                <div key={t.id} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 12, right: 12, background: '#8B5CF6', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, zIndex: 1 }}>공유됨</div>
                  <TripCard trip={t} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
  )
}

/* ── Ongoing Banner ── */
function OngoingBanner({ trip, onClick }) {
  const [bg1, bg2] = getCoverGradient(trip.emoji)
  const duration = getTripDuration(trip.startDate, trip.endDate)

  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
        borderRadius: 'var(--r-2xl)', padding: '20px',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        marginBottom: 6,
        boxShadow: '0 8px 24px rgba(59,130,246,0.25)',
        transition: 'transform var(--t-base), box-shadow var(--t-base)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,130,246,0.35)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.25)' }}
    >
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', boxShadow: '0 0 0 3px rgba(74,222,128,0.35)', animation: 'livePulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>지금 여행 중</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 3 }}>{trip.destination}</p>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{trip.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 12, marginTop: 6 }}>
            {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)} · {duration}일
          </p>
        </div>
        <span style={{ fontSize: 48, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))', position: 'relative', zIndex: 1 }}>
          {trip.emoji || '✈️'}
        </span>
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600 }}>
        <span>일정 보기</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
      </div>
      <style>{`@keyframes livePulse{0%,100%{box-shadow:0 0 0 3px rgba(74,222,128,0.35)}50%{box-shadow:0 0 0 6px rgba(74,222,128,0.1)}}`}</style>
    </div>
  )
}

/* ── Next Trip Countdown Card ── */
function NextTripCard({ trip, onClick }) {
  const [bg1, bg2] = getCoverGradient(trip.emoji)
  const dday = getDDay(trip.startDate)

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--c-surface)', borderRadius: 'var(--r-2xl)',
        overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-md)',
        display: 'flex', marginBottom: 6,
        transition: 'transform var(--t-base), box-shadow var(--t-base)',
        border: '1px solid var(--c-border)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
    >
      <div style={{ width: 80, background: `linear-gradient(160deg, ${bg1}, ${bg2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>
        {trip.emoji || '✈️'}
      </div>
      <div style={{ flex: 1, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginBottom: 3 }}>다음 여행</p>
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)' }}>{trip.title}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 3 }}>{trip.destination}</p>
          </div>
          <span style={{
            fontSize: 18, fontWeight: 900, color: 'var(--c-primary)',
            background: 'var(--c-primary-light)', padding: '4px 12px',
            borderRadius: 'var(--r-full)',
          }}>
            {dday}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Stat Pill ── */
function StatPill({ icon, value, label, color, bg }) {
  return (
    <div style={{ flex: 1, background: bg, borderRadius: 'var(--r-xl)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <div>
        <p style={{ fontSize: 18, fontWeight: 'var(--fw-extrabold)', color: 'var(--c-text-1)', lineHeight: 1.1 }}>{value}</p>
        <p style={{ fontSize: 10, color: 'var(--c-text-3)', marginTop: 1 }}>{label}</p>
      </div>
    </div>
  )
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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return '좋은 새벽이에요 🌙'
  if (h < 12) return '좋은 아침이에요 ☀️'
  if (h < 18) return '좋은 오후에요 🌤'
  return '좋은 저녁이에요 🌆'
}
