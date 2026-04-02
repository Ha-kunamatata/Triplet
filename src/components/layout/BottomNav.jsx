import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/',             icon: 'home',     label: '홈' },
  { path: '/saved-places', icon: 'bookmark', label: '저장' },
  { path: '/profile',      icon: 'person',   label: '프로필' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))',
      paddingBottom: 'env(safe-area-inset-bottom)',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--c-border)',
      display: 'flex', alignItems: 'stretch',
      zIndex: 100,
    }}>
      {TABS.map(tab => {
        const active = tab.path === '/' ? pathname === '/' : pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, border: 'none', background: 'none', cursor: 'pointer',
              color: active ? 'var(--c-primary)' : 'var(--c-text-3)',
              transition: 'color var(--t-fast)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0", transition: 'all var(--t-fast)' }}>{tab.icon}</span>
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
