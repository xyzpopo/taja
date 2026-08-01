import { Outlet, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import HomeV2 from './pages/HomeV2'
import Settings from './pages/Settings'
import PracticeKorean from './pages/PracticeKorean'
import PracticeEnglish from './pages/PracticeEnglish'
import SNS from './pages/SNS'
import PostDetail from './pages/PostDetail'
import Ranking from './pages/Ranking'
import TeacherAdmin from './pages/TeacherAdmin'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import ForgotPassword from './pages/ForgotPassword'
import GradeChangeRequest from './pages/GradeChangeRequest'
import Profile from './pages/Profile'
import ProfileView from './pages/ProfileView'
import GamesHome from './pages/GamesHome'
import MazeGame from './pages/games/MazeGame'
import MemoryGame from './pages/games/MemoryGame'
import CardMatchGame from './pages/games/CardMatchGame'
import ContestsHome from './pages/ContestsHome'
import ContestCreate from './pages/ContestCreate'
import ContestDetail from './pages/ContestDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<AppLayout />}>
        <Route
          path="/grade-change"
          element={
            <ProtectedRoute role="any">
              <GradeChangeRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="any">
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:uid"
          element={
            <ProtectedRoute role="any">
              <ProfileView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute role="any">
              <HomeRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute role="any">
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/korean"
          element={
            <ProtectedRoute role="any">
              <PracticeKorean />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/english"
          element={
            <ProtectedRoute role="any">
              <PracticeEnglish />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sns"
          element={
            <ProtectedRoute role="any">
              <SNS />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sns/:postId"
          element={
            <ProtectedRoute role="any">
              <PostDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ranking"
          element={
            <ProtectedRoute role="any">
              <Ranking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games"
          element={
            <ProtectedRoute role="any">
              <GamesHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/maze"
          element={
            <ProtectedRoute role="any">
              <MazeGame />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/memory"
          element={
            <ProtectedRoute role="any">
              <MemoryGame />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games/cards"
          element={
            <ProtectedRoute role="any">
              <CardMatchGame />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contests"
          element={
            <ProtectedRoute role="any" allowAdmin>
              <ContestsHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contests/new"
          element={
            <ProtectedRoute role="any" allowAdmin>
              <ContestCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contests/:contestId"
          element={
            <ProtectedRoute role="any" allowAdmin>
              <ContestDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

function AppLayout() {
  const { profile, isAdmin } = useAuth()
  const isV2 = !isAdmin && profile?.uiVersion === 'v2'

  if (isV2) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

function HomeRouter() {
  const { profile, isAdmin } = useAuth()
  const isV2 = !isAdmin && profile?.uiVersion === 'v2'
  return isV2 ? <HomeV2 /> : <Home />
}
