import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { STAGES } from '../utils/stages'
import { maskName } from '../utils/maskName'

const STAGE_ICON = { word: '📝', sentence: '📄', long: '📚' }

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

      <div className="grid grid-cols-2 gap-3 mb-6">
        <CategoryCard
          active={category === 'speed'}
          onClick={() => setCategory('speed')}
          icon="⌨️"
          label="타자 랭킹"
        />
        <CategoryCard
          active={category === 'passion'}
          onClick={() => setCategory('passion')}
          icon="🔥"
          label="열정 점수"
        />
      </div>

      {category === 'speed' && (
        <div className="bg-panel border border-white/10 rounded-2xl p-4 mb-6">
          <div className="flex bg-ink rounded-key p-1 mb-4">
            <SegmentButton active={type === 'korean'} onClick={() => setType('korean')} icon="⌨️" label="한타" />
            <SegmentButton active={type === 'english'} onClick={() => setType('english')} icon="🔤" label="영타" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {STAGES.filter((s) => s.id !== 'home').map((s) => (
              <button
                key={s.id}
                onClick={() => setStage(s.id)}
                className={`key flex flex-col items-center gap-1 py-3 rounded-key text-xs font-semibold transition-colors ${
                  stage === s.id
                    ? 'bg-keycap text-ink'
                    : 'bg-ink border border-white/10 text-paper/70 hover:border-keycap/40'
                }`}
              >
                <span className="text-lg">{STAGE_ICON[s.id]}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
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
              {row.grade}학년 {row.classNum}반 {maskName(row.name)}
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

function CategoryCard({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`key flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold border transition-colors ${
        active
          ? 'bg-keycap text-ink border-keycap'
          : 'bg-panel border-white/10 text-paper/70 hover:border-keycap/40'
      }`}
    >
      <span className="text-xl">{icon}</span>
      {label}
    </button>
  )
}

function SegmentButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-key text-sm font-semibold transition-colors ${
        active ? 'bg-keycap text-ink' : 'text-paper/60'
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  )
}
