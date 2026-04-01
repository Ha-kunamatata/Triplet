import { useState } from 'react'
import { Link } from 'react-router-dom'
import { register } from '../firebase/auth'
import PageHeader from '../components/layout/PageHeader'

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

  return (
    <div style={{ minHeight: '100dvh', background: '#fff' }}>
      <PageHeader title="회원가입" onBack={false} />
      <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { key: 'nickname', label: '닉네임', type: 'text', placeholder: '여행에서 사용할 이름' },
          { key: 'email',    label: '이메일', type: 'email', placeholder: 'example@email.com' },
          { key: 'password', label: '비밀번호', type: 'password', placeholder: '6자 이상' },
          { key: 'confirm',  label: '비밀번호 확인', type: 'password', placeholder: '비밀번호를 다시 입력' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input
              type={f.type} value={form[f.key]} onChange={set(f.key)}
              placeholder={f.placeholder} required style={inputStyle}
            />
          </div>
        ))}

        {error && <p style={{ fontSize: 13, color: 'var(--error)' }}>{error}</p>}

        <button type="submit" disabled={loading} style={primaryBtnStyle}>
          {loading ? '가입 중...' : '가입하기'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>로그인</Link>
        </p>
      </form>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '14px 16px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 15, outline: 'none', background: '#fff', boxSizing: 'border-box' }
const primaryBtnStyle = { width: '100%', padding: '15px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: 16, fontWeight: 700, cursor: 'pointer', border: 'none' }
