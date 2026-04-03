import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoadingSpinner from './components/common/LoadingSpinner'
import AppLayout from './components/layout/AppLayout'

import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import HomePage        from './pages/HomePage'
import TripDetailPage  from './pages/TripDetailPage'
import CreateTripPage  from './pages/CreateTripPage'
import AddSchedulePage from './pages/AddSchedulePage'
import DiaryListPage   from './pages/DiaryListPage'
import DiaryEditPage   from './pages/DiaryEditPage'
import SavedPlacesPage from './pages/SavedPlacesPage'
import ProfilePage     from './pages/ProfilePage'

/** 인증 필요 — 미로그인 시 /login으로 */
function PrivateRoute({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <LoadingSpinner fullScreen />
  return user ? children : <Navigate to="/login" replace />
}

/** 비인증 전용 — 로그인 상태면 /로 */
function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <LoadingSpinner fullScreen />
  return user ? <Navigate to="/" replace /> : children
}

/**
 * 앱 쉘(사이드바 + 하단 탭바)이 있는 레이아웃 라우트.
 * AppLayout 안에서 <Outlet />이 자식 라우트를 렌더링한다.
 */
function ShellLayout() {
  return (
    <PrivateRoute>
      <AppLayout />
    </PrivateRoute>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* ── 공개 라우트 ── */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* ── 앱 쉘 포함 라우트 ── */}
        <Route element={<ShellLayout />}>
          <Route path="/"              element={<HomePage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
          <Route path="/saved-places"  element={<SavedPlacesPage />} />
          <Route path="/profile"       element={<ProfilePage />} />
          <Route path="/trips/:tripId/diary" element={<DiaryListPage />} />
        </Route>

        {/* ── 풀스크린 폼 페이지 (앱 쉘 없음) ── */}
        <Route path="/trips/new"
          element={<PrivateRoute><CreateTripPage /></PrivateRoute>} />
        <Route path="/trips/:tripId/schedule/add"
          element={<PrivateRoute><AddSchedulePage /></PrivateRoute>} />
        <Route path="/trips/:tripId/schedule/:scheduleId/edit"
          element={<PrivateRoute><AddSchedulePage /></PrivateRoute>} />
        <Route path="/trips/:tripId/item/add"
          element={<PrivateRoute><AddSchedulePage /></PrivateRoute>} />
        <Route path="/trips/:tripId/item/:itemId/edit"
          element={<PrivateRoute><AddSchedulePage /></PrivateRoute>} />
        <Route path="/trips/:tripId/diary/new"
          element={<PrivateRoute><DiaryEditPage /></PrivateRoute>} />
        <Route path="/trips/:tripId/diary/:diaryId/edit"
          element={<PrivateRoute><DiaryEditPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
