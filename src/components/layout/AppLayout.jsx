import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      {/* 데스크톱 사이드바 */}
      <Sidebar />

      {/* 메인 콘텐츠 */}
      <main className="app-main page-enter">
        {children}
      </main>

      {/* 모바일 하단 네비게이션 */}
      <div className="mobile-only">
        <BottomNav />
      </div>

      <style>{`
        .mobile-only { display: none; }
        @media (max-width: 767px) { .mobile-only { display: block; } }
      `}</style>
    </div>
  )
}
