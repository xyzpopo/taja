// 열정 점수 = 연속으로 연습한 날짜 수(스트릭). 하루에 몇 번을 연습하든 그 날은 1일로만 셉니다.
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 기존 streakCount/lastPracticeDate를 보고 오늘 연습했을 때의 새 값을 계산합니다.
// 이미 오늘 연습해서 갱신할 필요가 없으면 null을 반환합니다.
export function computeStreakUpdate(prevStreakCount, prevLastDate) {
  const today = todayStr()
  if (prevLastDate === today) return null // 오늘 이미 반영됨

  const newStreak = prevLastDate === yesterdayStr() ? (prevStreakCount || 0) + 1 : 1
  return { streakCount: newStreak, lastPracticeDate: today }
}
