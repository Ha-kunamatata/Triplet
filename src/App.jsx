import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoadingSpinner from './components/common/LoadingSpinner'
import AppLayout from './components/layout/AppLayout'

// Eager: needed at first paint
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage     from './pages/HomePage'

// Lazy: code-split per route
const TripDetailPage  = lazy(() => import('./pages/TripDetailPage'))
const CreateTripPage  = lazy(() => import('./pages/CreateTripPage'))
const AddSchedulePage = lazy(() => import('./pages/AddSchedulePage'))
const DiaryListPage   = lazy(() => import('./pages/DiaryListPage'))
const DiaryEditPage   = lazy(() => import('./pages/DiaryEditPage'))
const SavedPlacesPage = lazy(() => import('./pages/SavedPlacesPage'))
const ProfilePage     = lazy(() => import('./pages/ProfilePage'))
const JoinTripPage    = lazy(() => import('./pages/JoinTripPage'))

const PageFallback = () => <LoadingSpinner fullScreen />

function PrivateRoute({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <LoadingSpinner fullScreen />
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <LoadingSpinner fullScreen />
  return user ? <Navigate to="/" replace /> : children
}

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
      <Suspense fallback={<PageFallback />}>
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

          {/* 공유 초대 링크 */}
          <Route path="/join/:shareCode"
            element={<PrivateRoute><JoinTripPage /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
