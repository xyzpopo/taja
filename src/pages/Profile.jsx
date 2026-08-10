import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { compressImageToDataUrl } from '../utils/imageCompress'
import { containsBannedWords } from '../utils/profanityFilter'
import AvatarWithStickers from '../components/AvatarWithStickers'
import { invalidateAuthorVisuals } from '../utils/authorVisualsCache'
import {
  bioLimitForPoints,
  postLimitForPoints,
  STICKERS,
  STICKER_POSITIONS,
  unlockedStickers,
  nextStickerToUnlock,
} from '../utils/pointsConfig'

export default function Profile() {
  const { profile, currentUser } = useAuth()
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarData, setAvatarData] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function loadAvatar() {
      const snap = await getDoc(doc(db, 'avatars', currentUser.uid))
      if (snap.exists()) setAvatarData(snap.data().avatarData || '')
    }
    if (currentUser) loadAvatar()
  }, [currentUser])

  // 이 기능이 추가되기 전에 가입한 계정은 publicProfiles 문서가 없을 수 있어서,
  // 본인이 프로필 페이지를 열 때 자동으로 채워넣습니다(다른 학생이 프로필을 볼 수 있도록).
  useEffect(() => {
    if (!currentUser || !profile) return
    setDoc(
      doc(db, 'publicProfiles', currentUser.uid),
      {
        uid: currentUser.uid,
        name: profile.name,
        grade: profile.grade,
        classNum: profile.classNum,
        number: profile.number,
        bio: profile.bio || '',
        equippedStickers: profile.equippedStickers || {},
      },
      { merge: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, profile?.name, profile?.grade, profile?.classNum, profile?.number])

  const points = profile?.points || 0
  const bioLimit = bioLimitForPoints(points)
  const postLimit = postLimitForPoints(points)
  const unlocked = unlockedStickers(points)
  const next = nextStickerToUnlock(points)
  const equippedStickers = profile?.equippedStickers || {}

  async function handleSaveBio(e) {
    e.preventDefault()
    setError('')
    if (containsBannedWords(bio)) {
      setError('자기소개에 부적절한 표현이 포함되어 있어요.')
      return
    }
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { bio })
      await updateDoc(doc(db, 'publicProfiles', currentUser.uid), { bio })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setError('')
    try {
      const dataUrl = await compressImageToDataUrl(file)
      await setDoc(doc(db, 'avatars', currentUser.uid), { uid: currentUser.uid, avatarData: dataUrl })
      setAvatarData(dataUrl)
      invalidateAuthorVisuals(currentUser.uid)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  // 자리(position)를 눌러 스티커를 배정/해제합니다. 같은 스티커를 다시 누르면 그 자리에서 뺍니다.
  async function handleAssignSticker(position, stickerId) {
    const already = equippedStickers[position] === stickerId
    const nextMap = { ...equippedStickers }
    if (already || stickerId === null) {
      delete nextMap[position]
    } else {
      nextMap[position] = stickerId
    }
    await updateDoc(doc(db, 'users', currentUser.uid), { equippedStickers: nextMap })
    await updateDoc(doc(db, 'publicProfiles', currentUser.uid), { equippedStickers: nextMap })
    invalidateAuthorVisuals(currentUser.uid)
  }

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-keycap mb-1">내 프로필</h1>
      <p className="text-muted text-sm mb-8">
        {profile.grade}학년 {profile.classNum}반 {profile.number}번 {profile.name}
      </p>

      <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6 flex items-center gap-5">
        <AvatarWithStickers avatarData={avatarData} name={profile.name} equippedStickers={equippedStickers} size="lg" />
        <div>
          <label className="key inline-block bg-panel border border-white/15 text-sm px-3 py-1.5 rounded-key cursor-pointer hover:border-keycap">
            {uploadingAvatar ? '업로드 중...' : '프로필 사진 바꾸기'}
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
          <p className="text-[11px] text-muted mt-2">부적절한 사진은 다른 친구가 신고할 수 있어요.</p>
        </div>
      </div>

      <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-paper">포인트</h2>
          <span className="font-display text-2xl text-keycap">{points}P</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          한타·영타 연습을 완료할 때마다 포인트가 쌓여요. 포인트가 모이면 자기소개 글자 수({bioLimit}자),
          게시물 글자 수({postLimit}자)가 늘어나고, 프로필에 붙일 스티커도 잠금 해제돼요.
        </p>
        {next && (
          <p className="text-xs text-mint mt-2">다음 스티커 {next.emoji} {next.label}까지 {next.points - points}P 남았어요.</p>
        )}
      </div>

      <div className="bg-panel border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="font-display text-lg text-paper mb-1">스티커</h2>
        <p className="text-xs text-muted mb-4">
          자리마다 스티커를 하나씩 골라 아바타 네 귀퉁이에 자유롭게 붙일 수 있어요. 같은 스티커를 다시 누르면 빠져요.
        </p>
        <div className="flex flex-col gap-4">
          {STICKER_POSITIONS.map((pos) => (
            <div key={pos.id}>
              <p className="text-xs text-paper/80 mb-2">{pos.label}</p>
              <div className="flex gap-2 flex-wrap">
                {STICKERS.map((s) => {
                  const isUnlocked = unlocked.some((u) => u.id === s.id)
                  const isHere = equippedStickers[pos.id] === s.id
                  return (
                    <button
                      key={s.id}
                      disabled={!isUnlocked}
                      onClick={() => handleAssignSticker(pos.id, s.id)}
                      className={`key flex flex-col items-center gap-0.5 px-3 py-2 rounded-key border text-center ${
                        isHere
                          ? 'bg-keycap text-ink border-keycap'
                          : isUnlocked
                            ? 'bg-ink border-white/15 hover:border-keycap'
                            : 'bg-ink/50 border-white/5 opacity-40'
                      }`}
                    >
                      <span className="text-lg">{s.emoji}</span>
                      <span className="text-[9px]">{isUnlocked ? s.label : `${s.points}P`}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSaveBio} className="bg-panel border border-white/10 rounded-2xl p-6">
        <h2 className="font-display text-lg text-paper mb-3">자기소개</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, bioLimit))}
          maxLength={bioLimit}
          className="input-base w-full min-h-20"
          placeholder="한 줄 소개를 적어보세요"
        />
        <p className="text-[11px] text-muted mt-1">{bio.length}/{bioLimit}자</p>
        {error && <p className="text-coral text-sm mt-2">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="key mt-3 bg-keycap text-ink font-semibold px-4 py-2 rounded-key disabled:opacity-60"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        {saved && <span className="ml-3 text-mint text-sm">저장됐어요 ✓</span>}
      </form>
    </div>
  )
}
