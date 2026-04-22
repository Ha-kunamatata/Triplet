import { useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { logout } from '../../firebase/auth'

/**
 * 5탭 하단 네비게이션 — 모바일 전용 (768px+ 에서 숨김)
 *
 * 컨텍스트 인식:
 * - /trips/:tripId 라우트 안: 일정/지도/예산 탭이 해당 뷰로 전환
 * - 그 외: 일정/지도/예산 탭은 홈으로 이동 (비활성 스타일)
 * - 더보기: 설정 시트 열기
 */
export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isDark, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [showMore, setShowMore] = useState(false)

  // 현재 tripId 파싱 (/trips/:tripId 형태)
  const tripMatch = pathname.match(/^\/trips\/([^/]+)$/)
  const tripId = tripMatch?.[1] ?? null
  const inTrip = Boolean(tripId)

  // 현재 뷰 모드 (trip 라우트 안에서만 의미 있음)
  const currentView = searchParams.get('view') || 'timeline'

  function switchView(view) {
    if (inTrip) {
      setSearchParams({ view }, { replace: true })
    } else {
      navigate('/')
    }
  }

  const isHome    = pathname === '/'
  const isTimeline = inTrip && currentView === 'timeline'
  const isMap      = inTrip && currentView === 'map'
  const isBudget   = inTrip && currentView === 'budget'

  const TABS = [
    {
      key:     'home',
      icon:    'home',
      label:   '홈',
      active:  isHome,
      onPress: () => navigate('/'),
    },
    {
      key:     'timeline',
      icon:    'event_note',
      label:   '일정',
      active:  isTimeline,
      dim:     !inTrip,
      onPress: () => switchView('timeline'),
    },
    {
      key:     'map',
      icon:    'map',
      label:   '지도',
      active:  isMap,
      dim:     !inTrip,
      onPress: () => switchView('map'),
    },
    {
      key:     'budget',
      icon:    'payments',
      label:   '예산',
      active:  isBudget,
      dim:     !inTrip,
      onPress: () => switchView('budget'),
    },
    {
      key:     'more',
      icon:    'more_horiz',
      label:   '더보기',
      active:  showMore,
      onPress: () => setShowMore(v => !v),
    },
  ]

  return (
    <>
      {/* ── 하단 탭바 ── */}
      <nav
        className="bottom-nav"
        aria-label="주요 탐색"
        style={{
          /* position: fixed 제거 — 인라인 레이아웃으로 iOS Safari 탭바 겹침 해결 */
          flexShrink: 0,
          height: 'calc(var(--bottom-nav-h) + var(--safe-bottom))',
          paddingBottom: 'var(--safe-bottom)',
          background: isDark ? 'rgba(26,35,51,0.97)' : 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--c-border)',
          display: 'flex',
          alignItems: 'stretch',
          zIndex: 100,
        }}
      >
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
                transition: 'color 0.15s, transform 0.12s',
                position: 'relative',
                paddingTop: 6,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* 활성 인디케이터 (상단 2px 바) */}
              {tab.active && (
                <span style={{
                  position: 'absolute',
                  top: 0, left: '20%', right: '20%',
                  height: 2,
                  background: 'var(--c-primary)',
                  borderRadius: '0 0 2px 2px',
                }} />
              )}

              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 24,
                  fontVariationSettings: tab.active ? "'FILL' 1" : "'FILL' 0",
                  transition: 'all 0.15s',
                }}
              >
                {tab.icon}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: tab.active ? 700 : 400,
                letterSpacing: -0.2,
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* ── 더보기 시트 ── */}
      {showMore && (
        <div
          className="bottom-sheet-overlay"
          onClick={() => setShowMore(false)}
        >
          <div
            className="bottom-sheet"
            onClick={e => e.stopPropagation()}
            style={{ borderRadius: 'var(--card-radius) var(--card-radius) 0 0' }}
          >
            <div className="bottom-sheet-handle" />

            <div style={{ padding: '16px 0 8px' }}>
              {/* 저장한 장소 */}
              <MoreItem
                icon="bookmark"
                label="저장한 장소"
                onPress={() => { navigate('/saved-places'); setShowMore(false) }}
              />
              {/* 프로필 */}
              <MoreItem
                icon="person"
                label="프로필"
                onPress={() => { navigate('/profile'); setShowMore(false) }}
              />

              <div style={{ height: 1, background: 'var(--c-border)', margin: '8px 20px' }} />

              {/* 테마 전환 */}
              <MoreItem
                icon={isDark ? 'light_mode' : 'dark_mode'}
                label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
                onPress={() => { toggleTheme(); setShowMore(false) }}
              />

              <div style={{ height: 1, background: 'var(--c-border)', margin: '8px 20px' }} />

              {/* 로그아웃 */}
              <MoreItem
                icon="logout"
                label="로그아웃"
                color="var(--c-error)"
                onPress={() => { logout(); setShowMore(false) }}
              />
            </div>

            {/* 사용자 정보 */}
            {user && (
              <div style={{
                margin: '8px 20px 0',
                padding: '12px 16px',
                background: 'var(--c-surface2)',
                borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0,
                }}>
                  {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName ?? '여행자'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--c-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function MoreItem({ icon, label, color, onPress }) {
  return (
    <button
      onClick={onPress}
      className="more-item"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '13px 24px',
        background: 'transparent',
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
        style={{ fontSize: 22, color: color ?? 'var(--c-text-2)', fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      {label}
    </button>
  )
}
