import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// role: 'any' | 'teacher' | 'admin', allowAdmin: 관리자 계정도 이 페이지는 쓸 수 있게 할지
export default function ProtectedRoute({ children, role = 'any', allowAdmin = false }) {
  const { currentUser, profile, isAdmin } = useAuth()

  if (!currentUser) return <Navigate to="/login" replace />

  if (role === 'admin') {
    return isAdmin ? children : <Navigate to="/" replace />
  }

  // 관리자 계정은 기본적으로 학생/교사용 화면(users 문서가 없음)이 아니라 관리자 패널만 쓰지만,
  // allowAdmin이 켜진 페이지(대회 등)는 예외적으로 접근을 허용합니다.
  if (isAdmin) {
    return allowAdmin ? children : <Navigate to="/admin" replace />
  }

  if (!profile) return <Navigate to="/login" replace />
  if (profile.role === 'pending_teacher') return <Navigate to="/login" replace />
  if (role === 'teacher' && profile.role !== 'teacher') return <Navigate to="/" replace />

  return children
}
