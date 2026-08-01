import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const EMOJI_SETS = {
  easy: ['🐶', '🐱', '🐰', '🐻', '🦊', '🐼'], // 6쌍 = 12장
  hard: ['🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐸', '🐵'], // 8쌍 = 16장
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(difficulty) {
  const emojis = EMOJI_SETS[difficulty]
  const pairs = shuffle([...emojis, ...emojis]).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }))
  return pairs
}

export default function CardMatchGame() {
  const [difficulty, setDifficulty] = useState('easy')
  const [deck, setDeck] = useState(() => buildDeck('easy'))
  const [selected, setSelected] = useState([])
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)

  const won = deck.every((c) => c.matched)

  function newGame(nextDifficulty = difficulty) {
    setDeck(buildDeck(nextDifficulty))
    setSelected([])
    setMoves(0)
    setLocked(false)
  }

  function handleDifficultyChange(next) {
    setDifficulty(next)
    newGame(next)
  }

  function handleCardClick(id) {
    if (locked || won) return
    const card = deck.find((c) => c.id === id)
    if (card.flipped || card.matched) return
    if (selected.length === 2) return

    const nextDeck = deck.map((c) => (c.id === id ? { ...c, flipped: true } : c))
    setDeck(nextDeck)
    const nextSelected = [...selected, id]
    setSelected(nextSelected)

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1)
      const [a, b] = nextSelected.map((sid) => nextDeck.find((c) => c.id === sid))
      if (a.emoji === b.emoji) {
        setTimeout(() => {
          setDeck((prev) => prev.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c)))
          setSelected([])
        }, 400)
      } else {
        setLocked(true)
        setTimeout(() => {
          setDeck((prev) => prev.map((c) => (c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c)))
          setSelected([])
          setLocked(false)
        }, 800)
      }
    }
  }

  const cols = difficulty === 'easy' ? 4 : 4

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <Link to="/games" className="text-xs text-muted hover:text-keycap mb-4 inline-block">
        ← 두뇌 게임 메뉴로
      </Link>
      <h1 className="font-display text-3xl text-keycap mb-1">카드 짝맞추기</h1>
      <p className="text-muted text-sm mb-6">카드 두 장을 뒤집어서 같은 그림을 찾아보세요.</p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['easy', 'hard'].map((d) => (
            <button
              key={d}
              onClick={() => handleDifficultyChange(d)}
              className={`key px-3 py-1.5 rounded-key text-xs font-semibold ${
                difficulty === d ? 'bg-keycap text-ink' : 'bg-panel text-paper/70 border border-white/10'
              }`}
            >
              {d === 'easy' ? '쉬움(6쌍)' : '어려움(8쌍)'}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">시도 횟수: {moves}</span>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {deck.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.matched}
            className={`aspect-square rounded-key text-2xl sm:text-3xl flex items-center justify-center border transition-colors ${
              card.flipped || card.matched
                ? 'bg-panel border-keycap/40'
                : 'bg-ink border-white/15 hover:border-white/30'
            } ${card.matched ? 'opacity-50' : ''}`}
          >
            {card.flipped || card.matched ? card.emoji : ''}
          </button>
        ))}
      </div>

      {won && (
        <div className="mt-6 text-center">
          <p className="text-mint font-display text-xl mb-3">전부 맞췄어요! {moves}번 만에 성공 🎉</p>
          <button onClick={() => newGame()} className="key bg-keycap text-ink font-semibold px-5 py-2.5 rounded-key">
            다시하기
          </button>
        </div>
      )}
    </div>
  )
}
