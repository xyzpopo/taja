import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { contestStatus } from '../utils/contests'
import { STAGES } from '../utils/stages'

const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.id, s.label]))
const STATUS_LABEL = { active: '진행중', upcoming: '예정', ended: '종료' }
const STATUS_COLOR = { active: 'text-mint', upcoming: 'text-keycap', ended: 'text-muted' }

export default function ContestsHome() {
  const { profile, isAdmin } = useAuth()
  const [contests, setContests] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'contests'))
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => ((a.startDate || '') < (b.startDate || '') ? 1 : -1))
        setContests(list)
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [])

  const canCreate = isAdmin || profile?.role === 'teacher'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl text-keycap">대회</h1>
        {canCreate && (
          <Link to="/contests/new" className="key bg-keycap text-ink font-semibold px-4 py-2 rounded-key text-sm">
            대회 만들기
          </Link>
        )}
      </div>
      <p className="text-muted text-sm mb-8">
        하루에 한 번만 기록이 반영돼요. 일주일 동안의 최고 분당타수 × 참여 일수로 순위를 매깁니다.
      </p>

      {error && <p className="text-coral text-sm mb-4">{error}</p>}
      {!contests && !error && <p className="text-muted text-sm">불러오는 중...</p>}
      {contests?.length === 0 && <p className="text-muted text-sm">아직 열린 대회가 없어요.</p>}

      <div className="flex flex-col gap-3">
        {contests?.map((c) => {
          const status = contestStatus(c)
          return (
            <Link
              key={c.id}
              to={`/contests/${c.id}`}
              className="bg-panel border border-white/10 rounded-2xl p-5 hover:border-keycap/40 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-display text-lg text-paper">{c.title}</p>
                <p className="text-xs text-muted mt-1">
                  {c.type === 'korean' ? '한타' : '영타'} · {STAGE_LABEL[c.stage]} · {c.startDate} ~ {c.endDate}
                </p>
              </div>
              <span className={`text-sm font-semibold ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
