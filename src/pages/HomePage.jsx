import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTrips } from '../firebase/firestore'
import { calcTripStatus } from '../utils/dateUtils'
import AppLayout from '../components/layout/AppLayout'
import TripCard from '../components/trip/TripCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
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
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    getTrips(user.uid)
      .then(data => setTrips(data))
      .finally(() => setLoading(false))
  }, [user])

  const ongoing = trips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'ongoing')
  const filtered = filter === 'all' ? trips : trips.filter(t => calcTripStatus(t.startDate, t.endDate) === filter)

  return (
    <AppLayout>
      {/* 상단 헤더 */}
      <div style={{ padding: '20px 20px 0', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>안녕하세요 👋</p>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>{user?.displayName ?? '여행자'}님</h1>
          </div>
          <button
            onClick={() => navigate('/trips/new')}
            style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add</span>
          </button>
        </div>

        {/* 필터 탭 */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 16px', borderRadius: 'var(--radius-full)',
                background: filter === f.key ? 'var(--primary)' : 'var(--bg)',
                color: filter === f.key ? '#fff' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* 여행 중 배너 */}
      {ongoing.length > 0 && (
        <div style={{ margin: '16px 16px 0' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 0 2px #bbf7d0' }} />
            지금 여행 중
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ongoing.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        </div>
      )}

      {/* 여행 목록 */}
      <div style={{ padding: '16px' }}>
        {ongoing.length > 0 && filter === 'all' && (
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>전체 여행</p>
        )}
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="flight_takeoff"
            title="여행이 없어요"
            description="새로운 여행을 계획해보세요!"
            action="여행 만들기"
            onAction={() => navigate('/trips/new')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
