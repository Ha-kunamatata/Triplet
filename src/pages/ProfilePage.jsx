import { useAuth } from '../context/AuthContext'
import { logout } from '../firebase/auth'
import AppLayout from '../components/layout/AppLayout'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <AppLayout>
      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>프로필</h1>
      </div>

      {/* 유저 정보 */}
      <div style={{ margin: '0 16px', background: '#fff', borderRadius: 'var(--radius-xl)', padding: '20px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700, flexShrink: 0 }}>
          {(user?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: 17, fontWeight: 700 }}>{user?.displayName ?? '여행자'}</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email}</p>
        </div>
      </div>

      {/* 메뉴 */}
      <div style={{ margin: '16px 16px 0', background: '#fff', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <MenuItem icon="info" label="버전" value="1.0.0" />
        <MenuItem icon="logout" label="로그아웃" onClick={logout} danger />
      </div>
    </AppLayout>
  )
}

function MenuItem({ icon, label, value, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 14, borderBottom: '1px solid var(--border)', background: 'none', cursor: onClick ? 'pointer' : 'default', color: danger ? 'var(--error)' : 'var(--text-primary)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 22, color: danger ? 'var(--error)' : 'var(--text-secondary)' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, textAlign: 'left' }}>{label}</span>
      {value && <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{value}</span>}
      {onClick && !value && <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-disabled)' }}>chevron_right</span>}
    </button>
  )
}
