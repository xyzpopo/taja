import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'

export default function TeacherAdmin() {
  const { profile } = useAuth()
  const [students, setStudents] = useState(null)
  const [posts, setPosts] = useState(null)
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('posts')

  async function loadAll() {
    setError('')
    try {
      const studentQ = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('grade', '==', profile.grade),
        where('classNum', '==', profile.classNum),
      )
      const studentSnap = await getDocs(studentQ)
      setStudents(studentSnap.docs.map((d) => ({ id: d.id, ...d.data() })))

      const postQ = query(
        collection(db, 'posts'),
        where('authorGrade', '==', profile.grade),
        where('authorClassNum', '==', profile.classNum),
        where('deleted', '==', false),
        orderBy('createdAt', 'desc'),
      )
      const postSnap = await getDocs(postQ)
      setPosts(postSnap.docs.map((d) => ({ id: d.id, ...d.data() })))

      const reportQ = query(
        collection(db, 'reports'),
        where('reportedGrade', '==', profile.grade),
        where('reportedClassNum', '==', profile.classNum),
      )
      const reportSnap = await getDocs(reportQ)
      setReports(
        reportSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => r.status === 'pending'),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (profile) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function toggleSuspend(student) {
    const nextStatus = student.status === 'suspended' ? 'active' : 'suspended'
    await updateDoc(doc(db, 'users', student.id), { status: nextStatus })
    setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, status: nextStatus } : s)))
  }

  async function suspendReportedUser(report) {
    if (!confirm(`${report.reportedAuthorName} 학생을 정지할까요? (영구정지는 관리자만 가능)`)) return
    await updateDoc(doc(db, 'users', report.reportedAuthorUid), { status: 'suspended' })
    setStudents((prev) =>
      prev?.map((s) => (s.id === report.reportedAuthorUid ? { ...s, status: 'suspended' } : s)) ?? prev,
    )
    alert('정지 처리되었습니다. (영구정지가 필요하면 관리자에게 알려주세요)')
  }

  async function deletePost(postId) {
    if (!confirm('이 게시물을 삭제할까요?')) return
    await updateDoc(doc(db, 'posts', postId), { deleted: true })
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-keycap mb-1">교사 페이지</h1>
      <p className="text-muted text-sm mb-6">
        {profile.grade}학년 {profile.classNum}반 학생 게시물 관리 · 정지(영구 정지 불가)
      </p>

      <div className="flex gap-2 mb-6">
        <TabButton active={tab === 'posts'} onClick={() => setTab('posts')} label="반 게시물" />
        <TabButton active={tab === 'students'} onClick={() => setTab('students')} label="학생 목록" />
        <TabButton active={tab === 'reports'} onClick={() => setTab('reports')} label={`신고내역${reports?.length ? ` (${reports.length})` : ''}`} />
      </div>

      {error && <p className="text-coral text-sm mb-4">{error}</p>}

      {tab === 'posts' && (
        <div className="flex flex-col gap-4">
          {posts?.length === 0 && <p className="text-muted text-sm">게시물이 없습니다.</p>}
          {posts?.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              maskNames={false}
              actions={
                <button
                  onClick={() => deletePost(post.id)}
                  className="text-xs px-3 py-1.5 rounded-key border border-coral text-coral hover:bg-coral hover:text-ink transition-colors"
                >
                  삭제
                </button>
              }
            />
          ))}
        </div>
      )}

      {tab === 'students' && (
        <div className="flex flex-col gap-2">
          {students?.map((s) => (
            <div
              key={s.id}
              className="bg-panel border border-white/10 rounded-key px-4 py-3 flex items-center gap-4"
            >
              <span className="text-sm flex-1">
                {s.number}번 {s.name}
              </span>
              <span className={`text-xs ${s.status === 'suspended' ? 'text-coral' : 'text-mint'}`}>
                {s.status === 'suspended' ? '정지됨' : '정상'}
              </span>
              <button
                onClick={() => toggleSuspend(s)}
                className="text-xs px-3 py-1.5 rounded-key border border-white/20 hover:border-keycap hover:text-keycap transition-colors"
              >
                {s.status === 'suspended' ? '정지 해제' : '게시 정지'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'reports' && (
        <div className="flex flex-col gap-3">
          {reports?.length === 0 && <p className="text-muted text-sm">신고 접수된 내용이 없습니다.</p>}
          {reports?.map((r) => (
            <div key={r.id} className="bg-panel border border-coral/30 rounded-key p-4">
              <p className="text-sm text-paper/90">
                <span className="text-coral font-semibold">
                  [{r.type === 'post' ? '게시물' : r.type === 'comment' ? '댓글' : '프로필사진'}]
                </span>{' '}
                {r.reportedAuthorName} 학생 · 사유: {r.reason}
              </p>
              {r.contentSnapshot && (
                <p className="text-xs text-muted mt-1 whitespace-pre-wrap line-clamp-3">{r.contentSnapshot}</p>
              )}
              <button
                onClick={() => suspendReportedUser(r)}
                className="mt-2 text-xs px-3 py-1.5 rounded-key border border-coral text-coral hover:bg-coral hover:text-ink transition-colors"
              >
                이 학생 정지하기
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`key px-4 py-2 rounded-key text-sm font-semibold ${
        active ? 'bg-keycap text-ink' : 'bg-panel text-paper/70 border border-white/10'
      }`}
    >
      {label}
    </button>
  )
}
