import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { STICKERS } from '../utils/pointsConfig'
import ReportButton from '../components/ReportButton'

export default function ProfileView() {
  const { uid } = useParams()
  const { currentUser } = useAuth()
  const [target, setTarget] = useState(undefined) // undefined = 로딩중, null = 없음
  const [avatarData, setAvatarData] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [profileSnap, avatarSnap] = await Promise.all([
          getDoc(doc(db, 'publicProfiles', uid)),
          getDoc(doc(db, 'avatars', uid)),
        ])
        setTarget(profileSnap.exists() ? profileSnap.data() : null)
        if (avatarSnap.exists()) setAvatarData(avatarSnap.data().avatarData || '')
      } catch {
        setTarget(null)
      }
    }
    setTarget(undefined)
    setAvatarData('')
    load()
  }, [uid])

  // 본인 프로필이면 수정 가능한 화면으로 보냅니다.
  if (currentUser?.uid === uid) return <Navigate to="/profile" replace />

  if (target === undefined) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-muted">불러오는 중...</div>
  }
  if (target === null) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-muted">존재하지 않는 사용자예요.</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-keycap mb-1">{target.name}님의 프로필</h1>
      <p className="text-muted text-sm mb-8">
        {target.grade}학년 {target.classNum}반 {target.number}번
      </p>

      <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="relative">
          {avatarData ? (
            <img src={avatarData} alt="" className="w-20 h-20 rounded-full object-cover border border-white/15" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-ink border border-white/15 flex items-center justify-center text-2xl text-muted">
              {target.name?.[0] ?? '?'}
            </div>
          )}
          {target.equippedSticker && (
            <span className="absolute -bottom-1 -right-1 text-xl">
              {STICKERS.find((s) => s.id === target.equippedSticker)?.emoji}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <ReportButton
            type="avatar"
            targetId={uid}
            reportedAuthor={{ uid, name: target.name, grade: target.grade, classNum: target.classNum }}
            contentSnapshot="(프로필 사진 신고)"
            label="프로필사진 신고"
          />
        </div>
      </div>

      <div className="bg-panel border border-white/10 rounded-2xl p-6">
        <h2 className="font-display text-lg text-paper mb-3">자기소개</h2>
        <p className="text-sm text-paper/80 whitespace-pre-wrap min-h-6">
          {target.bio ? target.bio : '아직 자기소개가 없어요.'}
        </p>
      </div>
    </div>
  )
}
