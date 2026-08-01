import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, currentUser, profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ grade: '1', classNum: '', number: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState(location.state?.message || '')

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  // 로그인 직후 바로 navigate하면 AuthContext의 currentUser/profile 상태가
  // 아직 갱신되기 전이라 ProtectedRoute가 다시 로그인 페이지로 튕겨내는 문제가 있었습니다.
  // currentUser/profile이 실제로 반영된 뒤에 이동하도록 이펙트로 처리합니다.
  useEffect(() => {
    if (!currentUser || !profile) return
    if (profile.role === 'pending_teacher') {
      // 승인 전 교사는 로그인해도 할 수 있는 게 없어서, 로그아웃시키고 안내만 보여줍니다.
      logout().then(() => setInfo('아직 관리자 승인 대기 중이에요. 승인이 완료되면 로그인할 수 있어요.'))
    } else {
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, profile, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await login(form)
      // 이동은 위 useEffect가 처리합니다.
    } catch (err) {
      setError(mapError(err))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl text-keycap text-center mb-1">타자연습</h1>
        <p className="text-center text-muted text-sm mb-8">학년 · 반 · 번호로 로그인하세요</p>

        {info && (
          <p className="text-center text-xs text-mint bg-mint/10 border border-mint/30 rounded-key py-2 px-3 mb-4">
            {info}
          </p>
        )}

        <form onSubmit={handleSubmit} className="bg-panel border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex gap-3">
            <Field label="학년">
              <select
                value={form.grade}
                onChange={update('grade')}
                className="input-base"
              >
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

          <Field label="비밀번호">
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              className="input-base w-full"
              required
            />
          </Field>

          {error && <p className="text-coral text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="key bg-keycap text-ink font-semibold py-2.5 rounded-key mt-1 disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <p className="text-center text-sm text-muted">
            계정이 없나요? <Link to="/signup" className="text-keycap hover:underline">회원가입</Link>
          </p>
          <p className="text-center text-xs text-muted/70">
            선생님이신가요? 번호 칸에 <span className="text-keycap">선생</span> 이라고 입력해주세요.
          </p>
          <p className="text-center text-xs text-muted/60">
            비밀번호를 잊으셨나요? <Link to="/forgot-password" className="hover:text-keycap">비밀번호 찾기</Link>
          </p>
        </form>

        <p className="text-center mt-6">
          <Link to="/admin-login" className="text-[10px] text-muted/30 hover:text-muted/60">
            관리자 전환
          </Link>
        </p>
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
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return '학년/반/번호 또는 비밀번호가 올바르지 않습니다.'
  }
  return err.message?.replace('Firebase: ', '') || '로그인에 실패했습니다.'
}
