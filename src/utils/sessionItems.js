// pool 안의 항목들을 무작위로 섞어서 count개를 채웁니다. pool이 count보다 작으면
// pool 전체를 한 바퀴 다 쓴 뒤에 다시 섞어서 이어붙입니다(같은 항목이 바로 연달아 나오지 않도록).
export function buildSessionItems(pool, count) {
  if (!pool || pool.length === 0) return []
  const items = []
  let lastPrev = null
  while (items.length < count) {
    const shuffled = shuffle(pool)
    // 이전 바퀴의 마지막 항목과 새 바퀴의 첫 항목이 같으면 살짝 섞어서 연속 반복을 줄입니다.
    if (lastPrev !== null && shuffled[0] === lastPrev && shuffled.length > 1) {
      ;[shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]]
    }
    items.push(...shuffled)
    lastPrev = shuffled[shuffled.length - 1]
  }
  return items.slice(0, count)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
