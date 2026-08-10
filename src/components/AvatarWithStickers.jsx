import { STICKERS, STICKER_POSITION_STYLE } from '../utils/pointsConfig'

const SIZE_CLASS = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-14 h-14 text-lg',
  lg: 'w-20 h-20 text-2xl',
}
const STICKER_SIZE_CLASS = {
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-xl',
}

// avatarData: base64 이미지 문자열(없으면 이니셜로 대체)
// equippedStickers: { 'top-left': 'heart', 'top-right': 'star', ... } 형태
export default function AvatarWithStickers({ avatarData, name, equippedStickers, size = 'md' }) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md
  const stickerSizeClass = STICKER_SIZE_CLASS[size] || STICKER_SIZE_CLASS.md
  const entries = Object.entries(equippedStickers || {}).filter(([, stickerId]) => stickerId)

  return (
    <div className={`relative shrink-0 ${sizeClass}`}>
      {avatarData ? (
        <img src={avatarData} alt="" className={`w-full h-full rounded-full object-cover border border-white/15`} />
      ) : (
        <div className="w-full h-full rounded-full bg-ink border border-white/15 flex items-center justify-center text-muted">
          {name?.[0] ?? '?'}
        </div>
      )}
      {entries.map(([position, stickerId]) => {
        const sticker = STICKERS.find((s) => s.id === stickerId)
        if (!sticker) return null
        return (
          <span
            key={position}
            className={`absolute ${STICKER_POSITION_STYLE[position]} ${stickerSizeClass} leading-none`}
          >
            {sticker.emoji}
          </span>
        )
      })}
    </div>
  )
}
