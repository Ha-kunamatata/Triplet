import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTripByShareCode, joinTrip } from '../firebase/firestore'

export default function JoinTripPage() {
  const { shareCode } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | joining | already | notfound | done | error

  useEffect(() => {
    if (!user || !shareCode) return

    getTripByShareCode(shareCode.toUpperCase())
      .then(async trip => {
        if (!trip) { setStatus('notfound'); return }

        // 이미 오너이거나 멤버이면 바로 이동
        if (trip.userId === user.uid || trip.sharedWith?.includes(user.uid)) {
          navigate(`/trips/${trip.id}`, { replace: true })
          return
        }

        setStatus('joining')
        await joinTrip(trip.id, user.uid)
        navigate(`/trips/${trip.id}`, { replace: true })
      })
      .catch(() => setStatus('error'))
  }, [user, shareCode, navigate])

  const content = {
    loading: { icon: '✈️', title: '초대 링크 확인 중…', sub: '잠시만 기다려주세요', spin: true },
    joining: { icon: '🎉', title: '여행에 참여하는 중…', sub: '일정 불러오는 중', spin: true },
    notfound: { icon: '🔍', title: '링크를 찾을 수 없어요', sub: '공유 링크가 만료됐거나 유효하지 않습니다', spin: false },
    error: { icon: '😕', title: '오류가 발생했어요', sub: '잠시 후 다시 시도해주세요', spin: false },
  }[status] ?? { icon: '✈️', title: '처리 중…', sub: '', spin: true }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--c-surface)', padding: 24, gap: 20,
    }}>
      <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 4 }}>{content.icon}</div>

      {content.spin && (
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--c-border)',
          borderTopColor: 'var(--c-primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
      )}

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text-1)', letterSpacing: -0.5 }}>{content.title}</p>
        <p style={{ fontSize: 14, color: 'var(--c-text-3)', marginTop: 6 }}>{content.sub}</p>
      </div>

      {(status === 'notfound' || status === 'error') && (
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{
            marginTop: 8, padding: '13px 32px', borderRadius: 'var(--r-full)',
            background: 'var(--c-primary)', color: '#fff',
            fontSize: 15, fontWeight: 700, boxShadow: 'var(--shadow-primary)',
          }}
        >
          홈으로 돌아가기
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
