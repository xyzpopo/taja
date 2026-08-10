import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AvatarWithStickers from './AvatarWithStickers'
import { getAuthorVisuals } from '../utils/authorVisualsCache'
import { maskName } from '../utils/maskName'

// uid, name, grade, classNum: 표시할 작성자 정보. size: 아바타 크기('sm'|'md'|'lg')
export default function AuthorBadge({ uid, name, grade, classNum, size = 'sm', showClass = true, mask = true }) {
  const [visuals, setVisuals] = useState({ avatarData: '', equippedStickers: {} })

  useEffect(() => {
    let alive = true
    getAuthorVisuals(uid).then((v) => {
      if (alive) setVisuals(v)
    })
    return () => {
      alive = false
    }
  }, [uid])

  return (
    <Link to={`/profile/${uid}`} className="flex items-center gap-2 group">
      <AvatarWithStickers
        avatarData={visuals.avatarData}
        name={name}
        equippedStickers={visuals.equippedStickers}
        size={size}
      />
      <span className="text-xs text-muted group-hover:text-keycap">
        {showClass && `${grade}학년 ${classNum}반 `}
        {mask ? maskName(name) : name}
      </span>
    </Link>
  )
}
