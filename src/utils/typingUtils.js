// 한컴타자연습과 유사하게, 완성형 한글 음절을 초성/중성/종성 자모 입력 횟수로 환산합니다.
// (가 -> 2타 / 값 -> 3타), 공백·문장부호·영문/숫자는 1글자 = 1타로 계산합니다.
export function countKeystrokes(text) {
  let count = 0
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code >= 0xac00 && code <= 0xd7a3) {
      const syllableIndex = code - 0xac00
      const hasJongseong = syllableIndex % 28 !== 0
      count += hasJongseong ? 3 : 2
    } else if (ch.trim().length > 0 || ch === ' ') {
      count += 1
    }
  }
  return count
}

// 두 문자열(목표 문장 / 사용자가 입력한 문장)을 글자 단위로 비교해 정확도를 계산합니다.
export function calcAccuracy(target, typed) {
  if (typed.length === 0) return 0
  let correct = 0
  const len = Math.min(target.length, typed.length)
  for (let i = 0; i < len; i++) {
    if (target[i] === typed[i]) correct += 1
  }
  const accuracy = (correct / typed.length) * 100
  return Math.max(0, Math.min(100, Math.round(accuracy)))
}

// 분당 타수(CPM) 계산
export function calcCpm(keystrokes, elapsedMs) {
  if (elapsedMs <= 0) return 0
  const minutes = elapsedMs / 60000
  return Math.round(keystrokes / minutes)
}

export function formatResult(type, accuracy, cpm) {
  const label = type === 'korean' ? '한타' : '영타'
  return `[${label},${accuracy}%,${cpm}타]`
}
