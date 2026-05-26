import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { logout } from '../firebase/auth'
import { getTrips } from '../firebase/firestore'
import { calcTripStatus, getTripDuration } from '../utils/dateUtils'

export default function ProfilePage() {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getTrips(user.uid).then(setTrips).finally(() => setLoading(false))
  }, [user])

  const initial = (user?.displayName ?? user?.email ?? '?')[0].toUpperCase()

  const totalDays = trips.reduce((sum, t) => sum + getTripDuration(t.startDate, t.endDate), 0)
  const completed = trips.filter(t => calcTripStatus(t.startDate, t.endDate) === 'completed')
  const totalBudget = trips.reduce((sum, t) => sum + (t.budget ?? 0), 0)
  const totalSpent = trips.reduce((sum, t) => sum + (t.expenses ?? []).reduce((s, e) => s + (Number(e.amount) || 0), 0), 0)
  const mostVisited = trips.reduce((acc, t) => {
    if (!t.destination) return acc
    const dest = t.destination.split(' ').slice(-1)[0]
    acc[dest] = (acc[dest] ?? 0) + 1
    return acc
  }, {})

  return (
      <div style={{ paddingBottom: 32 }}>
      {/* ── User hero card ── */}
      <div style={{ margin: '16px', background: 'linear-gradient(160deg, #1E3A5F 0%, #2563EB 60%, #60A5FA 100%)', borderRadius: 'var(--r-2xl)', padding: '28px 24px', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 26, fontWeight: 900, flexShrink: 0,
          }}>
            {initial}
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)', color: '#fff', lineHeight: 1.2 }}>
              {user?.displayName ?? '여행자'}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Travel stats */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20, position: 'relative', zIndex: 1 }}>
            <HeroStat value={trips.length} label="전체 여행" />
            <HeroStat value={completed.length} label="완료한 여행" />
            <HeroStat value={`${totalDays}일`} label="총 여행일수" />
          </div>
        )}
      </div>

      {/* ── Travel stats ── */}
      {!loading && trips.length > 0 && (
        <>
          <SectionTitle label="여행 통계" />
          <div style={{ margin: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard icon="payments" label="총 예산" value={totalBudget > 0 ? `${Math.round(totalBudget / 10000)}만원` : '-'} color="#3B82F6" bg="rgba(59,130,246,0.1)" />
            <StatCard icon="receipt_long" label="총 지출" value={totalSpent > 0 ? `${Math.round(totalSpent / 10000)}만원` : '-'} color="#F97316" bg="rgba(249,115,22,0.1)" />
          </div>
          {Object.keys(mostVisited).length > 0 && (
            <div style={{ margin: '10px 16px 0', background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--c-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10B981', fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>자주 방문한 여행지</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(mostVisited).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([dest, cnt]) => (
                  <div key={dest} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '5px 12px', borderRadius: 20 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>{dest}</span>
                    <span style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 600 }}>{cnt}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Account section ── */}
      <SectionTitle label="계정" />
      <div style={{ margin: '0 16px', background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <MenuItem icon="person" label="이름" value={user?.displayName ?? '미설정'} />
        <MenuItem icon="mail" label="이메일" value={user?.email} last />
      </div>

      {/* ── App section ── */}
      <SectionTitle label="앱 정보" />
      <div style={{ margin: '0 16px', background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <MenuItem icon="info" label="버전" value="1.0.0" />
        <MenuItem icon="favorite" label="Made with love" value="Triplet" last />
      </div>

      {/* ── Logout ── */}
      <div style={{ margin: '12px 16px 0' }}>
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '15px',
            background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--r-xl)', color: 'var(--c-error)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all var(--t-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-error)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--c-error)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = 'var(--c-error)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
          로그아웃
        </button>
      </div>

      <p style={{ textAlign: 'center', padding: '20px 16px 8px', fontSize: 'var(--text-xs)', color: 'var(--c-text-3)' }}>
        Triplet v1.0.0 · ✈️ 나만의 여행 플래너
      </p>
      </div>
  )
}

function HeroStat({ value, label }) {
  return (
    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--r-lg)', padding: '10px 8px' }}>
      <p style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{label}</p>
    </div>
  )
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 600, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--c-text-1)' }}>{value}</p>
      </div>
    </div>
  )
}

function SectionTitle({ label }) {
  return (
    <p style={{ padding: '16px 20px 8px', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
      {label}
    </p>
  )
}

function MenuItem({ icon, label, value, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 14,
      borderBottom: last ? 'none' : '1px solid var(--c-border)',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--r-lg)', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--c-text-2)', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <span style={{ flex: 1, fontSize: 'var(--text-base)', fontWeight: 'var(--fw-medium)', color: 'var(--c-text-1)' }}>{label}</span>
      {value && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>}
    </div>
  )
}
