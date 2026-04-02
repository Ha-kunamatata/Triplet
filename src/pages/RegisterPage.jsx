import { useState } from 'react'
import { Link } from 'react-router-dom'
import { register } from '../firebase/auth'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', confirm: '', nickname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('비밀번호가 일치하지 않습니다.')
    if (form.password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.')
    setLoading(true)
    try {
      await register(form.email, form.password, form.nickname)
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? '이미 사용 중인 이메일입니다.' : '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'nickname', label: '닉네임', type: 'text', placeholder: '여행에서 사용할 이름', autoComplete: 'nickname' },
    { key: 'email',    label: '이메일', type: 'email', placeholder: 'example@email.com', autoComplete: 'email' },
    { key: 'password', label: '비밀번호', type: 'password', placeholder: '6자 이상', autoComplete: 'new-password' },
    { key: 'confirm',  label: '비밀번호 확인', type: 'password', placeholder: '비밀번호를 다시 입력', autoComplete: 'new-password' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-surface)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--c-border)' }}>
        <Link to="/login" style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--c-surface2)', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-2)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </Link>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>✈️</span>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)' }}>Triplet</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '28px 24px 40px', maxWidth: 480, width: '100%', margin: '0 auto', alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)', color: 'var(--c-text-1)', marginBottom: 6 }}>회원가입</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-3)', marginBottom: 28 }}>계정을 만들고 여행을 시작하세요</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={lbl}>{f.label}</label>
              <input
                type={f.type} value={form[f.key]} onChange={set(f.key)}
                placeholder={f.placeholder} required autoComplete={f.autoComplete}
                style={inp}
              />
            </div>
          ))}

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
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 28, fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={{ color: 'var(--c-primary)', fontWeight: 'var(--fw-semibold)' }}>로그인</Link>
        </p>
      </div>
    </div>
  )
}

const lbl = { fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-2)', display: 'block', marginBottom: 6 }
const inp = { width: '100%', padding: '13px 16px', border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)', fontSize: 'var(--text-base)', outline: 'none', background: 'var(--c-surface2)', boxSizing: 'border-box', color: 'var(--c-text-1)', transition: 'border-color var(--t-fast)', display: 'block' }
