import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, getDocs, limit, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { profile, currentUser } = useAuth()
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    async function load() {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3))
      const snap = await getDocs(q)
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }
    load()
  }, [])

  async function dismissAdminMessage() {
    await updateDoc(doc(db, 'users', currentUser.uid), { adminMessage: '' })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-paper mb-1">
        안녕하세요, {profile?.name}{profile?.role === 'teacher' ? ' 선생님' : '님'} 👋
      </h1>
      <p className="text-muted text-sm mb-6">
        {profile?.grade}학년 {profile?.classNum}반{profile?.number ? ` ${profile.number}번` : ''}
      </p>

      {profile?.adminMessage && (
        <div className="mb-6 bg-keycap/10 border border-keycap/40 rounded-key p-4 text-sm flex items-start justify-between gap-4">
          <p className="text-paper/90">
            <span className="text-keycap font-semibold">관리자 메시지: </span>
            {profile.adminMessage}
          </p>
          <button onClick={dismissAdminMessage} className="text-xs text-muted hover:text-paper shrink-0">
            닫기
          </button>
        </div>
      )}

      {announcements.length > 0 && (
        <div className="mb-8 flex flex-col gap-2">
          {announcements.map((a) => (
            <div key={a.id} className="bg-panel border border-mint/30 rounded-key p-4">
              <p className="text-mint text-sm font-semibold mb-1">📢 {a.title}</p>
              <p className="text-paper/80 text-sm whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {profile?.status === 'suspended' && (
        <div className="mb-8 bg-coral/10 border border-coral/40 text-coral rounded-key p-4 text-sm">
          현재 게시물 작성이 정지된 상태입니다. 담임 선생님께 문의해주세요. (연습은 계속 가능합니다.)
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Card to="/practice/korean" title="한타 연습" desc="한글 문장을 빠르고 정확하게 입력해보세요." accent="keycap" />
        <Card to="/practice/english" title="영타 연습" desc="영문 문장 타자 실력을 길러보세요." accent="mint" />
        <Card to="/sns" title="SNS" desc="연습 결과를 공유하고 친구들 게시물을 구경해요." accent="coral" />
        <Card to="/ranking" title="랭킹" desc="우리 학교 타자왕은 누구? 순위를 확인해요." accent="keycap" />
        <Card to="/games" title="두뇌 게임" desc="미로찾기, 순서기억 등으로 머리를 식혀보세요." accent="mint" />
        <Card to="/contests" title="대회" desc="일주일간 진행되는 타자 대회에 참여해보세요." accent="coral" />
      </div>

      {profile?.role === 'student' && (
        <Link to="/grade-change" className="inline-block mt-6 text-xs text-muted hover:text-keycap">
          학년/반/번호가 바뀌었나요? 변경 요청하기 →
        </Link>
      )}
    </div>
  )
}

function Card({ to, title, desc, accent }) {
  const accentClass = { keycap: 'text-keycap', mint: 'text-mint', coral: 'text-coral' }[accent]
  return (
    <Link
      to={to}
      className="bg-panel border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-colors"
    >
      <h2 className={`font-display text-xl mb-2 ${accentClass}`}>{title}</h2>
      <p className="text-sm text-paper/70">{desc}</p>
    </Link>
  )
}
