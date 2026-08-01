import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import PostCard from '../components/PostCard'

export default function SNS() {
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, 'posts'),
          where('deleted', '==', false),
          orderBy('createdAt', 'desc'),
          limit(40),
        )
        const snap = await getDocs(q)
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [])

  // 최근 40개 게시물 안에서만 검색합니다(간단한 클라이언트 필터링).
  const filtered = posts?.filter((p) => {
    if (!keyword.trim()) return true
    const k = keyword.trim().toLowerCase()
    return p.title?.toLowerCase().includes(k) || p.content?.toLowerCase().includes(k)
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-keycap mb-1">SNS</h1>
      <p className="text-muted text-sm mb-4">친구들의 한타·영타 연습 결과를 구경해보세요.</p>

      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="제목/내용 검색 (최근 게시물 안에서)"
        className="input-base w-full mb-6"
      />

      {error && <p className="text-coral text-sm mb-4">{error}</p>}
      {!posts && !error && <p className="text-muted text-sm">불러오는 중...</p>}
      {filtered?.length === 0 && <p className="text-muted text-sm">해당하는 게시물이 없어요.</p>}

      <div className="flex flex-col gap-4">
        {filtered?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
