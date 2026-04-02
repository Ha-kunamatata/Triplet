import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTrips } from '../firebase/firestore'
import { calcTripStatus } from '../utils/dateUtils'
import AppLayout from '../components/layout/AppLayout'
import TripCard from '../components/trip/TripCard'
import { TripCardSkeleton } from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'

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
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    getTrips(user.uid)
      .then(data => setTrips(data))
      .finally(() => setLoading(false))
  }, [user])

  const ongoing  = trips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'ongoing')
  const upcoming = trips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'upcoming')
  const filtered = filter === 'all' ? trips : trips.filter(t => calcTripStatus(t.startDate, t.endDate) === filter)

  const greeting = getGreeting()

  return (
    <AppLayout>
      {/* ── Top header ── */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-3)', marginBottom: 2 }}>{greeting}</p>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)', color: 'var(--c-text-1)', letterSpacing: -0.5 }}>
              {user?.displayName ?? '여행자'}님 ✈️
            </h1>
          </div>
          <button
            onClick={() => navigate('/trips/new')}
            style={{
              width: 44, height: 44, borderRadius: 'var(--r-xl)',
              background: 'var(--c-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: 'var(--shadow-primary)',
              transition: 'transform var(--t-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add</span>
          </button>
        </div>

        {/* Stats strip */}
        {!loading && trips.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <StatChip icon="flight_takeoff" label="예정" value={upcoming.length} color="var(--c-primary)" />
            <StatChip icon="explore" label="여행 중" value={ongoing.length} color="var(--c-success)" />
            <StatChip icon="check_circle" label="완료" value={trips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'completed').length} color="var(--c-text-3)" />
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 16px', borderRadius: 'var(--r-full)',
                background: filter === f.key ? 'var(--c-primary)' : 'var(--c-surface2)',
                color: filter === f.key ? '#fff' : 'var(--c-text-2)',
                border: filter === f.key ? 'none' : '1px solid var(--c-border)',
                fontSize: 'var(--text-sm)', fontWeight: filter === f.key ? 'var(--fw-semibold)' : 'var(--fw-medium)',
                whiteSpace: 'nowrap', flexShrink: 0,
                boxShadow: filter === f.key ? 'var(--shadow-primary)' : 'none',
                transition: 'all var(--t-base)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Ongoing banner ── */}
      {!loading && ongoing.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <SectionLabel icon="explore" label="지금 여행 중" color="var(--c-success)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            {ongoing.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        </div>
      )}

      {/* ── Trip list ── */}
      <div style={{ padding: '16px' }}>
        {ongoing.length > 0 && filter === 'all' && (
          <SectionLabel icon="list" label="전체 여행" />
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: ongoing.length > 0 ? 10 : 0 }}>
            <TripCardSkeleton /><TripCardSkeleton /><TripCardSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="flight_takeoff"
            title={filter === 'all' ? '아직 여행이 없어요' : `${FILTERS.find(f => f.key === filter)?.label} 여행이 없어요`}
            description="새로운 여행을 계획해보세요!"
            action="여행 만들기"
            onAction={() => navigate('/trips/new')}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginTop: ongoing.length > 0 && filter === 'all' ? 10 : 0 }}>
            {filtered.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function SectionLabel({ icon, label, color = 'var(--c-text-2)' }) {
  return (
    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      {label}
    </p>
  )
}

function StatChip({ icon, label, value, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <div>
        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)', color: 'var(--c-text-1)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 2 }}>{label}</p>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return '좋은 새벽이에요 🌙'
  if (h < 12) return '좋은 아침이에요 ☀️'
  if (h < 18) return '좋은 오후에요 🌤'
  return '좋은 저녁이에요 🌆'
}
