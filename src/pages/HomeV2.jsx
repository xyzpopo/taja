import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, getDocs, limit, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const QUICK_LINKS = [
  { to: '/practice/korean', icon: '⌨️', label: '한타연습' },
  { to: '/practice/english', icon: '🔤', label: '영타연습' },
  { to: '/sns', icon: '💬', label: 'SNS' },
  { to: '/ranking', icon: '🏆', label: '랭킹' },
  { to: '/contests', icon: '📅', label: '대회' },
  { to: '/games', icon: '🎮', label: '게임' },
  { to: '/profile', icon: '👤', label: '프로필' },
]

export default function HomeV2() {
  const { profile, currentUser } = useAuth()
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    async function load() {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(2))
      const snap = await getDocs(q)
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }
    load()
  }, [])

  async function dismissAdminMessage() {
    await updateDoc(doc(db, 'users', currentUser.uid), { adminMessage: '' })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-paper">
            {profile?.name}{profile?.role === 'teacher' ? ' 선생님' : '님'}, 안녕하세요 👋
          </h1>
          <p className="text-muted text-xs mt-1">
            {profile?.grade}학년 {profile?.classNum}반{profile?.number ? ` ${profile.number}번` : ''}
          </p>
        </div>
      </div>

      {profile?.adminMessage && (
        <div className="mb-5 bg-keycap/10 border border-keycap/40 rounded-key p-4 text-sm flex items-start justify-between gap-4">
          <p className="text-paper/90">
            <span className="text-keycap font-semibold">관리자 메시지: </span>
            {profile.adminMessage}
          </p>
          <button onClick={dismissAdminMessage} className="text-xs text-muted hover:text-paper shrink-0">
            닫기
          </button>
        </div>
      )}

      {profile?.status === 'suspended' && (
        <div className="mb-5 bg-coral/10 border border-coral/40 text-coral rounded-key p-4 text-sm">
          현재 게시물 작성이 정지된 상태입니다. (연습은 계속 가능합니다.)
        </div>
      )}

      {/* 요약 스탯 바 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="포인트" value={`${profile?.points ?? 0}P`} accent="text-keycap" />
        <StatCard label="열정 점수" value={`🔥 ${profile?.streakCount ?? 0}일`} accent="text-coral" />
        <StatCard label="학년/반" value={`${profile?.grade ?? '-'}-${profile?.classNum ?? '-'}`} accent="text-mint" />
        <StatCard label="역할" value={profile?.role === 'teacher' ? '교사' : '학생'} accent="text-paper" />
      </div>

      {announcements.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {announcements.map((a) => (
            <div key={a.id} className="bg-panel border border-mint/30 rounded-key p-4">
              <p className="text-mint text-sm font-semibold mb-1">📢 {a.title}</p>
              <p className="text-paper/80 text-sm whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* 빠른 이동 타일 */}
      <h2 className="font-display text-sm text-muted mb-2">바로가기</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="bg-panel border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-keycap/50 transition-colors"
          >
            <span className="text-2xl">{l.icon}</span>
            <span className="text-xs text-paper/80">{l.label}</span>
          </Link>
        ))}
      </div>

      {profile?.role === 'student' && (
        <Link to="/grade-change" className="inline-block text-xs text-muted hover:text-keycap">
          학년/반/번호가 바뀌었나요? 변경 요청하기 →
        </Link>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-panel border border-white/10 rounded-2xl p-4 text-center">
      <p className="text-[11px] text-muted mb-1">{label}</p>
      <p className={`font-display text-xl ${accent}`}>{value}</p>
    </div>
  )
}
