import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { maskName } from '../utils/maskName'
import { getEquippedSticker } from '../utils/stickerCache'
import { STICKERS } from '../utils/pointsConfig'

export default function PostCard({ post, actions, maskNames = true }) {
  const badge = post.type === 'korean' ? '한타' : '영타'
  const date = post.createdAt?.toDate ? post.createdAt.toDate() : null
  const [sticker, setSticker] = useState(null)

  useEffect(() => {
    let alive = true
    getEquippedSticker(post.authorUid).then((s) => {
      if (alive) setSticker(s)
    })
    return () => {
      alive = false
    }
  }, [post.authorUid])

  const stickerEmoji = STICKERS.find((s) => s.id === sticker)?.emoji

  return (
    <div className="bg-panel border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="key bg-ink text-keycap text-xs font-mono px-2 py-1 rounded-key">
            [{badge},{post.accuracy}%,{post.cpm}타]
          </span>
          <Link to={`/profile/${post.authorUid}`} className="text-xs text-muted hover:text-keycap">
            {post.authorGrade}학년 {post.authorClassNum}반 {maskNames ? maskName(post.authorName) : post.authorName}
            {stickerEmoji && <span className="ml-1">{stickerEmoji}</span>}
          </Link>
        </div>
        {date && <span className="text-[11px] text-muted">{date.toLocaleDateString('ko-KR')}</span>}
      </div>

      <Link to={`/sns/${post.id}`} className="group">
        <h3 className="font-display text-lg text-paper group-hover:text-keycap transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-paper/70 line-clamp-2 mt-1">{post.content}</p>
      </Link>

      {post.imageData && (
        <img
          src={post.imageData}
          alt=""
          className="rounded-key w-full max-h-64 object-cover border border-white/10"
        />
      )}

      <div className="flex items-center gap-3 text-xs text-muted">
        <span>♥ {post.likedBy?.length || 0}</span>
        <span>💬 {post.commentCount || 0}</span>
      </div>

      {actions && <div className="flex gap-2 pt-1">{actions}</div>}
    </div>
  )
}
