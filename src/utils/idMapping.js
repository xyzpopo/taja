// 학년(1자리) + 반(2자리) + 번호(2자리) => xxxxx@yongin.com
// 예) 1학년 1반 14번 -> 10114@yongin.com
// 교사 계정은 "번호" 자리에 숫자 대신 선생님을 의미하는 표시를 쓰고,
// 내부적으로는 t + 학년 + 반 형태의 이메일로 저장합니다. (담임 학급 기준 1교사 1계정)

export const DOMAIN = '@yongin.com'
export const TEACHER_MARK = '선생'

export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function isValidGrade(grade) {
  const g = Number(grade)
  return Number.isInteger(g) && g >= 1 && g <= 3
}

export function isValidClassNum(classNum) {
  return /^\d{1,2}$/.test(String(classNum)) && Number(classNum) >= 1 && Number(classNum) <= 99
}

export function isValidNumber(number) {
  return /^\d{1,2}$/.test(String(number)) && Number(number) >= 1 && Number(number) <= 99
}

// 학생 계정 이메일 생성
export function studentToEmail(grade, classNum, number) {
  return `${grade}${pad2(classNum)}${pad2(number)}${DOMAIN}`
}

// 학년/반/번호를 문서 ID로 쓸 수 있는 5자리 키로 변환 (이메일 접두어와 동일한 규칙).
// 학년변경 요청 문서의 ID로 사용해서, 같은 자리(학년,반,번호)에 대한 동시 중복 요청을
// Firestore 규칙만으로 막을 수 있게 합니다.
export function slotKey(grade, classNum, number) {
  return `${grade}${pad2(classNum)}${pad2(number)}`
}

// 교사(담임) 계정 이메일 생성 - 학년+반 조합으로 유일함
export function teacherToEmail(grade, classNum) {
  return `t${grade}${pad2(classNum)}${DOMAIN}`
}

// 로그인/가입 폼에서 입력값으로 최종 이메일과 메타데이터를 만들어주는 헬퍼
export function buildAccountFromForm({ grade, classNum, number, name }) {
  if (!isValidGrade(grade)) {
    throw new Error('학년은 1~3 중에서 선택해주세요.')
  }
  if (!isValidClassNum(classNum)) {
    throw new Error('반은 숫자 1~2자리(01~99)로 입력해주세요.')
  }

  const isTeacher = String(number).trim() === TEACHER_MARK

  if (isTeacher) {
    return {
      role: 'teacher',
      email: teacherToEmail(grade, classNum),
      grade: Number(grade),
      classNum: Number(classNum),
      number: null,
      name,
    }
  }

  if (!isValidNumber(number)) {
    throw new Error('번호는 숫자 1~2자리(01~99)로 입력하거나, 선생님은 "선생"이라고 입력해주세요.')
  }

  return {
    role: 'student',
    email: studentToEmail(grade, classNum, number),
    grade: Number(grade),
    classNum: Number(classNum),
    number: Number(number),
    name,
  }
}
