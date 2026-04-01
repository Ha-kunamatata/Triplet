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
    } catch (err) {
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
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
      {/* 로고 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>✈️</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)', letterSpacing: -1 }}>Triplet</h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 6 }}>나만의 여행 일정 플래너</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>이메일</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com" required autoComplete="email"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>비밀번호</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요" required autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: 'var(--error)', textAlign: 'center' }}>{error}</p>}

          <button type="submit" disabled={loading} style={primaryBtnStyle}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>또는</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button onClick={handleGoogle} style={{ ...outlineBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 20, height: 20 }} />
          Google로 계속하기
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          계정이 없으신가요?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>회원가입</Link>
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '14px 16px', border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-md)', fontSize: 15, outline: 'none',
  background: '#fff', boxSizing: 'border-box',
}
const primaryBtnStyle = {
  width: '100%', padding: '15px', background: 'var(--primary)', color: '#fff',
  borderRadius: 'var(--radius-md)', fontSize: 16, fontWeight: 700,
  marginTop: 4, cursor: 'pointer', border: 'none',
}
const outlineBtnStyle = {
  width: '100%', padding: '13px', background: '#fff',
  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
  fontSize: 15, fontWeight: 500, cursor: 'pointer',
}
