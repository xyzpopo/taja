import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  doc, getDoc, updateDoc, arrayUnion, arrayRemove,
  collection, addDoc, query, orderBy, getDocs, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { containsBannedWords } from '../utils/profanityFilter'
import { maskName } from '../utils/maskName'
import { getEquippedSticker } from '../utils/stickerCache'
import { STICKERS } from '../utils/pointsConfig'
import ReportButton from '../components/ReportButton'

export default function PostDetail() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { profile, currentUser } = useAuth()
  const [post, setPost] = useState(null)
  const [authorAvatar, setAuthorAvatar] = useState('')
  const [authorSticker, setAuthorSticker] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  async function loadPost() {
    try {
      const snap = await getDoc(doc(db, 'posts', postId))
      if (snap.exists() && !snap.data().deleted) {
        const data = { id: snap.id, ...snap.data() }
        setPost(data)
        const avatarSnap = await getDoc(doc(db, 'avatars', data.authorUid))
        if (avatarSnap.exists()) setAuthorAvatar(avatarSnap.data().avatarData || '')
        getEquippedSticker(data.authorUid).then(setAuthorSticker)
      } else {
        setNotFound(true)
      }
    } catch (err) {
      setLoadError(err.message)
    }
  }

  async function loadComments() {
    try {
      const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'))
      const snap = await getDocs(q)
      setComments(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((c) => !c.deleted),
      )
    } catch (err) {
      console.error('load comments failed', err)
    }
  }

  useEffect(() => {
    loadPost()
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const canModerate =
    profile?.role === 'teacher' &&
    post &&
    profile.grade === post.authorGrade &&
    profile.classNum === post.authorClassNum

  const liked = post?.likedBy?.includes(currentUser?.uid)

  async function handleToggleLike() {
    if (!post) return
    const ref = doc(db, 'posts', postId)
    try {
      await updateDoc(ref, {
        likedBy: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      })
      setPost((p) => ({
        ...p,
        likedBy: liked
          ? (p.likedBy || []).filter((u) => u !== currentUser.uid)
          : [...(p.likedBy || []), currentUser.uid],
      }))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentError('')
    if (containsBannedWords(commentText)) {
      setCommentError('부적절한 표현이 포함되어 있어요.')
      return
    }
    setPostingComment(true)
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        authorUid: currentUser.uid,
        authorName: profile.name,
        authorGrade: profile.grade,
        authorClassNum: profile.classNum,
        content: commentText.trim(),
        deleted: false,
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'posts', postId), { commentCount: (post.commentCount || 0) + 1 })
      setPost((p) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }))
      setCommentText('')
      await loadComments()
    } catch (err) {
      setCommentError(err.message)
    } finally {
      setPostingComment(false)
    }
  }

  async function handleDeleteComment(commentId) {
    if (!confirm('이 댓글을 삭제할까요?')) return
    try {
      await updateDoc(doc(db, 'posts', postId, 'comments', commentId), { deleted: true })
      setComments((cs) => cs.filter((c) => c.id !== commentId))
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeletePost() {
    if (!confirm('이 게시물을 삭제할까요? 삭제된 게시물은 SNS 피드에서 사라집니다.')) return
    setBusy(true)
    try {
      await updateDoc(doc(db, 'posts', postId), { deleted: true })
      navigate('/sns')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSuspendAuthor() {
    if (!confirm(`${post.authorName} 학생의 게시물 작성을 정지할까요? (영구 정지 아님, 교사 페이지에서 해제 가능)`)) return
    setBusy(true)
    try {
      await updateDoc(doc(db, 'users', post.authorUid), { status: 'suspended' })
      alert('정지 처리되었습니다.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-muted">
        게시물을 찾을 수 없습니다. 삭제되었거나 잘못된 주소일 수 있어요.
      </div>
    )
  }
  if (loadError) return <div className="max-w-2xl mx-auto px-4 py-10 text-coral">{loadError}</div>
  if (!post) return <div className="max-w-2xl mx-auto px-4 py-10 text-muted">불러오는 중...</div>

  const badge = post.type === 'korean' ? '한타' : '영타'
  const reportedAuthor = {
    uid: post.authorUid,
    name: post.authorName,
    grade: post.authorGrade,
    classNum: post.authorClassNum,
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <span className="key inline-block bg-ink text-keycap text-xs font-mono px-2 py-1 rounded-key mb-3">
        [{badge},{post.accuracy}%,{post.cpm}타]
      </span>
      <h1 className="font-display text-2xl text-paper mb-1">{post.title}</h1>
      <div className="flex items-center gap-2 mb-6">
        <Link to={`/profile/${post.authorUid}`}>
          {authorAvatar ? (
            <img src={authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover border border-white/15" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-ink border border-white/15 flex items-center justify-center text-xs text-muted">
              {post.authorName?.[0] ?? '?'}
            </div>
          )}
        </Link>
        <Link to={`/profile/${post.authorUid}`} className="text-xs text-muted hover:text-keycap">
          {post.authorGrade}학년 {post.authorClassNum}반 {maskName(post.authorName)}
          {STICKERS.find((s) => s.id === authorSticker)?.emoji && (
            <span className="ml-1">{STICKERS.find((s) => s.id === authorSticker)?.emoji}</span>
          )}
        </Link>
        <ReportButton
          type="post"
          targetId={postId}
          reportedAuthor={reportedAuthor}
          contentSnapshot={`${post.title}\n${post.content}`}
        />
        {authorAvatar && (
          <ReportButton
            type="avatar"
            targetId={post.authorUid}
            reportedAuthor={reportedAuthor}
            contentSnapshot="(프로필 사진 신고)"
            label="사진신고"
          />
        )}
      </div>

      {post.imageData && (
        <img src={post.imageData} alt="" className="rounded-key w-full mb-6 border border-white/10" />
      )}

      <p className="text-paper/90 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      <div className="flex items-center gap-4 mt-5">
        <button
          onClick={handleToggleLike}
          className={`text-sm px-3 py-1.5 rounded-key border transition-colors ${
            liked ? 'bg-coral text-ink border-coral' : 'border-white/15 text-paper/70 hover:border-coral'
          }`}
        >
          {liked ? '♥' : '♡'} {post.likedBy?.length || 0}
        </button>
        <span className="text-sm text-muted">💬 {post.commentCount || 0}</span>
      </div>

      {error && <p className="text-coral text-sm mt-4">{error}</p>}

      {canModerate && (
        <div className="mt-8 border-t border-white/10 pt-5 flex gap-3">
          <button
            onClick={handleDeletePost}
            disabled={busy}
            className="text-sm px-4 py-2 rounded-key border border-coral text-coral hover:bg-coral hover:text-ink transition-colors disabled:opacity-50"
          >
            게시물 삭제
          </button>
          <button
            onClick={handleSuspendAuthor}
            disabled={busy}
            className="text-sm px-4 py-2 rounded-key border border-white/20 text-paper/80 hover:border-keycap hover:text-keycap transition-colors disabled:opacity-50"
          >
            작성자 게시 정지
          </button>
        </div>
      )}

      <div className="mt-10 border-t border-white/10 pt-6">
        <h2 className="font-display text-lg text-paper mb-4">댓글 {comments.length}</h2>

        <form onSubmit={handleAddComment} className="flex gap-2 mb-5">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 남겨보세요"
            maxLength={300}
            className="input-base flex-1"
          />
          <button
            type="submit"
            disabled={postingComment}
            className="key bg-keycap text-ink font-semibold px-4 rounded-key disabled:opacity-60"
          >
            등록
          </button>
        </form>
        {commentError && <p className="text-coral text-sm mb-3">{commentError}</p>}

        <div className="flex flex-col gap-3">
          {comments.length === 0 && <p className="text-muted text-sm">아직 댓글이 없어요.</p>}
          {comments.map((c) => {
            const canModerateComment =
              profile?.role === 'teacher' &&
              profile.grade === c.authorGrade &&
              profile.classNum === c.authorClassNum
            return (
              <CommentRow
                key={c.id}
                comment={c}
                canModerate={canModerateComment}
                onDelete={() => handleDeleteComment(c.id)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CommentRow({ comment: c, canModerate, onDelete }) {
  const [sticker, setSticker] = useState(null)

  useEffect(() => {
    let alive = true
    getEquippedSticker(c.authorUid).then((s) => {
      if (alive) setSticker(s)
    })
    return () => {
      alive = false
    }
  }, [c.authorUid])

  const stickerEmoji = STICKERS.find((s) => s.id === sticker)?.emoji

  return (
    <div className="bg-panel border border-white/10 rounded-key p-3">
      <div className="flex items-center justify-between">
        <Link to={`/profile/${c.authorUid}`} className="text-xs text-muted hover:text-keycap">
          {c.authorGrade}학년 {c.authorClassNum}반 {maskName(c.authorName)}
          {stickerEmoji && <span className="ml-1">{stickerEmoji}</span>}
        </Link>
        <div className="flex items-center gap-2">
          <ReportButton
            type="comment"
            targetId={c.id}
            reportedAuthor={{ uid: c.authorUid, name: c.authorName, grade: c.authorGrade, classNum: c.authorClassNum }}
            contentSnapshot={c.content}
          />
          {canModerate && (
            <button onClick={onDelete} className="text-[11px] text-coral hover:underline">
              삭제
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-paper/90 mt-1">{c.content}</p>
    </div>
  )
}
