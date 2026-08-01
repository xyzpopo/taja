import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { todayStr, addDays } from '../utils/dateUtils'

const STAGE_OPTIONS = [
  { id: 'word', label: '단어연습' },
  { id: 'sentence', label: '짧은글연습' },
  { id: 'long', label: '긴글연습' },
]

export default function ContestCreate() {
  const { profile, isAdmin, currentUser } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [type, setType] = useState('korean')
  const [stage, setStage] = useState('sentence')
  const [startDate, setStartDate] = useState(todayStr())
  const [scopeType, setScopeType] = useState('all')
  const [classList, setClassList] = useState([])
  const [newGrade, setNewGrade] = useState('1')
  const [newClassNum, setNewClassNum] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isTeacherCreator = !isAdmin && profile?.role === 'teacher'

  // 학생이 주소를 직접 입력해서 들어오는 경우를 막습니다 (교사/관리자만 개설 가능).
  if (!isAdmin && profile?.role !== 'teacher') {
    return <Navigate to="/contests" replace />
  }

  function addClass() {
    const classNum = Number(newClassNum)
    if (!classNum || classNum < 1 || classNum > 99) {
      setError('반은 1~99 사이 숫자로 입력해주세요.')
      return
    }
    const grade = Number(newGrade)
    if (classList.some((c) => c.grade === grade && c.classNum === classNum)) return
    setClassList((list) => [...list, { grade, classNum }])
    setNewClassNum('')
    setError('')
  }

  function removeClass(idx) {
    setClassList((list) => list.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('대회 이름을 입력해주세요.')

    let scopeTypeToSave = scopeType
    let scopeToSave = []

    if (isTeacherCreator) {
      scopeTypeToSave = 'classes'
      scopeToSave = [{ grade: profile.grade, classNum: profile.classNum }]
    } else {
      if (scopeType === 'classes') {
        if (classList.length === 0) return setError('학년/반을 하나 이상 추가해주세요.')
        scopeToSave = classList
      }
    }

    setSaving(true)
    try {
      const endDate = addDays(startDate, 6)
      await addDoc(collection(db, 'contests'), {
        title: title.trim(),
        type,
        stage,
        scopeType: scopeTypeToSave,
        scope: scopeToSave,
        startDate,
        endDate,
        createdBy: currentUser.uid,
        createdByName: isAdmin ? '관리자' : profile.name,
        createdByRole: isAdmin ? 'admin' : 'teacher',
        createdAt: serverTimestamp(),
      })
      navigate('/contests')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="font-display text-2xl text-keycap mb-1">대회 만들기</h1>
      <p className="text-muted text-sm mb-6">
        시작일로부터 7일간 진행돼요. 하루에 한 번만 기록이 반영되고, 최고 분당타수 × 참여 일수로 순위가 매겨져요.
      </p>

      <form onSubmit={handleSubmit} className="bg-panel border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <Field label="대회 이름">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-base" required />
        </Field>

        <div className="flex gap-3">
          <Field label="종류">
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-base">
              <option value="korean">한타</option>
              <option value="english">영타</option>
            </select>
          </Field>
          <Field label="단계">
            <select value={stage} onChange={(e) => setStage(e.target.value)} className="input-base">
              {STAGE_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="시작일">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-base"
            required
          />
        </Field>
        <p className="text-[11px] text-muted -mt-2">종료일: {addDays(startDate, 6)}</p>

        {isTeacherCreator ? (
          <p className="text-xs text-keycap bg-ink/60 border border-keycap/40 rounded-key p-3">
            대상: {profile.grade}학년 {profile.classNum}반 (담임 학급으로 자동 지정)
          </p>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScopeType('all')}
                className={`key flex-1 px-3 py-2 rounded-key text-sm font-semibold ${
                  scopeType === 'all' ? 'bg-keycap text-ink' : 'bg-ink border border-white/10 text-paper/70'
                }`}
              >
                전체 학교
              </button>
              <button
                type="button"
                onClick={() => setScopeType('classes')}
                className={`key flex-1 px-3 py-2 rounded-key text-sm font-semibold ${
                  scopeType === 'classes' ? 'bg-keycap text-ink' : 'bg-ink border border-white/10 text-paper/70'
                }`}
              >
                학년/반 지정
              </button>
            </div>

            {scopeType === 'classes' && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <select value={newGrade} onChange={(e) => setNewGrade(e.target.value)} className="input-base w-24">
                    <option value="1">1학년</option>
                    <option value="2">2학년</option>
                    <option value="3">3학년</option>
                  </select>
                  <input
                    value={newClassNum}
                    onChange={(e) => setNewClassNum(e.target.value)}
                    placeholder="반 (예: 01)"
                    className="input-base flex-1"
                  />
                  <button type="button" onClick={addClass} className="key bg-mint text-ink font-semibold px-3 rounded-key text-sm">
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classList.map((c, i) => (
                    <span key={i} className="key bg-ink border border-white/15 text-xs px-2 py-1 rounded-key flex items-center gap-1">
                      {c.grade}학년 {c.classNum}반
                      <button type="button" onClick={() => removeClass(i)} className="text-coral">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {error && <p className="text-coral text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="key bg-keycap text-ink font-semibold py-2.5 rounded-key disabled:opacity-60"
        >
          {saving ? '만드는 중...' : '대회 만들기'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex-1 min-w-0 flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  )
}
