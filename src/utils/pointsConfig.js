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

// 아바타 주변에 스티커를 붙일 수 있는 자리. 자리마다 하나씩, 여러 개 동시에 붙일 수 있습니다.
export const STICKER_POSITIONS = [
  { id: 'top-left', label: '왼쪽 위' },
  { id: 'top-right', label: '오른쪽 위' },
  { id: 'bottom-left', label: '왼쪽 아래' },
  { id: 'bottom-right', label: '오른쪽 아래' },
]

export const STICKER_POSITION_STYLE = {
  'top-left': 'top-0 left-0 -translate-x-1/3 -translate-y-1/3',
  'top-right': 'top-0 right-0 translate-x-1/3 -translate-y-1/3',
  'bottom-left': 'bottom-0 left-0 -translate-x-1/3 translate-y-1/3',
  'bottom-right': 'bottom-0 right-0 translate-x-1/3 translate-y-1/3',
}
