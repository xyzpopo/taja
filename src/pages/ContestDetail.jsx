import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { contestStatus } from '../utils/contests'
import { STAGES } from '../utils/stages'

const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.id, s.label]))
const STATUS_LABEL = { active: '진행중', upcoming: '예정', ended: '종료' }

export default function ContestDetail() {
  const { contestId } = useParams()
  const { currentUser, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [contest, setContest] = useState(undefined)
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'contests', contestId))
        setContest(snap.exists() ? { id: snap.id, ...snap.data() } : null)

        const q = query(collection(db, 'contestEntries'), where('contestId', '==', contestId), orderBy('score', 'desc'))
        const entrySnap = await getDocs(q)
        setEntries(entrySnap.docs.map((d) => d.data()))
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [contestId])

  async function handleDelete() {
    if (!confirm('이 대회를 삭제할까요? 참가 기록도 더 이상 순위에 표시되지 않아요.')) return
    try {
      await deleteDoc(doc(db, 'contests', contestId))
      navigate('/contests')
    } catch (err) {
      setError(err.message)
    }
  }

  if (contest === undefined) return <div className="max-w-2xl mx-auto px-4 py-10 text-muted">불러오는 중...</div>
  if (contest === null) return <div className="max-w-2xl mx-auto px-4 py-10 text-muted">존재하지 않는 대회예요.</div>

  const status = contestStatus(contest)
  const canManage = isAdmin || contest.createdBy === currentUser?.uid
  const myEntry = entries?.find((e) => e.uid === currentUser?.uid)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/contests" className="text-xs text-muted hover:text-keycap mb-4 inline-block">
        ← 대회 목록으로
      </Link>

      <h1 className="font-display text-3xl text-keycap mb-1">{contest.title}</h1>
      <p className="text-muted text-sm mb-1">
        {contest.type === 'korean' ? '한타' : '영타'} · {STAGE_LABEL[contest.stage]}
      </p>
      <p className="text-muted text-sm mb-1">
        {contest.startDate} ~ {contest.endDate} · {STATUS_LABEL[status]}
      </p>
      <p className="text-muted text-sm mb-6">
        대상: {contest.scopeType === 'all' ? '전체 학교' : (contest.scope || []).map((s) => `${s.grade}학년 ${s.classNum}반`).join(', ')}
      </p>

      {myEntry && (
        <div className="bg-keycap/10 border border-keycap/40 rounded-key p-4 mb-6 text-sm">
          내 기록: 최고 {myEntry.bestCpm}타 · 참여 {myEntry.daysParticipated}일 ·{' '}
          <span className="text-keycap font-semibold">{myEntry.score}점</span>
        </div>
      )}

      {error && <p className="text-coral text-sm mb-4">{error}</p>}
      {!entries && <p className="text-muted text-sm">순위 불러오는 중...</p>}
      {entries?.length === 0 && <p className="text-muted text-sm">아직 참가 기록이 없어요.</p>}

      <ol className="flex flex-col gap-2">
        {entries?.map((e, i) => (
          <li
            key={e.uid}
            className={`bg-panel border rounded-key px-4 py-3 flex items-center gap-4 ${
              e.uid === currentUser?.uid ? 'border-keycap/50' : 'border-white/10'
            }`}
          >
            <span className={`font-display text-xl w-8 ${i < 3 ? 'text-keycap' : 'text-muted'}`}>{i + 1}</span>
            <span className="flex-1 text-sm">
              {e.grade}학년 {e.classNum}반 {e.name}
            </span>
            <span className="font-mono text-xs text-muted">최고 {e.bestCpm}타 · {e.daysParticipated}일</span>
            <span className="font-mono text-sm text-mint">{e.score}점</span>
          </li>
        ))}
      </ol>

      {canManage && (
        <button
          onClick={handleDelete}
          className="mt-8 text-xs px-4 py-2 rounded-key border border-coral text-coral hover:bg-coral hover:text-ink transition-colors"
        >
          대회 삭제
        </button>
      )}
    </div>
  )
}
