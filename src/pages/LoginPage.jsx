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
    <div style={{ minHeight: '100dvh', width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--c-surface)' }}>
      {/* Hero top area */}
      <div style={{
        flex: '0 0 auto',
        background: 'linear-gradient(160deg, #1E3A5F 0%, #2563EB 60%, #60A5FA 100%)',
        padding: '60px 32px 48px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{
          width: 64, height: 64, borderRadius: 'var(--r-xl)',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 16, position: 'relative', zIndex: 1,
        }}>✈️</div>

        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-extrabold)', color: '#fff', letterSpacing: -1, marginBottom: 6, position: 'relative', zIndex: 1 }}>
          Triplet
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.75)', position: 'relative', zIndex: 1 }}>
          나만의 여행 일정 플래너
        </p>
      </div>

      {/* Form area */}
      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', maxWidth: 480, width: '100%', margin: '0 auto', alignSelf: 'stretch' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)', marginBottom: 24 }}>로그인</h2>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-error)', flexShrink: 0 }}>error</span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-error)' }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px',
            background: loading ? 'var(--c-border2)' : 'var(--c-primary)',
            color: '#fff', borderRadius: 'var(--r-xl)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)',
            marginTop: 4, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : 'var(--shadow-primary)',
            transition: 'all var(--t-base)',
          }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', fontWeight: 'var(--fw-medium)' }}>또는</span>
          <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
        </div>

        <button onClick={handleGoogle} style={{
          width: '100%', padding: '13px',
          background: 'var(--c-surface)', border: '1.5px solid var(--c-border)',
          borderRadius: 'var(--r-xl)', fontSize: 'var(--text-base)', fontWeight: 'var(--fw-medium)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          color: 'var(--c-text-1)',
          transition: 'border-color var(--t-fast), box-shadow var(--t-fast)',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-border2)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 20, height: 20 }} />
          Google로 계속하기
        </button>

        <p style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 28, fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>
          계정이 없으신가요?{' '}
          <Link to="/register" style={{ color: 'var(--c-primary)', fontWeight: 'var(--fw-semibold)' }}>회원가입</Link>
        </p>
      </div>
    </div>
  )
}

const lbl = { fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-2)', display: 'block', marginBottom: 6 }
const inp = { width: '100%', padding: '13px 16px', border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)', fontSize: 'var(--text-base)', outline: 'none', background: 'var(--c-surface2)', boxSizing: 'border-box', color: 'var(--c-text-1)', transition: 'border-color var(--t-fast), box-shadow var(--t-fast)', display: 'block' }
