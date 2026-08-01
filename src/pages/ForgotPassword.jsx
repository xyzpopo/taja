import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { isValidClassNum, isValidGrade, isValidNumber } from '../utils/idMapping'

export default function ForgotPassword() {
  const [form, setForm] = useState({ grade: '1', classNum: '', number: '', name: '', message: '' })
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!isValidGrade(form.grade) || !isValidClassNum(form.classNum) || !isValidNumber(form.number)) {
      setError('학년/반/번호를 올바르게 입력해주세요 (반/번호는 1~99 사이 숫자).')
      return
    }
    if (!form.name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      await addDoc(collection(db, 'passwordResetRequests'), {
        grade: Number(form.grade),
        classNum: Number(form.classNum),
        number: Number(form.number),
        name: form.name.trim(),
        message: form.message.trim().slice(0, 300),
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-keycap text-center mb-6">비밀번호 찾기</h1>

        {sent ? (
          <div className="bg-panel border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-paper/90 text-sm leading-relaxed">
              요청이 관리자에게 전달되었습니다. 처리가 완료되면 로그인 후 임시 비밀번호 안내가
              표시됩니다.
            </p>
            <Link to="/login" className="key inline-block mt-5 bg-keycap text-ink font-semibold px-4 py-2 rounded-key">
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-panel border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <p className="text-xs text-muted leading-relaxed">
              학년/반/번호와 이름을 입력하면 담당 선생님/관리자가 확인 후 비밀번호를
              재설정해줍니다.
            </p>
            <div className="flex gap-3">
              <Field label="학년">
                <select value={form.grade} onChange={update('grade')} className="input-base">
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                </select>
              </Field>
              <Field label="반">
                <input value={form.classNum} onChange={update('classNum')} maxLength={2} className="input-base" />
              </Field>
              <Field label="번호">
                <input value={form.number} onChange={update('number')} maxLength={2} className="input-base" />
              </Field>
            </div>
            <Field label="이름">
              <input value={form.name} onChange={update('name')} className="input-base w-full" required />
            </Field>
            <Field label="메시지 (선택)">
              <textarea
                value={form.message}
                onChange={update('message')}
                className="input-base w-full min-h-16"
                placeholder="선생님/관리자에게 남길 말"
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
            <Link to="/login" className="text-center text-xs text-muted hover:text-keycap">
              로그인으로 돌아가기
            </Link>
          </form>
        )}
      </div>
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
