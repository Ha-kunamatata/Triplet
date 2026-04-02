import { useAuth } from '../context/AuthContext'
import { logout } from '../firebase/auth'
import AppLayout from '../components/layout/AppLayout'

export default function ProfilePage() {
  const { user } = useAuth()
  const initial = (user?.displayName ?? user?.email ?? '?')[0].toUpperCase()

  return (
    <AppLayout>
      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)', color: 'var(--c-text-1)', letterSpacing: -0.5 }}>프로필</h1>
      </div>

      {/* User card */}
      <div style={{ margin: '16px', background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)', borderRadius: 'var(--r-2xl)', padding: '24px', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}>
        {/* deco */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 60, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 24, fontWeight: 'var(--fw-extrabold)', flexShrink: 0,
          }}>
            {initial}
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)', color: '#fff' }}>
              {user?.displayName ?? '여행자'}
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
              {user?.email}
            </p>
            <span style={{ display: 'inline-block', marginTop: 8, fontSize: 'var(--text-xs)', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', padding: '3px 10px', borderRadius: 'var(--r-full)', fontWeight: 'var(--fw-medium)' }}>
              ✈️ 여행자
            </span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ margin: '0 16px', background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <MenuItem icon="info" label="버전" value="1.0.0" />
        <MenuItem icon="help_outline" label="도움말" />
      </div>

      <div style={{ margin: '12px 16px 0', background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <MenuItem icon="logout" label="로그아웃" onClick={logout} danger />
      </div>

      <p style={{ textAlign: 'center', padding: '20px', fontSize: 'var(--text-xs)', color: 'var(--c-text-3)' }}>
        Triplet v1.0.0 · Made with ❤️
      </p>
    </AppLayout>
  )
}

function MenuItem({ icon, label, value, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        padding: '16px 20px', gap: 14,
        borderBottom: '1px solid var(--c-border)',
        background: 'none', cursor: onClick ? 'pointer' : 'default',
        color: danger ? 'var(--c-error)' : 'var(--c-text-1)',
        transition: 'background var(--t-fast)',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = danger ? '#FEF2F2' : 'var(--c-surface2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = '' }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--r-lg)',
        background: danger ? '#FEF2F2' : 'var(--c-surface2)',
        border: `1px solid ${danger ? '#FECACA' : 'var(--c-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: danger ? 'var(--c-error)' : 'var(--c-text-2)', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <span style={{ flex: 1, fontSize: 'var(--text-base)', fontWeight: 'var(--fw-medium)', textAlign: 'left' }}>{label}</span>
      {value && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-3)' }}>{value}</span>}
      {onClick && !value && (
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--c-text-3)' }}>chevron_right</span>
      )}
    </button>
  )
}
