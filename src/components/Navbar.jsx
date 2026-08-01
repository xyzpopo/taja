import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-key text-sm font-body transition-colors ${
    isActive ? 'bg-keycap text-ink font-semibold' : 'text-paper/80 hover:text-keycap'
  }`

export default function Navbar() {
  const { profile, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-white/10 bg-graphite sticky top-0 z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl text-keycap tracking-tight">타자연습</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>홈</NavLink>
          <NavLink to="/practice/korean" className={linkClass}>한타연습</NavLink>
          <NavLink to="/practice/english" className={linkClass}>영타연습</NavLink>
          <NavLink to="/sns" className={linkClass}>SNS</NavLink>
          <NavLink to="/ranking" className={linkClass}>랭킹</NavLink>
          <NavLink to="/games" className={linkClass}>게임</NavLink>
          <NavLink to="/contests" className={linkClass}>대회</NavLink>
          <NavLink to="/profile" className={linkClass}>프로필</NavLink>
          <NavLink to="/settings" className={linkClass}>설정</NavLink>
          {profile?.role === 'teacher' && (
            <NavLink to="/teacher" className={linkClass}>교사페이지</NavLink>
          )}
          {isAdmin && <NavLink to="/admin" className={linkClass}>관리자</NavLink>}
        </nav>
        <div className="flex items-center gap-3">
          {profile && (
            <span className="text-xs text-muted hidden sm:inline">
              {profile.grade}학년 {profile.classNum}반 {profile.name}
              {profile.role === 'teacher' ? ' 선생님' : ''}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-key border border-white/15 text-paper/70 hover:text-coral hover:border-coral transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
