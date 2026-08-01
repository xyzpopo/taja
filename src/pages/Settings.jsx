import { useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { profile, currentUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const current = profile?.uiVersion || 'v1'

  async function handleChange(version) {
    if (version === current) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { uiVersion: version })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-keycap mb-1">설정</h1>
      <p className="text-muted text-sm mb-8">나에게 맞는 화면 스타일을 골라보세요.</p>

      <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="font-display text-lg text-paper mb-4">화면 버전</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <VersionCard
            active={current === 'v1'}
            onClick={() => handleChange('v1')}
            title="1버전"
            desc="상단 메뉴 + 카드형 홈 화면. 지금까지 써오던 익숙한 구성이에요."
          />
          <VersionCard
            active={current === 'v2'}
            onClick={() => handleChange('v2')}
            title="2버전"
            desc="왼쪽 사이드바 메뉴 + 요약형 대시보드 홈 화면. 좀 더 정리된 느낌이에요."
          />
        </div>
        {saving && <p className="text-xs text-muted mt-4">저장 중...</p>}
      </div>

      {profile?.role === 'student' && (
        <div className="bg-panel border border-white/10 rounded-2xl p-6">
          <h2 className="font-display text-lg text-paper mb-2">학년/반/번호</h2>
          <p className="text-xs text-muted mb-4">
            새 학년이 되어 반이 바뀌었거나 정보가 잘못 등록됐다면 변경을 신청할 수 있어요.
            관리자 승인 후 반영되며, 기존에 쓴 글/기록은 그대로 유지돼요.
          </p>
          <Link
            to="/grade-change"
            className="key inline-block bg-keycap text-ink font-semibold px-4 py-2 rounded-key text-sm"
          >
            학년/반/번호 변경 신청하기
          </Link>
        </div>
      )}
    </div>
  )
}

function VersionCard({ active, onClick, title, desc }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl p-5 border transition-colors ${
        active ? 'border-keycap bg-keycap/10' : 'border-white/10 bg-ink hover:border-white/30'
      }`}
    >
      <p className={`font-display text-lg mb-1 ${active ? 'text-keycap' : 'text-paper'}`}>
        {title} {active && '✓'}
      </p>
      <p className="text-xs text-paper/70">{desc}</p>
    </button>
  )
}
