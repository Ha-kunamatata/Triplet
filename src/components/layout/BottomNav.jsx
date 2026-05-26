import { useState, useCallback } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { logout } from '../../firebase/auth'

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isDark, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [showMore, setShowMore] = useState(false)
  const [closingMore, setClosingMore] = useState(false)
  const [pressedKey, setPressedKey] = useState(null)

  const tripMatch = pathname.match(/^\/trips\/([^/]+)$/)
  const tripId = tripMatch?.[1] ?? null
  const inTrip = Boolean(tripId)
  const currentView = searchParams.get('view') || 'timeline'

  function switchView(view) {
    if (inTrip) setSearchParams({ view }, { replace: true })
    else navigate('/')
  }

  const openMore = useCallback(() => setShowMore(true), [])
  const closeMore = useCallback(() => {
    setClosingMore(true)
    setTimeout(() => { setShowMore(false); setClosingMore(false) }, 260)
  }, [])

  const isHome     = pathname === '/'
  const isTimeline = inTrip && currentView === 'timeline'
  const isMap      = inTrip && currentView === 'map'
  const isBudget   = inTrip && currentView === 'budget'

  const TABS = [
    { key: 'home',     icon: 'home',       label: '홈',    active: isHome,     onPress: () => navigate('/') },
    { key: 'timeline', icon: 'event_note', label: '일정',  active: isTimeline, dim: !inTrip, onPress: () => switchView('timeline') },
    { key: 'map',      icon: 'map',        label: '지도',  active: isMap,      dim: !inTrip, onPress: () => switchView('map') },
    { key: 'budget',   icon: 'payments',   label: '예산',  active: isBudget,   dim: !inTrip, onPress: () => switchView('budget') },
    { key: 'more',     icon: 'more_horiz', label: '더보기', active: showMore,  onPress: () => showMore ? closeMore() : openMore() },
  ]

  const activeIdx = TABS.findIndex(t => t.active)

  return (
    <>
      <nav
        className="bottom-nav"
        aria-label="주요 탐색"
        style={{
          flexShrink: 0,
          height: 'calc(var(--bottom-nav-h) + var(--safe-bottom))',
          paddingBottom: 'var(--safe-bottom)',
          background: 'var(--c-surface-glass)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--c-border)',
          display: 'flex',
          alignItems: 'stretch',
          zIndex: 100,
          position: 'relative',
        }}
      >
        {/* Sliding active indicator — single bar that transitions between tabs */}
        {activeIdx >= 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            left: `calc(${activeIdx} * 20% + 4%)`,
            width: '12%',
            height: 2,
            background: 'var(--c-primary)',
            borderRadius: '0 0 3px 3px',
            transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
            pointerEvents: 'none',
          }} />
        )}

        {TABS.map(tab => {
          const color = tab.active
            ? 'var(--c-primary)'
            : tab.dim
              ? 'var(--c-border2)'
              : 'var(--c-text-3)'

          return (
            <button
              key={tab.key}
              onClick={tab.onPress}
              onPointerDown={() => setPressedKey(tab.key)}
              onPointerUp={() => setPressedKey(null)}
              onPointerLeave={() => setPressedKey(null)}
              aria-label={tab.label}
              aria-current={tab.active ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color,
                paddingTop: 6,
                WebkitTapHighlightColor: 'transparent',
                transform: pressedKey === tab.key ? 'scale(0.85)' : 'scale(1)',
                transition: 'color 0.15s, transform 0.1s',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 24,
                  fontVariationSettings: tab.active ? "'FILL' 1" : "'FILL' 0",
                  transform: tab.active ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s var(--ease)',
                }}
              >
                {tab.icon}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: tab.active ? 700 : 400,
                letterSpacing: -0.2,
                transition: 'font-weight 0.15s',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* More sheet with slide-down exit animation */}
      {showMore && (
        <div
          className="bottom-sheet-overlay"
          onClick={closeMore}
          style={{ animation: closingMore ? 'fadeOut 0.26s var(--ease) both' : undefined }}
        >
          <div
            className="bottom-sheet"
            onClick={e => e.stopPropagation()}
            style={{
              borderRadius: 'var(--card-radius) var(--card-radius) 0 0',
              animation: closingMore
                ? 'slideDown 0.26s cubic-bezier(0.4,0,1,1) both'
                : 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1) both',
            }}
          >
            <div className="bottom-sheet-handle" />

            {/* User info */}
            {user && (
              <div style={{
                margin: '14px 20px 4px',
                padding: '12px 16px',
                background: 'var(--c-surface2)',
                borderRadius: 'var(--r-lg)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 17, fontWeight: 800, flexShrink: 0,
                }}>
                  {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName ?? '여행자'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--c-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            <div style={{ padding: '8px 0 8px' }}>
              <MoreItem icon="bookmark" label="저장한 장소"
                onPress={() => { navigate('/saved-places'); closeMore() }} />
              <MoreItem icon="person" label="프로필"
                onPress={() => { navigate('/profile'); closeMore() }} />

              <div style={{ height: 1, background: 'var(--c-border)', margin: '8px 20px' }} />

              <MoreItem
                icon={isDark ? 'light_mode' : 'dark_mode'}
                label={isDark ? '라이트 모드' : '다크 모드'}
                onPress={() => { toggleTheme(); closeMore() }}
              />

              <div style={{ height: 1, background: 'var(--c-border)', margin: '8px 20px' }} />

              <MoreItem icon="logout" label="로그아웃" color="var(--c-error)"
                onPress={() => { logout(); closeMore() }} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MoreItem({ icon, label, color, onPress }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '13px 24px',
        background: hovered ? 'var(--c-surface2)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: color ?? 'var(--c-text-1)',
        fontSize: 15,
        fontWeight: 500,
        textAlign: 'left',
        transition: 'background var(--t-fast)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 22, color: color ?? 'var(--c-text-2)', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
      >
        {icon}
      </span>
      {label}
    </button>
  )
}
