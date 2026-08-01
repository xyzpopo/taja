import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLogin() {
  const { loginAdmin, currentUser, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUser && isAdmin) {
      navigate('/admin', { replace: true })
    }
  }, [currentUser, isAdmin, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginAdmin(email, password)
      // 이동은 위 useEffect가 처리합니다.
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || '로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-panel border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <h1 className="font-display text-2xl text-keycap text-center">관리자 전환</h1>
        <input
          type="email"
          placeholder="관리자 이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-base"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-base"
          required
        />
        {error && <p className="text-coral text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="key bg-keycap text-ink font-semibold py-2.5 rounded-key disabled:opacity-60"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
        <Link to="/login" className="text-center text-xs text-muted hover:text-keycap">
          학생/교사 로그인으로 돌아가기
        </Link>
      </form>
    </div>
  )
}
