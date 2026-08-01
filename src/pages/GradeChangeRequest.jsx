import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { slotKey } from '../utils/idMapping'

export default function GradeChangeRequest() {
  const { currentUser, profile } = useAuth()
  const [existing, setExisting] = useState(undefined) // undefined = 로딩중, null = 없음
  const [form, setForm] = useState({ grade: '1', classNum: '', number: '', message: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadExisting() {
    const q = query(collection(db, 'gradeChangeRequests'), where('uid', '==', currentUser.uid))
    const snap = await getDocs(q)
    setExisting(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })
  }

  useEffect(() => {
    loadExisting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const classNum = Number(form.classNum)
    const number = Number(form.number)
    if (!classNum || classNum < 1 || classNum > 99 || !number || number < 1 || number > 99) {
      setError('반/번호는 1~99 사이 숫자로 입력해주세요.')
      return
    }

    const key = slotKey(form.grade, classNum, number)
    setLoading(true)
    try {
      await setDoc(doc(db, 'gradeChangeRequests', key), {
        uid: currentUser.uid,
        name: profile.name,
        currentGrade: profile.grade,
        currentClassNum: profile.classNum,
        currentNumber: profile.number,
        targetGrade: Number(form.grade),
        targetClassNum: classNum,
        targetNumber: number,
        message: form.message.trim().slice(0, 300),
        status: 'pending',
      })
      await loadExisting()
    } catch (err) {
      if (err.code === 'permission-denied') {
        setError('이미 그 학년/반/번호로 신청된 요청이 있습니다. 다른 자리인지 확인해주세요.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!confirm('요청을 취소할까요?')) return
    await deleteDoc(doc(db, 'gradeChangeRequests', existing.id))
    setExisting(null)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="font-display text-2xl text-keycap mb-1">학년/반/번호 변경 요청</h1>
      <p className="text-muted text-sm mb-6">
        새 학년도가 되어 반이 바뀌었거나 정보가 잘못되었을 때 신청하세요. 관리자가 승인하면
        기존에 작성한 글/기록은 그대로 유지된 채 학년/반/번호만 바뀝니다.
      </p>

      {existing === undefined && <p className="text-muted text-sm">불러오는 중...</p>}

      {existing === null && (
        <form onSubmit={handleSubmit} className="bg-panel border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex gap-3">
            <Field label="새 학년">
              <select value={form.grade} onChange={update('grade')} className="input-base">
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
            </Field>
            <Field label="새 반">
              <input value={form.classNum} onChange={update('classNum')} maxLength={2} className="input-base" />
            </Field>
            <Field label="새 번호">
              <input value={form.number} onChange={update('number')} maxLength={2} className="input-base" />
            </Field>
          </div>
          <Field label="관리자에게 남길 메시지 (선택)">
            <textarea
              value={form.message}
              onChange={update('message')}
              className="input-base w-full min-h-16"
            />
          </Field>
          {error && <p className="text-coral text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="key bg-keycap text-ink font-semibold py-2.5 rounded-key disabled:opacity-60"
          >
            {loading ? '요청 중...' : '요청 보내기'}
          </button>
        </form>
      )}

      {existing && (
        <div className="bg-panel border border-white/10 rounded-2xl p-6">
          <p className="text-sm text-paper/90 mb-4">
            <span className="text-keycap font-semibold">
              {existing.targetGrade}학년 {existing.targetClassNum}반 {existing.targetNumber}번
            </span>
            으로 변경 요청이 접수되어 관리자 승인을 기다리고 있어요.
          </p>
          <button
            onClick={handleCancel}
            className="text-sm px-4 py-2 rounded-key border border-coral text-coral hover:bg-coral hover:text-ink transition-colors"
          >
            요청 취소
          </button>
        </div>
      )}
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
