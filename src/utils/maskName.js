// SNS에서 이름을 일부 가려서 보여줍니다.
// 1글자: 그대로, 2글자: 첫 글자+* (가나 -> 가*)
// 3글자 이상: 첫 글자 + (길이-2)개의 * + 마지막 글자 (가나다 -> 가*다, 가나다라 -> 가**라)
export function maskName(name) {
  if (!name) return name
  const len = name.length
  if (len <= 1) return name
  if (len === 2) return name[0] + '*'
  return name[0] + '*'.repeat(len - 2) + name[len - 1]
}
