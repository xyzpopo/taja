import { useEffect, useState } from 'react'
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { callAdminServer } from '../adminApi'

export default function AdminPanel() {
  const [teacherReqs, setTeacherReqs] = useState([])
  const [gradeReqs, setGradeReqs] = useState([])
  const [pwReqs, setPwReqs] = useState([])
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const [showPromote, setShowPromote] = useState(false)
  const [promotePreview, setPromotePreview] = useState(null)
  const [promoting, setPromoting] = useState(false)

  const [showNotice, setShowNotice] = useState(false)
  const [notice, setNotice] = useState({ title: '', body: '' })
  const [sendingNotice, setSendingNotice] = useState(false)

  const [showTerms, setShowTerms] = useState(false)
  const [termsContent, setTermsContent] = useState('')
  const [savingTerms, setSavingTerms] = useState(false)

  useEffect(() => {
    async function loadTerms() {
      const snap = await getDoc(doc(db, 'settings', 'terms'))
      if (snap.exists()) setTermsContent(snap.data().content || '')
    }
    loadTerms()
  }, [])

  async function loadInbox() {
    setError('')
    try {
      const [t, g, p, r] = await Promise.all([
        getDocs(collection(db, 'teacherRequests')),
        getDocs(collection(db, 'gradeChangeRequests')),
        getDocs(collection(db, 'passwordResetRequests')),
        getDocs(collection(db, 'reports')),
      ])
      setTeacherReqs(t.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.status === 'pending'))
      setGradeReqs(g.docs.map((d) => ({ id: d.id, ...d.data() })))
      setPwReqs(p.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.status === 'pending'))
      setReports(r.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.status === 'pending'))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadInbox()
  }, [])

  async function withBusy(id, fn) {
    setBusyId(id)
    setError('')
    try {
      await fn()
      await loadInbox()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const approveTeacher = (req) =>
    withBusy(req.id, async () => {
      const msg = prompt('승인 메시지를 함께 보낼 수 있어요 (선택, 비워두면 안 보냄)') ?? ''
      await callAdminServer('/approveTeacher', { uid: req.uid, message: msg })
    })

  const rejectTeacher = (req) =>
    withBusy(req.id, async () => {
      if (!confirm(`${req.name} 선생님의 신청을 거부하고 계정을 삭제할까요?`)) return
      await callAdminServer('/rejectTeacher', { uid: req.uid })
    })

  const approveGrade = (req) =>
    withBusy(req.id, async () => {
      const msg = prompt('학생에게 함께 보낼 메시지 (선택)') ?? ''
      await callAdminServer('/approveGradeChange', { requestId: req.id, message: msg })
    })

  const rejectGrade = (req) =>
    withBusy(req.id, async () => {
      if (!confirm('이 학년변경 요청을 거부할까요?')) return
      const msg = prompt('거부 사유 (선택)') ?? ''
      await callAdminServer('/rejectGradeChange', { requestId: req.id, message: msg })
    })

  const resolvePassword = (req) =>
    withBusy(req.id, async () => {
      const newPw = prompt(`${req.name} 학생에게 부여할 임시 비밀번호를 입력하세요 (6자 이상)`)
      if (!newPw) return
      await callAdminServer('/resetPassword', { requestId: req.id, newPassword: newPw })
    })

  const dismissReport = (report) =>
    withBusy(report.id, async () => {
      await updateDoc(doc(db, 'reports', report.id), { status: 'dismissed' })
    })

  const banReportedUser = (report) =>
    withBusy(report.id, async () => {
      if (
        !confirm(
          `${report.reportedAuthorName}(${report.reportedGrade}학년 ${report.reportedClassNum}반) 계정을 영구정지할까요? 되돌릴 수 없습니다.`,
        )
      )
        return
      await callAdminServer('/permanentBan', { reportId: report.id, uid: report.reportedAuthorUid })
    })

  async function handlePreviewPromote() {
    setPromoting(true)
    setError('')
    try {
      const data = await callAdminServer('/promoteAllPending', { dryRun: true })
      setPromotePreview(data)
      setShowPromote(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setPromoting(false)
    }
  }

  async function handleConfirmPromote() {
    if (
      !confirm(
        `정말 실행할까요?\n진급 처리: ${promotePreview.promoted}명\n계정 삭제(미신청): ${promotePreview.toDelete}명\n이 작업은 되돌릴 수 없습니다.`,
      )
    )
      return
    setPromoting(true)
    setError('')
    try {
      const data = await callAdminServer('/promoteAllPending', { dryRun: false })
      alert(`완료되었습니다. 진급 ${data.promoted}명, 삭제 ${data.removed}명`)
      setShowPromote(false)
      setPromotePreview(null)
      await loadInbox()
    } catch (err) {
      setError(err.message)
    } finally {
      setPromoting(false)
    }
  }

  async function handleSendNotice(e) {
    e.preventDefault()
    setSendingNotice(true)
    setError('')
    try {
      await addDoc(collection(db, 'announcements'), {
        title: notice.title,
        body: notice.body,
        createdAt: serverTimestamp(),
      })
      setNotice({ title: '', body: '' })
      setShowNotice(false)
      alert('공지가 등록되었습니다.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSendingNotice(false)
    }
  }

  async function handleSaveTerms(e) {
    e.preventDefault()
    setSavingTerms(true)
    setError('')
    try {
      await setDoc(doc(db, 'settings', 'terms'), {
        content: termsContent,
        updatedAt: serverTimestamp(),
      })
      alert('이용약관이 저장되었습니다.')
      setShowTerms(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingTerms(false)
    }
  }

  const totalInbox = teacherReqs.length + gradeReqs.length + pwReqs.length + reports.length

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-keycap mb-1">관리자 패널</h1>
      <p className="text-muted text-sm mb-6">대기 중인 요청 {totalInbox}건</p>

      <div className="flex gap-3 mb-8">
        <button
          onClick={handlePreviewPromote}
          disabled={promoting}
          className="key bg-keycap text-ink font-semibold px-4 py-2 rounded-key disabled:opacity-60"
        >
          새학년
        </button>
        <button
          onClick={() => setShowNotice((v) => !v)}
          className="key bg-panel border border-white/15 text-paper px-4 py-2 rounded-key"
        >
          공지
        </button>
        <button
          onClick={() => setShowTerms((v) => !v)}
          className="key bg-panel border border-white/15 text-paper px-4 py-2 rounded-key"
        >
          이용약관
        </button>
      </div>

      {error && <p className="text-coral text-sm mb-4">{error}</p>}

      {showNotice && (
        <form onSubmit={handleSendNotice} className="bg-panel border border-white/10 rounded-2xl p-5 flex flex-col gap-3 mb-8">
          <input
            placeholder="공지 제목"
            value={notice.title}
            onChange={(e) => setNotice((n) => ({ ...n, title: e.target.value }))}
            className="input-base"
            required
          />
          <textarea
            placeholder="공지 내용"
            value={notice.body}
            onChange={(e) => setNotice((n) => ({ ...n, body: e.target.value }))}
            className="input-base min-h-24"
            required
          />
          <button
            type="submit"
            disabled={sendingNotice}
            className="key bg-mint text-ink font-semibold px-4 py-2 rounded-key self-start disabled:opacity-60"
          >
            {sendingNotice ? '등록 중...' : '공지 등록'}
          </button>
        </form>
      )}

      {showTerms && (
        <form onSubmit={handleSaveTerms} className="bg-panel border border-white/10 rounded-2xl p-5 flex flex-col gap-3 mb-8">
          <p className="text-xs text-muted">
            여기서 저장한 내용이 회원가입 화면에 그대로 보여지고, 학생/교사는 동의해야 가입할 수 있어요.
          </p>
          <textarea
            placeholder="이용약관 내용을 입력하세요"
            value={termsContent}
            onChange={(e) => setTermsContent(e.target.value)}
            className="input-base min-h-48"
          />
          <button
            type="submit"
            disabled={savingTerms}
            className="key bg-mint text-ink font-semibold px-4 py-2 rounded-key self-start disabled:opacity-60"
          >
            {savingTerms ? '저장 중...' : '이용약관 저장'}
          </button>
        </form>
      )}

      {showPromote && promotePreview && (
        <div className="bg-panel border border-keycap/40 rounded-2xl p-5 mb-8">
          <p className="text-sm text-paper/90 mb-1">
            학년변경 요청 <span className="text-keycap font-semibold">{promotePreview.promoted}건</span> 처리 예정
          </p>
          <p className="text-sm text-coral mb-4">
            요청하지 않은 학생 계정 <span className="font-semibold">{promotePreview.toDelete}명</span> 삭제 예정
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmPromote}
              disabled={promoting}
              className="key bg-coral text-ink font-semibold px-4 py-2 rounded-key disabled:opacity-60"
            >
              {promoting ? '처리 중...' : '실행 확정'}
            </button>
            <button
              onClick={() => setShowPromote(false)}
              className="px-4 py-2 text-sm text-muted hover:text-paper"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {teacherReqs.map((req) => (
          <InboxCard
            key={req.id}
            badge="교사승인"
            title={`${req.grade}학년 ${req.classNum}반 담임 · ${req.name} 선생님`}
            sub={req.email}
            busy={busyId === req.id}
            onApprove={() => approveTeacher(req)}
            onReject={() => rejectTeacher(req)}
          />
        ))}

        {gradeReqs.map((req) => (
          <InboxCard
            key={req.id}
            badge="학년변경"
            title={`${req.name} · ${req.currentGrade}학년 ${req.currentClassNum}반 ${req.currentNumber}번 → ${req.targetGrade}학년 ${req.targetClassNum}반 ${req.targetNumber}번`}
            sub={req.message}
            busy={busyId === req.id}
            onApprove={() => approveGrade(req)}
            onReject={() => rejectGrade(req)}
          />
        ))}

        {pwReqs.map((req) => (
          <InboxCard
            key={req.id}
            badge="비번찾기"
            title={`${req.grade}학년 ${req.classNum}반 ${req.number}번 · ${req.name}`}
            sub={req.message}
            busy={busyId === req.id}
            approveLabel="비번 재설정"
            onApprove={() => resolvePassword(req)}
          />
        ))}

        {reports.map((r) => (
          <InboxCard
            key={r.id}
            badge="신고"
            title={`${r.type === 'post' ? '게시물' : r.type === 'comment' ? '댓글' : '프로필사진'} · ${r.reportedAuthorName}(${r.reportedGrade}학년 ${r.reportedClassNum}반) · 사유: ${r.reason}`}
            sub={r.contentSnapshot}
            busy={busyId === r.id}
            approveLabel="영구정지"
            rejectLabel="기각"
            onApprove={() => banReportedUser(r)}
            onReject={() => dismissReport(r)}
          />
        ))}

        {totalInbox === 0 && <p className="text-muted text-sm">대기 중인 요청이 없습니다.</p>}
      </div>
    </div>
  )
}

function InboxCard({ badge, title, sub, busy, onApprove, onReject, approveLabel = '승인', rejectLabel = '거부' }) {
  return (
    <div className="bg-panel border border-white/10 rounded-key px-4 py-3 flex items-center gap-4">
      <span className="key bg-ink text-keycap text-[11px] font-mono px-2 py-1 rounded-key shrink-0">
        {badge}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{title}</p>
        {sub && <p className="text-xs text-muted truncate">{sub}</p>}
      </div>
      <button
        disabled={busy}
        onClick={onApprove}
        className="text-xs px-3 py-1.5 rounded-key bg-mint text-ink font-semibold disabled:opacity-50 shrink-0"
      >
        {approveLabel}
      </button>
      {onReject && (
        <button
          disabled={busy}
          onClick={onReject}
          className="text-xs px-3 py-1.5 rounded-key border border-coral text-coral disabled:opacity-50 shrink-0"
        >
          {rejectLabel}
        </button>
      )}
    </div>
  )
}
