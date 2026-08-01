import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ITEMS = [
  { to: '/', end: true, icon: '🏠', label: '홈' },
  { to: '/practice/korean', icon: '⌨️', label: '한타연습' },
  { to: '/practice/english', icon: '🔤', label: '영타연습' },
  { to: '/sns', icon: '💬', label: 'SNS' },
  { to: '/ranking', icon: '🏆', label: '랭킹' },
  { to: '/contests', icon: '📅', label: '대회' },
  { to: '/games', icon: '🎮', label: '게임' },
  { to: '/profile', icon: '👤', label: '프로필' },
  { to: '/settings', icon: '⚙️', label: '설정' },
]

export default function Sidebar() {
  const { profile, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-56 shrink-0 bg-graphite border-r border-white/10 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <span className="font-display text-xl text-keycap tracking-tight">타자연습</span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-key text-sm transition-colors ${
                isActive ? 'bg-keycap text-ink font-semibold' : 'text-paper/80 hover:bg-white/5 hover:text-keycap'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        {profile?.role === 'teacher' && (
          <NavLink
            to="/teacher"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-key text-sm transition-colors ${
                isActive ? 'bg-keycap text-ink font-semibold' : 'text-paper/80 hover:bg-white/5 hover:text-keycap'
              }`
            }
          >
            <span className="text-base">🏫</span>
            교사페이지
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-key text-sm transition-colors ${
                isActive ? 'bg-keycap text-ink font-semibold' : 'text-paper/80 hover:bg-white/5 hover:text-keycap'
              }`
            }
          >
            <span className="text-base">🛠️</span>
            관리자
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        {profile && (
          <p className="text-xs text-muted mb-3">
            {profile.grade}학년 {profile.classNum}반 {profile.name}
            {profile.role === 'teacher' ? ' 선생님' : ''}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="w-full text-xs px-3 py-2 rounded-key border border-white/15 text-paper/70 hover:text-coral hover:border-coral transition-colors"
        >
          로그아웃
        </button>
      </div>
    </aside>
  )
}
