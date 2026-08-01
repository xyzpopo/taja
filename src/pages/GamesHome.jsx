import { Link } from 'react-router-dom'

const GAMES = [
  { id: 'maze', to: '/games/maze', title: '미로찾기', desc: '출발점에서 도착점까지 길을 찾아보세요.', accentClass: 'text-keycap' },
  { id: 'memory', to: '/games/memory', title: '순서기억', desc: '불빛이 켜진 순서를 그대로 따라 눌러보세요.', accentClass: 'text-mint' },
  { id: 'cards', to: '/games/cards', title: '카드 짝맞추기', desc: '같은 그림 카드 두 장을 찾아 짝지어보세요.', accentClass: 'text-coral' },
]

export default function GamesHome() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-keycap mb-1">두뇌 게임</h1>
      <p className="text-muted text-sm mb-8">타자 연습 전후로 머리를 잠깐 식혀보세요.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            to={g.to}
            className="bg-panel border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-colors"
          >
            <h2 className={`font-display text-xl mb-2 ${g.accentClass}`}>{g.title}</h2>
            <p className="text-sm text-paper/70">{g.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
