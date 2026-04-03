import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

/**
 * 앱 쉘 레이아웃
 * - 모바일 (<768px): 콘텐츠 전체 너비, 하단 탭바
 * - 태블릿 (768px+): 좌측 사이드바 240px + 콘텐츠
 * - 데스크탑 (1024px+): 사이드바 + 더 넓은 콘텐츠
 * - <Outlet /> 이 자식 라우트를 렌더링
 */
export default function AppLayout() {
  return (
    <div className="app-shell page-enter">
      {/* 태블릿/데스크탑 전용 사이드바 */}
      <aside className="app-sidebar">
        <Sidebar />
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* 모바일 전용 하단 탭바 */}
      <BottomNav />
    </div>
  )
}
