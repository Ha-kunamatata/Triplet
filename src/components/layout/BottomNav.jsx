import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/',             icon: 'home',         label: '홈' },
  { path: '/saved-places', icon: 'bookmark',     label: '저장' },
  { path: '/profile',      icon: 'person',       label: '프로필' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 'var(--app-width)',
      height: 'var(--bottom-nav-height)',
      background: '#fff', borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'stretch',
      zIndex: 100,
    }}>
      {TABS.map(tab => {
        const active = tab.path === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, color: active ? 'var(--primary)' : 'var(--text-disabled)',
              fontFamily: 'var(--font)', transition: 'color 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 26, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 500 }}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
