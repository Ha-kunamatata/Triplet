import { useState } from 'react'
import { Link } from 'react-router-dom'
import { login, loginWithGoogle } from '../firebase/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    try {
      await loginWithGoogle()
    } catch {
      setError('구글 로그인에 실패했습니다.')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #1E3A5F 0%, #1d4ed8 55%, #3b82f6 100%)',
      padding: '24px 20px',
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>
        {/* Logo header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          padding: '28px 28px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, position: 'relative', zIndex: 1,
          }}>✈️</div>
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Triplet</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>나만의 여행 일정 플래너</p>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '24px 28px 28px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 18 }}>로그인</h2>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com" required autoComplete="email"
                style={inp} />
            </div>
            <div>
              <label style={lbl}>비밀번호</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요" required autoComplete="current-password"
                style={inp} />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#EF4444', flexShrink: 0 }}>error</span>
                <p style={{ fontSize: 13, color: '#EF4444' }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px',
              background: loading ? '#93C5FD' : '#2563EB',
              color: '#fff', borderRadius: 12,
              fontSize: 15, fontWeight: 700, marginTop: 2,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
              transition: 'all 0.15s', border: 'none',
            }}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>또는</span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>

          <button onClick={handleGoogle} style={{
            width: '100%', padding: '12px',
            background: '#fff', border: '1.5px solid #E5E7EB',
            borderRadius: 12, fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            color: '#374151', cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#9CA3AF'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 18, height: 18 }} />
            Google로 계속하기
          </button>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#6B7280' }}>
            계정이 없으신가요?{' '}
            <Link to="/register" style={{ color: '#2563EB', fontWeight: 600 }}>회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const lbl = { fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 5 }
const inp = { width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 15, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box', color: '#111827', transition: 'border-color 0.15s', display: 'block' }
