import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { STAGES } from '../utils/stages'

export default function Ranking() {
  const [category, setCategory] = useState('speed') // 'speed' | 'passion'
  const [type, setType] = useState('korean')
  const [stage, setStage] = useState('sentence')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setRows(null)
      try {
        if (category === 'speed') {
          const q = query(
            collection(db, 'bestScores'),
            where('type', '==', type),
            where('stage', '==', stage),
            orderBy('cpm', 'desc'),
            limit(20),
          )
          const snap = await getDocs(q)
          setRows(snap.docs.map((d) => d.data()))
        } else {
          const q = query(collection(db, 'passionScores'), orderBy('streakCount', 'desc'), limit(20))
          const snap = await getDocs(q)
          setRows(snap.docs.map((d) => d.data()))
        }
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [category, type, stage])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-keycap mb-1">랭킹</h1>
      <p className="text-muted text-sm mb-6">
        {category === 'speed' ? '분당 타수 기준 상위 기록입니다.' : '며칠 연속으로 꾸준히 연습했는지 보여줘요.'}
      </p>

      <div className="flex gap-2 mb-3">
        <TabButton active={category === 'speed'} onClick={() => setCategory('speed')} label="타자 랭킹" />
        <TabButton active={category === 'passion'} onClick={() => setCategory('passion')} label="🔥 열정 점수" />
      </div>

      {category === 'speed' && (
        <>
          <div className="flex gap-2 mb-3">
            <TabButton active={type === 'korean'} onClick={() => setType('korean')} label="한타" small />
            <TabButton active={type === 'english'} onClick={() => setType('english')} label="영타" small />
          </div>
          <div className="flex gap-2 mb-6 flex-wrap">
            {STAGES.filter((s) => s.id !== 'home').map((s) => (
              <TabButton key={s.id} active={stage === s.id} onClick={() => setStage(s.id)} label={s.label} small />
            ))}
          </div>
        </>
      )}

      {error && <p className="text-coral text-sm">{error}</p>}
      {!rows && !error && <p className="text-muted text-sm">불러오는 중...</p>}
      {rows?.length === 0 && <p className="text-muted text-sm">아직 기록이 없어요.</p>}

      <ol className="flex flex-col gap-2">
        {rows?.map((row, i) => (
          <li
            key={row.uid}
            className="bg-panel border border-white/10 rounded-key px-4 py-3 flex items-center gap-4"
          >
            <span className={`font-display text-xl w-8 ${i < 3 ? 'text-keycap' : 'text-muted'}`}>
              {i + 1}
            </span>
            <span className="flex-1 text-sm">
              {row.grade}학년 {row.classNum}반 {row.name}
            </span>
            {category === 'speed' ? (
              <>
                <span className="font-mono text-sm text-mint">{row.cpm}타</span>
                <span className="font-mono text-xs text-muted">{row.accuracy}%</span>
              </>
            ) : (
              <span className="font-mono text-sm text-mint">🔥 {row.streakCount}일</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

function TabButton({ active, onClick, label, small }) {
  return (
    <button
      onClick={onClick}
      className={`key rounded-key font-semibold ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} ${
        active ? 'bg-keycap text-ink' : 'bg-panel text-paper/70 border border-white/10'
      }`}
    >
      {label}
    </button>
  )
}
