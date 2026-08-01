import { collection, doc, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore'
import { todayStr } from './dateUtils'

export function isEligible(contest, profile) {
  if (!profile) return false
  if (contest.scopeType === 'all') return true
  return (contest.scope || []).some((s) => s.grade === profile.grade && s.classNum === profile.classNum)
}

export function isActiveToday(contest, today = todayStr()) {
  return today >= contest.startDate && today <= contest.endDate
}

export function contestStatus(contest, today = todayStr()) {
  if (today < contest.startDate) return 'upcoming'
  if (today > contest.endDate) return 'ended'
  return 'active'
}

// 연습이 끝났을 때 호출: 이 결과(type/stage/cpm)와 맞고, 오늘 날짜가 기간 안이며,
// 참가 자격이 있는 모든 대회에 대해 "오늘의 기록"을 반영합니다. (하루 1회만 인정)
export async function applyContestScoring(db, { type, stage, cpm, profile, uid }) {
  const snap = await getDocs(collection(db, 'contests'))
  const today = todayStr()

  const matching = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.type === type && c.stage === stage)
    .filter((c) => isActiveToday(c, today))
    .filter((c) => isEligible(c, profile))

  for (const contest of matching) {
    const entryRef = doc(db, 'contestEntries', `${contest.id}_${uid}`)
    // eslint-disable-next-line no-await-in-loop
    await runTransaction(db, async (tx) => {
      const entrySnap = await tx.get(entryRef)
      const prev = entrySnap.exists() ? entrySnap.data() : null
      if (prev?.lastPracticeDate === today) return // 오늘은 이미 측정함 (하루 1회 제한)

      const daysParticipated = (prev?.daysParticipated || 0) + 1
      const bestCpm = Math.max(prev?.bestCpm || 0, cpm)

      tx.set(entryRef, {
        contestId: contest.id,
        uid,
        name: profile.name,
        grade: profile.grade,
        classNum: profile.classNum,
        bestCpm,
        daysParticipated,
        lastPracticeDate: today,
        score: bestCpm * daysParticipated,
        updatedAt: serverTimestamp(),
      })
    })
  }
}
