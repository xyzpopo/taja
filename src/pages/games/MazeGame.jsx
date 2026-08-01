import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const SIZES = { easy: 9, normal: 13, hard: 17 }

function generateMaze(size) {
  // 각 셀은 top/right/bottom/left 벽 정보를 가집니다. 재귀 백트래킹(DFS)으로 통로를 뚫습니다.
  const cells = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ top: true, right: true, bottom: true, left: true, visited: false })),
  )

  const stack = [[0, 0]]
  cells[0][0].visited = true

  const DIRS = [
    { dr: -1, dc: 0, wall: 'top', opposite: 'bottom' },
    { dr: 0, dc: 1, wall: 'right', opposite: 'left' },
    { dr: 1, dc: 0, wall: 'bottom', opposite: 'top' },
    { dr: 0, dc: -1, wall: 'left', opposite: 'right' },
  ]

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1]
    const neighbors = []
    for (const d of DIRS) {
      const nr = r + d.dr
      const nc = c + d.dc
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !cells[nr][nc].visited) {
        neighbors.push({ nr, nc, ...d })
      }
    }
    if (neighbors.length === 0) {
      stack.pop()
      continue
    }
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)]
    cells[r][c][pick.wall] = false
    cells[pick.nr][pick.nc][pick.opposite] = false
    cells[pick.nr][pick.nc].visited = true
    stack.push([pick.nr, pick.nc])
  }

  return cells
}

export default function MazeGame() {
  const [difficulty, setDifficulty] = useState('easy')
  const size = SIZES[difficulty]
  const [maze, setMaze] = useState(() => generateMaze(SIZES.easy))
  const [pos, setPos] = useState({ r: 0, c: 0 })
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [won, setWon] = useState(false)

  function newMaze(nextDifficulty = difficulty) {
    setMaze(generateMaze(SIZES[nextDifficulty]))
    setPos({ r: 0, c: 0 })
    setStartTime(null)
    setElapsed(0)
    setWon(false)
  }

  function handleDifficultyChange(next) {
    setDifficulty(next)
    newMaze(next)
  }

  useEffect(() => {
    if (won || !startTime) return
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 250)
    return () => clearInterval(timer)
  }, [startTime, won])

  const move = useCallback(
    (dr, dc, wallKey) => {
      if (won) return
      setPos((prev) => {
        const cell = maze[prev.r][prev.c]
        if (cell[wallKey]) return prev // 벽 막힘
        const nr = prev.r + dr
        const nc = prev.c + dc
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) return prev
        if (startTime === null) setStartTime(Date.now())
        if (nr === size - 1 && nc === size - 1) setWon(true)
        return { r: nr, c: nc }
      })
    },
    [maze, size, won, startTime],
  )

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'ArrowUp') move(-1, 0, 'top')
      else if (e.key === 'ArrowDown') move(1, 0, 'bottom')
      else if (e.key === 'ArrowLeft') move(0, -1, 'left')
      else if (e.key === 'ArrowRight') move(0, 1, 'right')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [move])

  const cellPx = size <= 9 ? 32 : size <= 13 ? 26 : 20

  const grid = useMemo(
    () => (
      <div
        className="relative bg-ink border-2 border-white/20 mx-auto"
        style={{ width: size * cellPx, height: size * cellPx }}
      >
        {maze.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="absolute box-border"
              style={{
                top: r * cellPx,
                left: c * cellPx,
                width: cellPx,
                height: cellPx,
                borderTop: cell.top ? '2px solid #F6F4EF' : 'none',
                borderRight: cell.right ? '2px solid #F6F4EF' : 'none',
                borderBottom: cell.bottom ? '2px solid #F6F4EF' : 'none',
                borderLeft: cell.left ? '2px solid #F6F4EF' : 'none',
              }}
            >
              {r === size - 1 && c === size - 1 && (
                <div className="w-full h-full flex items-center justify-center text-mint text-xs">🏁</div>
              )}
            </div>
          )),
        )}
        <div
          className="absolute bg-keycap rounded-full transition-all duration-100"
          style={{
            width: cellPx * 0.6,
            height: cellPx * 0.6,
            top: pos.r * cellPx + cellPx * 0.2,
            left: pos.c * cellPx + cellPx * 0.2,
          }}
        />
      </div>
    ),
    [maze, pos, size, cellPx],
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/games" className="text-xs text-muted hover:text-keycap mb-4 inline-block">
        ← 두뇌 게임 메뉴로
      </Link>
      <h1 className="font-display text-3xl text-keycap mb-1">미로찾기</h1>
      <p className="text-muted text-sm mb-6">화살표 키 또는 아래 버튼으로 🟡을 🏁까지 이동시켜보세요.</p>

      <div className="flex gap-2 mb-6">
        {Object.keys(SIZES).map((d) => (
          <button
            key={d}
            onClick={() => handleDifficultyChange(d)}
            className={`key px-4 py-2 rounded-key text-sm font-semibold ${
              difficulty === d ? 'bg-keycap text-ink' : 'bg-panel text-paper/70 border border-white/10'
            }`}
          >
            {d === 'easy' ? '쉬움' : d === 'normal' ? '보통' : '어려움'}
          </button>
        ))}
      </div>

      <p className="text-center font-mono text-sm text-muted mb-4">⏱ {elapsed}초</p>

      {grid}

      {won && (
        <div className="mt-6 text-center">
          <p className="text-mint font-display text-xl mb-3">도착! {elapsed}초 걸렸어요 🎉</p>
          <button
            onClick={() => newMaze()}
            className="key bg-keycap text-ink font-semibold px-4 py-2 rounded-key"
          >
            다시하기
          </button>
        </div>
      )}

      {!won && (
        <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto mt-6 select-none">
          <div />
          <DirButton label="↑" onClick={() => move(-1, 0, 'top')} />
          <div />
          <DirButton label="←" onClick={() => move(0, -1, 'left')} />
          <DirButton label="↓" onClick={() => move(1, 0, 'bottom')} />
          <DirButton label="→" onClick={() => move(0, 1, 'right')} />
        </div>
      )}
    </div>
  )
}

function DirButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="key bg-panel border border-white/15 text-paper text-xl py-3 rounded-key active:bg-keycap active:text-ink"
    >
      {label}
    </button>
  )
}
