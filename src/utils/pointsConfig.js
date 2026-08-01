// 포인트 시스템 설정. 숫자는 필요에 따라 언제든 조정하세요.

export const POINTS_PER_PRACTICE = 2 // 연습 1회 완료할 때마다
export const POINTS_PER_POST = 5 // SNS에 결과를 공유할 때 추가로

export const BASE_BIO_LENGTH = 30
export const BASE_POST_LENGTH = 200

// 포인트 구간별로 늘어나는 자기소개/게시물 글자 수
const BIO_TIERS = [
  { points: 0, bonus: 0 },
  { points: 50, bonus: 20 },
  { points: 150, bonus: 30 },
  { points: 300, bonus: 50 },
]
const POST_LENGTH_TIERS = [
  { points: 0, bonus: 0 },
  { points: 100, bonus: 200 },
  { points: 250, bonus: 300 },
]

export function bioLimitForPoints(points) {
  const bonus = BIO_TIERS.filter((t) => points >= t.points).reduce((max, t) => Math.max(max, t.bonus), 0)
  return BASE_BIO_LENGTH + bonus
}

export function postLimitForPoints(points) {
  const bonus = POST_LENGTH_TIERS.filter((t) => points >= t.points).reduce((max, t) => Math.max(max, t.bonus), 0)
  return BASE_POST_LENGTH + bonus
}

// 프로필 옆에 붙일 수 있는 스티커. points 이상 모이면 잠금 해제됩니다.
export const STICKERS = [
  { id: 'heart', emoji: '❤️', points: 20, label: '하트' },
  { id: 'star', emoji: '✨', points: 60, label: '반짝이' },
  { id: 'butterfly', emoji: '🦋', points: 120, label: '나비' },
  { id: 'wing', emoji: '🪽', points: 200, label: '날개' },
  { id: 'crown', emoji: '👑', points: 350, label: '왕관' },
]

export function unlockedStickers(points) {
  return STICKERS.filter((s) => points >= s.points)
}

export function nextStickerToUnlock(points) {
  return STICKERS.find((s) => points < s.points) ?? null
}
