import { KEY_TO_JAMO, FINGER_MAP } from '../utils/keyboardLayout'

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
]

const HAND_FINGERS = {
  left: ['L4', 'L3', 'L2', 'L1'],
  right: ['R1', 'R2', 'R3', 'R4'],
}
const FINGER_NAME = { L4: '새끼', L3: '약지', L2: '중지', L1: '검지', R1: '검지', R2: '중지', R3: '약지', R4: '새끼' }

// mode: 'korean' | 'english', activeKey: 물리 키(소문자, 'space' 포함), needsShift: 쌍자음 여부
// activeKeys: 여러 키를 한 번에 강조하고 싶을 때(레슨 미리보기 등) 사용, 있으면 activeKey보다 우선
// compact: 레슨 카드 미리보기처럼 작게 보여줄 때, 손가락 안내는 생략됩니다
export default function VirtualKeyboard({ mode, activeKey, needsShift, activeKeys, compact = false }) {
  const isActive = (k) => (activeKeys ? activeKeys.includes(k) : k === activeKey)
  const activeFinger = !activeKeys && activeKey ? FINGER_MAP[activeKey] : null
  const keySize = compact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
  const gap = compact ? 'gap-1' : 'gap-1.5'
  const padStep = compact ? 10 : 14

  return (
    <div className={`${compact ? 'mt-2' : 'mt-4'} select-none`}>
      <div className={`flex flex-col ${gap} items-center`}>
        {ROWS.map((row, i) => (
          <div key={i} className={`flex ${gap}`} style={{ paddingLeft: `${i * padStep}px` }}>
            {row.map((k) => {
              const active = isActive(k)
              const label = mode === 'korean' ? KEY_TO_JAMO[k] || k : k
              return (
                <div
                  key={k}
                  className={`key ${keySize} flex items-center justify-center rounded-key font-mono border ${
                    active
                      ? 'bg-keycap text-ink border-keycap'
                      : 'bg-ink text-muted border-white/10'
                  }`}
                >
                  {label}
                </div>
              )
            })}
          </div>
        ))}
        {!compact && (
          <div className="flex gap-1.5 items-center">
            {needsShift && (
              <div className="key h-8 px-3 flex items-center justify-center rounded-key text-[10px] font-mono border bg-keycap text-ink border-keycap">
                Shift
              </div>
            )}
            <div
              className={`key h-8 w-40 flex items-center justify-center rounded-key text-xs font-mono border ${
                isActive('space')
                  ? 'bg-keycap text-ink border-keycap'
                  : 'bg-ink text-muted border-white/10'
              }`}
            >
              space
            </div>
          </div>
        )}
      </div>

      {/* 가상 손: 어느 손가락으로 눌러야 하는지 안내 (미리보기 모드에서는 생략) */}
      {!compact && (
        <div className="flex justify-center gap-10 mt-3">
          <Hand side="left" activeFinger={activeFinger} />
          <Hand side="right" activeFinger={activeFinger} />
        </div>
      )}
    </div>
  )
}

function Hand({ side, activeFinger }) {
  const fingers = HAND_FINGERS[side]
  const heights = side === 'left' ? [28, 36, 40, 36] : [36, 40, 36, 28]
  return (
    <div className="flex items-end gap-1">
      {fingers.map((f, i) => {
        const active = f === activeFinger
        return (
          <div
            key={f}
            title={`${side === 'left' ? '왼손' : '오른손'} ${FINGER_NAME[f]}`}
            className={`w-4 rounded-t-full rounded-b-sm transition-colors ${
              active ? 'bg-keycap' : 'bg-white/15'
            }`}
            style={{ height: `${heights[i]}px` }}
          />
        )
      })}
    </div>
  )
}
