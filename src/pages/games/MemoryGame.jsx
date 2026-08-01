import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const TILES = [
  { id: 0, color: 'bg-coral', active: 'bg-coral brightness-150' },
  { id: 1, color: 'bg-keycap', active: 'bg-keycap brightness-150' },
  { id: 2, color: 'bg-mint', active: 'bg-mint brightness-150' },
  { id: 3, color: 'bg-blue-400', active: 'bg-blue-300 brightness-150' },
]

export default function MemoryGame() {
  const [sequence, setSequence] = useState([])
  const [playerStep, setPlayerStep] = useState(0)
  const [activeTile, setActiveTile] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | showing | input | gameover
  const [best, setBest] = useState(() => Number(localStorage.getItem('memoryBest') || 0))
  const timeoutRef = useRef(null)

  function start() {
    const first = [Math.floor(Math.random() * 4)]
    setSequence(first)
    setPlayerStep(0)
    setPhase('showing')
  }

  useEffect(() => {
    if (phase !== 'showing') return
    let i = 0
    function showNext() {
      if (i >= sequence.length) {
        setActiveTile(null)
        setPhase('input')
        return
      }
      setActiveTile(sequence[i])
      timeoutRef.current = setTimeout(() => {
        setActiveTile(null)
        timeoutRef.current = setTimeout(() => {
          i++
          showNext()
        }, 200)
      }, 500)
    }
    showNext()
    return () => clearTimeout(timeoutRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sequence])

  function handleTileClick(id) {
    if (phase !== 'input') return
    if (id === sequence[playerStep]) {
      if (playerStep + 1 === sequence.length) {
        // 한 라운드 성공, 다음 라운드로
        const next = [...sequence, Math.floor(Math.random() * 4)]
        setSequence(next)
        setPlayerStep(0)
        setPhase('showing')
      } else {
        setPlayerStep((s) => s + 1)
      }
    } else {
      const score = sequence.length - 1
      if (score > best) {
        setBest(score)
        localStorage.setItem('memoryBest', String(score))
      }
      setPhase('gameover')
    }
  }

  const score = phase === 'gameover' ? sequence.length - 1 : sequence.length

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <Link to="/games" className="text-xs text-muted hover:text-keycap mb-4 inline-block">
        ← 두뇌 게임 메뉴로
      </Link>
      <h1 className="font-display text-3xl text-keycap mb-1">순서기억</h1>
      <p className="text-muted text-sm mb-6">불이 켜지는 순서를 잘 보고, 같은 순서로 눌러보세요.</p>

      <div className="flex justify-center gap-4 mb-6 text-sm">
        <span className="text-muted">현재 단계: <span className="text-keycap font-semibold">{score}</span></span>
        <span className="text-muted">최고 기록: <span className="text-mint font-semibold">{best}</span></span>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-6">
        {TILES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTileClick(t.id)}
            disabled={phase !== 'input'}
            className={`h-28 rounded-2xl transition-all ${activeTile === t.id ? t.active : t.color} ${
              phase === 'input' ? 'opacity-100' : 'opacity-70'
            } disabled:cursor-not-allowed`}
          />
        ))}
      </div>

      <div className="text-center">
        {phase === 'idle' && (
          <button onClick={start} className="key bg-keycap text-ink font-semibold px-5 py-2.5 rounded-key">
            시작하기
          </button>
        )}
        {phase === 'showing' && <p className="text-muted text-sm">잘 보세요...</p>}
        {phase === 'input' && <p className="text-keycap text-sm">순서대로 눌러보세요!</p>}
        {phase === 'gameover' && (
          <>
            <p className="text-coral font-display text-xl mb-3">게임 종료! {sequence.length - 1}단계까지 성공</p>
            <button onClick={start} className="key bg-keycap text-ink font-semibold px-5 py-2.5 rounded-key">
              다시하기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
