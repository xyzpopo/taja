import { useEffect, useMemo, useRef, useState } from 'react'
import { countKeystrokes } from '../utils/typingUtils'
import { charToJamoSequence, unitToKey, unitNeedsShift, partialJamoCount } from '../utils/keyboardLayout'
import VirtualKeyboard from './VirtualKeyboard'

const COUNTDOWN_START = 3

// type: 'korean' | 'english', items: string[] (한 세션에 나올 문제들, 순서대로),
// onFinish: (result) => void, onRestart: () => void, showKeyboard?: boolean, trackSpeed?: boolean,
// autoAdvance?: boolean (true면 스페이스/엔터 없이 한 글자 다 쓰는 즉시 다음 문제로 - 자리연습용)
export default function TypingCarousel({
  type,
  items,
  onFinish,
  onRestart,
  showKeyboard = false,
  trackSpeed = true,
  autoAdvance = false,
}) {
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [composingCount, setComposingCount] = useState(0)
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [done, setDone] = useState(false)
  const [finalResult, setFinalResult] = useState(null)
  const inputRef = useRef(null)

  // 세션 전체 누적치 (ref로 들고 있다가 끝날 때 한 번만 계산)
  const statsRef = useRef({ keystrokes: 0, correctChars: 0, typedChars: 0 })
  const startTimeRef = useRef(null)

  const phase = countdown > 0 ? 'countdown' : done ? 'done' : 'typing'
  const target = items[index] ?? ''

  useEffect(() => {
    if (countdown <= 0) {
      inputRef.current?.focus()
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 800)
    return () => clearTimeout(timer)
  }, [countdown])

  useEffect(() => {
    setComposingCount(0)
    inputRef.current?.focus()
  }, [index])

  // 같은 문제(단어/문장) 안에서 다음 글자로 넘어갈 때도 자모 진행 상태를 초기화해야
  // 새 글자의 자모가 처음부터 순서대로 강조됩니다. (안 그러면 이전 글자에서 쌓인 값이
  // 그대로 남아 다음 글자의 마지막 자모부터 강조되는 버그가 있었습니다)
  useEffect(() => {
    setComposingCount(0)
  }, [typed.length])

  function handleCompositionStart() {
    setComposingCount(0)
  }

  function handleCompositionUpdate(e) {
    if (type !== 'korean') return
    setComposingCount(partialJamoCount(e.data))
  }

  function handleChange(e) {
    if (phase !== 'typing') return
    const value = e.target.value
    if (startTimeRef.current === null && value.length > 0) startTimeRef.current = Date.now()
    setTyped(value)

    if (autoAdvance && value.length >= target.length) {
      commitCurrentItem(value)
    }
  }

  function commitCurrentItem(typedValue = typed) {
    const keystrokes = countKeystrokes(target)
    let correct = 0
    for (let i = 0; i < target.length; i++) {
      if (typedValue[i] === target[i]) correct++
    }
    statsRef.current.keystrokes += keystrokes
    statsRef.current.correctChars += correct
    statsRef.current.typedChars += typedValue.length

    if (index >= items.length - 1) {
      const elapsedMs = Date.now() - (startTimeRef.current ?? Date.now())
      const { keystrokes: totalKeystrokes, correctChars, typedChars } = statsRef.current
      const accuracy = typedChars > 0 ? Math.max(0, Math.min(100, Math.round((correctChars / typedChars) * 100))) : 0
      let cpm = null
      if (trackSpeed) {
        const minutes = Math.max(elapsedMs, 1) / 60000
        cpm = Math.round(totalKeystrokes / minutes)
      }
      const result = { type, accuracy, cpm, elapsedMs, itemCount: items.length, trackSpeed }
      setFinalResult(result)
      setDone(true)
      onFinish?.(result)
    } else {
      setIndex((i) => i + 1)
      setTyped('')
    }
  }

  function handleKeyDown(e) {
    if (phase !== 'typing') return
    const complete = typed.length >= target.length
    if (e.key === 'Enter') {
      e.preventDefault()
      if (complete) commitCurrentItem()
    } else if (e.key === ' ') {
      if (complete) {
        e.preventDefault()
        commitCurrentItem()
      }
      // 아직 다 안 썼으면(문장 중간 띄어쓰기 등) 스페이스는 평소처럼 입력됩니다.
    }
  }

  function handleRestart() {
    setIndex(0)
    setTyped('')
    setComposingCount(0)
    setDone(false)
    setFinalResult(null)
    setCountdown(COUNTDOWN_START)
    statsRef.current = { keystrokes: 0, correctChars: 0, typedChars: 0 }
    startTimeRef.current = null
    onRestart?.()
  }

  const prevItem = index > 0 ? items[index - 1] : null
  const nextItem = index < items.length - 1 ? items[index + 1] : null

  const activeUnit = useMemo(() => {
    if (!showKeyboard || phase !== 'typing') return null
    const nextChar = target[typed.length]
    if (nextChar === undefined) return null
    if (type === 'korean') {
      const seq = charToJamoSequence(nextChar)
      return seq[Math.min(composingCount, seq.length - 1)]
    }
    return nextChar === ' ' ? 'space' : nextChar
  }, [showKeyboard, phase, target, typed.length, type, composingCount])

  const activeKey = activeUnit ? unitToKey(activeUnit) : null
  const needsShift = activeUnit ? unitNeedsShift(activeUnit) : false

  return (
    <div className="bg-panel border border-white/10 rounded-2xl p-6 sm:p-8 relative">
      <p className="text-center text-xs text-muted mb-4">
        {Math.min(index + 1, items.length)} / {items.length}
      </p>

      {phase !== 'done' && (
        <div className="flex items-center justify-center gap-4 mb-6 select-none">
          <div className="flex-1 text-right text-lg sm:text-xl text-muted/50 font-mono truncate">
            {prevItem ?? ''}
          </div>
          <div key={index} className="carousel-center font-mono text-2xl sm:text-4xl font-semibold px-4">
            {renderTarget(target, typed)}
          </div>
          <div className="flex-1 text-left text-lg sm:text-xl text-muted/50 font-mono truncate">
            {nextItem ?? ''}
          </div>
        </div>
      )}

      {phase !== 'done' && (
        <div className="relative max-w-sm mx-auto">
          <input
            key={index}
            ref={inputRef}
            value={typed}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionUpdate={handleCompositionUpdate}
            disabled={phase === 'countdown'}
            maxLength={target.length}
            placeholder={type === 'korean' ? '입력...' : 'type...'}
            className="w-full bg-ink border border-white/15 rounded-key px-4 py-3 font-mono text-lg text-paper text-center focus:outline-none focus:border-keycap disabled:opacity-50"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {phase === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/70 rounded-key">
              <span className="font-display text-5xl text-keycap">{countdown}</span>
            </div>
          )}
        </div>
      )}

      {phase === 'typing' && !autoAdvance && (
        <p className="text-center text-[11px] text-muted mt-3">
          다 쓰면 스페이스 또는 엔터로 다음 문제로 넘어가요
        </p>
      )}

      {showKeyboard && phase === 'typing' && (
        <VirtualKeyboard mode={type} activeKey={activeKey} needsShift={needsShift} />
      )}

      {phase === 'done' && finalResult && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <ResultBadge label="정확도" value={`${finalResult.accuracy}%`} />
          {trackSpeed && <ResultBadge label="분당 타수" value={`${finalResult.cpm}타`} />}
          <span className="font-mono text-sm text-muted">
            {trackSpeed
              ? `[${type === 'korean' ? '한타' : '영타'},${finalResult.accuracy}%,${finalResult.cpm}타]`
              : `[${type === 'korean' ? '한타' : '영타'},${finalResult.accuracy}%]`}
          </span>
          <button
            onClick={handleRestart}
            className="key bg-keycap text-ink font-semibold px-4 py-2 rounded-key"
          >
            다시하기
          </button>
        </div>
      )}
    </div>
  )
}

function renderTarget(target, typed) {
  return target.split('').map((ch, i) => {
    let color = 'text-muted'
    if (i < typed.length) {
      color = typed[i] === ch ? 'text-mint' : 'text-coral'
    } else if (i === typed.length) {
      color = 'text-keycap'
    }
    return (
      <span key={i} className={color}>
        {ch}
      </span>
    )
  })
}

function ResultBadge({ label, value }) {
  return (
    <div className="key bg-ink border border-white/10 px-4 py-2 rounded-key text-center">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="font-display text-xl text-keycap">{value}</div>
    </div>
  )
}
