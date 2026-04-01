import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoadingSpinner from './components/common/LoadingSpinner'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import TripDetailPage from './pages/TripDetailPage'
import CreateTripPage from './pages/CreateTripPage'
import AddSchedulePage from './pages/AddSchedulePage'
import DiaryListPage from './pages/DiaryListPage'
import DiaryEditPage from './pages/DiaryEditPage'
import SavedPlacesPage from './pages/SavedPlacesPage'
import ProfilePage from './pages/ProfilePage'

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

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* 비공개 라우트 */}
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/trips/new" element={<PrivateRoute><CreateTripPage /></PrivateRoute>} />
        <Route path="/trips/:tripId" element={<PrivateRoute><TripDetailPage /></PrivateRoute>} />
        <Route path="/trips/:tripId/schedule/add" element={<PrivateRoute><AddSchedulePage /></PrivateRoute>} />
        <Route path="/trips/:tripId/schedule/:scheduleId/edit" element={<PrivateRoute><AddSchedulePage /></PrivateRoute>} />
        <Route path="/trips/:tripId/diary" element={<PrivateRoute><DiaryListPage /></PrivateRoute>} />
        <Route path="/trips/:tripId/diary/new" element={<PrivateRoute><DiaryEditPage /></PrivateRoute>} />
        <Route path="/trips/:tripId/diary/:diaryId/edit" element={<PrivateRoute><DiaryEditPage /></PrivateRoute>} />
        <Route path="/saved-places" element={<PrivateRoute><SavedPlacesPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
