// 표준 2벌식 키보드 배열입니다 (KS X 5002). 자모 하나가 눌러야 할 물리 키 하나에 대응합니다.
// 참고: 이 매핑은 공개된 키보드 표준이며 저작권과 무관합니다.
export const JAMO_TO_KEY = {
  ㅂ: 'q', ㅈ: 'w', ㄷ: 'e', ㄱ: 'r', ㅅ: 't', ㅛ: 'y', ㅕ: 'u', ㅑ: 'i', ㅐ: 'o', ㅔ: 'p',
  ㅁ: 'a', ㄴ: 's', ㅇ: 'd', ㄹ: 'f', ㅎ: 'g', ㅗ: 'h', ㅓ: 'j', ㅏ: 'k', ㅣ: 'l',
  ㅋ: 'z', ㅌ: 'x', ㅊ: 'c', ㅍ: 'v', ㅠ: 'b', ㅜ: 'n', ㅡ: 'm',
  // 쌍자음(Shift + 기본 키)
  ㅃ: 'q', ㅉ: 'w', ㄸ: 'e', ㄲ: 'r', ㅆ: 't',
}

// Shift와 함께 입력해야 하는 자모(쌍자음)
export const SHIFT_JAMO = new Set(['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ'])

// 물리 키 -> 화면에 보여줄 한글 자모 라벨 (기본형 기준)
export const KEY_TO_JAMO = {
  q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ', y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
  a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ', h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
  z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
}

// 손가락 배정 (표준 터치타이핑 기준). L/R + 1(검지)~4(새끼)
export const FINGER_MAP = {
  q: 'L4', a: 'L4', z: 'L4',
  w: 'L3', s: 'L3', x: 'L3',
  e: 'L2', d: 'L2', c: 'L2',
  r: 'L1', f: 'L1', v: 'L1', t: 'L1', g: 'L1', b: 'L1',
  y: 'R1', h: 'R1', n: 'R1', u: 'R1', j: 'R1', m: 'R1',
  i: 'R2', k: 'R2', ',': 'R2',
  o: 'R3', l: 'R3', '.': 'R3',
  p: 'R4', ';': 'R4', '/': 'R4',
  space: 'thumb',
}

export const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
export const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']
export const JONG = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']

// 겹자모(쌍받침, 이중모음 등)는 두 개 이상의 실제 키 입력으로 이루어지므로 그 구성 자모로 풀어줍니다.
const JAMO_SPLIT = {
  ㄳ: ['ㄱ','ㅅ'], ㄵ: ['ㄴ','ㅈ'], ㄶ: ['ㄴ','ㅎ'], ㄺ: ['ㄹ','ㄱ'], ㄻ: ['ㄹ','ㅁ'],
  ㄼ: ['ㄹ','ㅂ'], ㄽ: ['ㄹ','ㅅ'], ㄾ: ['ㄹ','ㅌ'], ㄿ: ['ㄹ','ㅍ'], ㅀ: ['ㄹ','ㅎ'], ㅄ: ['ㅂ','ㅅ'],
  ㅘ: ['ㅗ','ㅏ'], ㅙ: ['ㅗ','ㅐ'], ㅚ: ['ㅗ','ㅣ'], ㅝ: ['ㅜ','ㅓ'], ㅞ: ['ㅜ','ㅔ'], ㅟ: ['ㅜ','ㅣ'], ㅢ: ['ㅡ','ㅣ'],
}

function expand(jamo) {
  return JAMO_SPLIT[jamo] || [jamo]
}

// 완성형 한글 음절을 초성/중성(/종성)을 구성하는 낱개 자모 배열로 분해합니다.
// 예) '벗' -> ['ㅂ','ㅓ','ㅅ'], '값' -> ['ㄱ','ㅏ','ㅂ','ㅅ']
// 한글이 아니면 그 글자 자체를(공백은 'space') 하나짜리 배열로 돌려줍니다.
export function charToJamoSequence(ch) {
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const idx = code - 0xac00
    const cho = CHO[Math.floor(idx / (21 * 28))]
    const jung = JUNG[Math.floor((idx % (21 * 28)) / 28)]
    const jong = JONG[idx % 28]
    const seq = [...expand(cho), ...expand(jung)]
    if (jong) seq.push(...expand(jong))
    return seq
  }
  if (ch === ' ') return ['space']
  return [ch]
}

// 자모(또는 영문 글자/‘space’) 하나를 실제로 눌러야 할 물리 키로 변환합니다.
export function unitToKey(unit) {
  if (unit === 'space') return 'space'
  return JAMO_TO_KEY[unit] || unit.toLowerCase()
}

export function unitNeedsShift(unit) {
  return SHIFT_JAMO.has(unit)
}

// 한 글자를 순서대로 눌러야 할 물리 키 배열로 변환합니다. (참고/검증용)
export function charToKeys(ch) {
  return charToJamoSequence(ch).map(unitToKey)
}

// 조합 중인(완성되지 않은) 문자열을 보고 지금까지 입력된 자모 개수를 추정합니다.
// (input의 compositionupdate 이벤트에서 얻은 부분 조합 문자열을 넣어줍니다)
// 참고: 겹받침(예: 값)의 두 번째 자모까지 완성된 경우는 구분하지 못해 마지막 키가
// 한 프레임 더 강조되는 정도의 사소한 오차가 있을 수 있습니다.
export function partialJamoCount(str) {
  if (!str) return 0
  const ch = str[str.length - 1]
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const idx = code - 0xac00
    const jong = idx % 28
    return jong !== 0 ? 3 : 2
  }
  // 초성만 입력된, 아직 완성되지 않은 상태
  return 1
}

// 초성/중성/종성 자모로 완성형 음절 하나를 조합합니다. (자리연습 문제 생성용)
export function composeSyllable(choChar, jungChar, jongChar = '') {
  const choIdx = CHO.indexOf(choChar)
  const jungIdx = JUNG.indexOf(jungChar)
  const jongIdx = JONG.indexOf(jongChar)
  if (choIdx === -1 || jungIdx === -1 || jongIdx === -1) return null
  const code = 0xac00 + (choIdx * 21 + jungIdx) * 28 + jongIdx
  return String.fromCharCode(code)
}
