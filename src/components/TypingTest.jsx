import { useEffect, useMemo, useRef, useState } from 'react'
import { calcAccuracy, calcCpm, countKeystrokes } from '../utils/typingUtils'
import { charToJamoSequence, unitToKey, unitNeedsShift, partialJamoCount } from '../utils/keyboardLayout'
import VirtualKeyboard from './VirtualKeyboard'

const COUNTDOWN_START = 3

// type: 'korean' | 'english', texts: string[], onFinish: (result) => void, showKeyboard?: boolean
export default function TypingTest({ type, texts, onFinish, showKeyboard = false }) {
  const [target, setTarget] = useState(() => pickRandom(texts))
  const [typed, setTyped] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [result, setResult] = useState(null)
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [composingCount, setComposingCount] = useState(0)
  const inputRef = useRef(null)

  const phase = countdown > 0 ? 'countdown' : result ? 'done' : 'typing'

  useEffect(() => {
    setCountdown(COUNTDOWN_START)
  }, [target])

  useEffect(() => {
    if (countdown <= 0) {
      inputRef.current?.focus()
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 800)
    return () => clearTimeout(timer)
  }, [countdown])

  // 새 글자로 넘어가면 자모 조합 진행 상태를 초기화합니다.
  useEffect(() => {
    setComposingCount(0)
  }, [typed.length])

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
  }

  function handleCompositionStart() {
    setComposingCount(0)
  }

  function handleCompositionUpdate(e) {
    if (type !== 'korean') return
    setComposingCount(partialJamoCount(e.data))
  }

  function handleChange(e) {
    if (result || phase === 'countdown') return
    const value = e.target.value
    if (startTime === null && value.length > 0) setStartTime(Date.now())
    setTyped(value)

    if (value.length >= target.length) {
      const elapsedMs = Date.now() - (startTime ?? Date.now())
      const keystrokes = countKeystrokes(target)
      const accuracy = calcAccuracy(target, value)
      const cpm = calcCpm(keystrokes, elapsedMs)
      const finalResult = { type, accuracy, cpm, target, elapsedMs }
      setResult(finalResult)
      onFinish?.(finalResult)
    }
  }

  function handleRestart() {
    setTarget(pickRandom(texts))
    setTyped('')
    setStartTime(null)
    setResult(null)
    setComposingCount(0)
  }

  const chars = useMemo(() => target.split(''), [target])

  // 다음에 눌러야 할 키 하나를 계산합니다. 한글은 초성/중성/종성을 순서대로,
  // 영문은 다음 글자를 그대로 가리킵니다.
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
      <div
        className={`font-mono text-lg sm:text-xl leading-relaxed tracking-wide mb-6 select-none ${
          phase === 'countdown' ? 'opacity-30' : ''
        }`}
      >
        {chars.map((ch, i) => {
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
        })}
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onCompositionStart={handleCompositionStart}
          onCompositionUpdate={handleCompositionUpdate}
          disabled={!!result || phase === 'countdown'}
          placeholder={type === 'korean' ? '여기에 문장을 입력하세요 (한글)' : 'Type the sentence here'}
          className="w-full bg-ink border border-white/15 rounded-key px-4 py-3 font-mono text-lg text-paper focus:outline-none focus:border-keycap disabled:opacity-50"
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

      {showKeyboard && phase !== 'done' && (
        <VirtualKeyboard mode={type} activeKey={activeKey} needsShift={needsShift} />
      )}

      {result && (
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ResultBadge label="정확도" value={`${result.accuracy}%`} />
          <ResultBadge label="분당 타수" value={`${result.cpm}타`} />
          <span className="font-mono text-sm text-muted">
            [{type === 'korean' ? '한타' : '영타'},{result.accuracy}%,{result.cpm}타]
          </span>
          <button
            onClick={handleRestart}
            className="key ml-auto bg-keycap text-ink font-semibold px-4 py-2 rounded-key"
          >
            다시하기
          </button>
        </div>
      )}
    </div>
  )
}

function ResultBadge({ label, value }) {
  return (
    <div className="key bg-ink border border-white/10 px-4 py-2 rounded-key text-center">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="font-display text-xl text-keycap">{value}</div>
    </div>
  )
}
