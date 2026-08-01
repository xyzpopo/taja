// 아주 기본적인 비속어 필터입니다. 완벽하지 않으며, 자모 분리/특수문자 치환 등
// 우회 시도까지는 걸러내지 못합니다. 필요하면 목록에 단어를 추가해서 조정하세요.
const BANNED_WORDS = [
  '시발', '씨발', '씨팔', '병신', '지랄', '개새끼', '좆', '존나', '개소리',
  'fuck', 'shit', 'bitch', 'asshole',
]

export function containsBannedWords(text) {
  if (!text) return false
  const normalized = text.toLowerCase().replace(/\s+/g, '')
  return BANNED_WORDS.some((word) => normalized.includes(word))
}
