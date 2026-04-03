import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { logout } from '../../firebase/auth'

const NAV = [
  { path: '/',             icon: 'home',     label: '홈' },
  { path: '/saved-places', icon: 'bookmark', label: '저장한 장소' },
  { path: '/profile',      icon: 'person',   label: '프로필' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isDark, toggleTheme } = useTheme()

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,#3B82F6,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✈️</div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color: 'var(--c-text-1)' }}>Triplet</span>
        </div>
      </div>

      {/* New Trip Button */}
      <div style={{ padding: '16px 16px 8px' }}>
        <button className="btn btn-primary w-full" onClick={() => navigate('/trips/new')}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          새 여행 만들기
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 8px' }}>
        {NAV.map(item => {
          const active = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 'var(--r-md)', marginBottom: 2,
                background: active ? 'var(--c-primary-light)' : 'transparent',
                color: active ? 'var(--c-primary)' : 'var(--c-text-2)',
                fontWeight: active ? 600 : 400,
                fontSize: 'var(--text-sm)', transition: 'all var(--t-fast)',
                cursor: 'pointer', border: 'none',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
          {(user?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName ?? '여행자'}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
        </div>
        <button onClick={toggleTheme} className="btn btn-ghost btn-icon-sm" title={isDark ? '라이트 모드' : '다크 모드'}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isDark ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <button onClick={logout} className="btn btn-ghost btn-icon-sm" title="로그아웃">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
        </button>
      </div>
    </aside>
  )
}
