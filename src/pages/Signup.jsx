import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { TEACHER_MARK } from '../utils/idMapping'

const DEFAULT_TERMS = '아직 관리자가 이용약관을 등록하지 않았어요. 그래도 아래 체크 후 가입은 진행할 수 있습니다.'

export default function Signup() {
  const { signup, currentUser, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ grade: '1', classNum: '', number: '', name: '', password: '', confirm: '' })
  const [agreed, setAgreed] = useState(false)
  const [terms, setTerms] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadTerms() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'terms'))
        setTerms(snap.exists() && snap.data().content ? snap.data().content : DEFAULT_TERMS)
      } catch {
        setTerms(DEFAULT_TERMS)
      }
    }
    loadTerms()
  }, [])

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  const isTeacherInput = form.number.trim() === TEACHER_MARK

  useEffect(() => {
    if (!currentUser || !profile) return
    if (profile.role === 'pending_teacher') {
      // 교사는 승인 전까지 할 수 있는 게 없어서, 로그아웃 시키고 안내와 함께 로그인 화면으로 보냅니다.
      logout().then(() => {
        navigate('/login', {
          replace: true,
          state: { message: '가입 신청이 접수되었습니다. 관리자 승인이 완료되면 로그인할 수 있어요.' },
        })
      })
    } else {
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, profile, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('이름을 입력해주세요.')
    if (form.password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.')
    if (form.password !== form.confirm) return setError('비밀번호가 일치하지 않습니다.')
    if (!agreed) return setError('이용약관에 동의해야 가입할 수 있어요.')

    setLoading(true)
    try {
      await signup(form)
      // 이동은 위 useEffect가 처리합니다.
    } catch (err) {
      setError(mapError(err))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-keycap text-center mb-6">회원가입</h1>

        <form onSubmit={handleSubmit} className="bg-panel border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex gap-3">
            <Field label="학년">
              <select value={form.grade} onChange={update('grade')} className="input-base">
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
            </Field>
            <Field label="반">
              <input value={form.classNum} onChange={update('classNum')} maxLength={2} placeholder="01" className="input-base" />
            </Field>
            <Field label="번호">
              <input
                value={form.number}
                onChange={update('number')}
                maxLength={2}
                placeholder="01"
                className="input-base"
              />
            </Field>
          </div>

          <Field label="이름">
            <input value={form.name} onChange={update('name')} className="input-base w-full" required />
          </Field>

          <Field label="비밀번호 (6자 이상)">
            <input type="password" value={form.password} onChange={update('password')} className="input-base w-full" required />
          </Field>
          <Field label="비밀번호 확인">
            <input type="password" value={form.confirm} onChange={update('confirm')} className="input-base w-full" required />
          </Field>

          {isTeacherInput && (
            <p className="text-xs text-keycap bg-ink/60 border border-keycap/40 rounded-key p-3 leading-relaxed">
              교사 계정으로 가입합니다. 가입 후 관리자 승인이 완료되어야 로그인할 수 있어요.
            </p>
          )}

          <div>
            <p className="text-xs text-muted mb-1">이용약관</p>
            <div className="input-base max-h-32 overflow-y-auto text-xs text-paper/80 whitespace-pre-wrap leading-relaxed">
              {terms}
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-paper/80">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5"
            />
            위 이용약관을 읽었고 동의합니다.
          </label>

          {error && <p className="text-coral text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !agreed}
            className="key bg-keycap text-ink font-semibold py-2.5 rounded-key mt-1 disabled:opacity-60"
          >
            {loading ? '처리 중...' : '가입하기'}
          </button>

          <p className="text-center text-sm text-muted">
            이미 계정이 있나요? <Link to="/login" className="text-keycap hover:underline">로그인</Link>
          </p>
        </form>
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

function mapError(err) {
  const code = err?.code || ''
  if (code.includes('email-already-in-use')) return '이미 가입된 학년/반/번호입니다.'
  if (code.includes('weak-password')) return '비밀번호가 너무 약합니다.'
  return err.message?.replace('Firebase: ', '') || '가입에 실패했습니다.'
}
