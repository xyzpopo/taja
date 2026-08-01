import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const cache = new Map()

// publicProfiles/{uid}.equippedSticker 값을 가져옵니다. 같은 uid는 세션 동안 한 번만 조회합니다.
export async function getEquippedSticker(uid) {
  if (!uid) return null
  if (cache.has(uid)) return cache.get(uid)
  try {
    const snap = await getDoc(doc(db, 'publicProfiles', uid))
    const sticker = snap.exists() ? snap.data().equippedSticker || null : null
    cache.set(uid, sticker)
    return sticker
  } catch {
    return null
  }
}
