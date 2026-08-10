import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const cache = new Map()

// avatars/{uid}.avatarData 와 publicProfiles/{uid}.equippedStickers를 함께 가져옵니다.
// 같은 uid는 세션 동안 한 번만 조회합니다(게시물 목록 등에서 중복 조회 방지).
export async function getAuthorVisuals(uid) {
  if (!uid) return { avatarData: '', equippedStickers: {} }
  if (cache.has(uid)) return cache.get(uid)

  const result = { avatarData: '', equippedStickers: {} }
  try {
    const [avatarSnap, profileSnap] = await Promise.all([
      getDoc(doc(db, 'avatars', uid)),
      getDoc(doc(db, 'publicProfiles', uid)),
    ])
    if (avatarSnap.exists()) result.avatarData = avatarSnap.data().avatarData || ''
    if (profileSnap.exists()) result.equippedStickers = profileSnap.data().equippedStickers || {}
  } catch {
    // 조회 실패 시 빈 값으로 둡니다 (게시물 목록 렌더링을 막지 않기 위함)
  }

  cache.set(uid, result)
  return result
}

// 본인이 아바타/스티커를 바꾼 직후에는 캐시를 지워서 새로고침 없이 최신 값이 보이게 합니다.
export function invalidateAuthorVisuals(uid) {
  cache.delete(uid)
}
