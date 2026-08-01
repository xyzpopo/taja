import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

// type: 'post' | 'comment' | 'avatar'
// reportedAuthor: { uid, name, grade, classNum }
// contentSnapshot: 신고 시점의 내용을 그대로 저장해서, 나중에 원본이 삭제돼도 확인할 수 있게 함
export default function ReportButton({ type, targetId, reportedAuthor, contentSnapshot, className = '', label = '신고' }) {
  const { currentUser, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const isSelf = reportedAuthor?.uid === currentUser?.uid

  async function handleSubmit(e) {
    e.preventDefault()
    if (!reason.trim()) return
    setSending(true)
    try {
      await addDoc(collection(db, 'reports'), {
        type,
        targetId,
        reporterUid: currentUser.uid,
        reporterName: profile?.name || '',
        reason: reason.trim().slice(0, 300),
        contentSnapshot: contentSnapshot?.slice(0, 500) || '',
        reportedAuthorUid: reportedAuthor?.uid || '',
        reportedAuthorName: reportedAuthor?.name || '',
        reportedGrade: reportedAuthor?.grade ?? null,
        reportedClassNum: reportedAuthor?.classNum ?? null,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setDone(true)
      setOpen(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  if (isSelf) return null
  if (done) return <span className={`text-[11px] text-muted ${className}`}>신고 접수됨</span>

  return (
    <div className={className}>
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-[11px] text-muted hover:text-coral">
          {label}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="신고 사유"
            className="input-base text-xs py-1 px-2 w-40"
            autoFocus
          />
          <button
            type="submit"
            disabled={sending}
            className="text-[11px] px-2 py-1 rounded-key bg-coral text-ink font-semibold disabled:opacity-50"
          >
            제출
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-[11px] text-muted">
            취소
          </button>
        </form>
      )}
    </div>
  )
}
