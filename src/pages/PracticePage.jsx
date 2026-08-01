import { useMemo, useState } from 'react'
import { addDoc, collection, doc, runTransaction, serverTimestamp, updateDoc, increment, setDoc } from 'firebase/firestore'
import TypingTest from '../components/TypingTest'
import TypingCarousel from '../components/TypingCarousel'
import VirtualKeyboard from '../components/VirtualKeyboard'
import { unitToKey } from '../utils/keyboardLayout'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import koreanHomeLessons from '../data/koreanHomeLessons'
import englishHomeLessons from '../data/englishHomeLessons'
import koreanWordLessons from '../data/koreanWordLessons'
import englishWordLessons from '../data/englishWordLessons'
import koreanTexts from '../data/koreanTexts'
import koreanLongTexts from '../data/koreanLongTexts'
import englishTexts from '../data/englishTexts'
import englishLongTexts from '../data/englishLongTexts'
import { containsBannedWords } from '../utils/profanityFilter'
import { compressImageToDataUrl } from '../utils/imageCompress'
import { STAGES } from '../utils/stages'
import { POINTS_PER_PRACTICE, POINTS_PER_POST, postLimitForPoints } from '../utils/pointsConfig'
import { computeStreakUpdate } from '../utils/streak'
import { buildSessionItems } from '../utils/sessionItems'
import { applyContestScoring } from '../utils/contests'

const SESSION_COUNTS = { home: 100, word: 50, sentence: 25 }

const LONG_TEXT_SETS = { korean: koreanLongTexts, english: englishLongTexts }
const HOME_LESSON_SETS = { korean: koreanHomeLessons, english: englishHomeLessons }
const WORD_LESSON_SETS = { korean: koreanWordLessons, english: englishWordLessons }

const STAGE_DESC = {
  home: '키보드 자리를 손에 익히는 첫 단계예요.',
  word: '짧은 낱말로 실전 감각을 익혀요.',
  sentence: '한 문장을 끝까지 입력해봐요.',
  long: '애국가, 짧은 이야기 등 긴 글을 연습해요.',
}

export default function PracticePage({ type }) {
  const { profile, currentUser } = useAuth()
  const [stage, setStage] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [sessionSeed, setSessionSeed] = useState(0)

  // 자리연습/단어연습은 둘 다 6단계 레슨을 고르고 나서 시작합니다.
  const needsLessonMenu = stage === 'home' || stage === 'word'
  const lessonSet = stage === 'home' ? HOME_LESSON_SETS[type] : stage === 'word' ? WORD_LESSON_SETS[type] : null

  const itemPool = useMemo(() => {
    if (!stage || stage === 'long') return []
    if (stage === 'home') return lessonSet?.find((l) => l.id === lesson)?.keys ?? []
    if (stage === 'word') return lessonSet?.find((l) => l.id === lesson)?.words ?? []
    return type === 'korean' ? koreanTexts : englishTexts // sentence
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, stage, lesson])

  const items = useMemo(() => {
    if (!stage || stage === 'long') return []
    return buildSessionItems(itemPool, SESSION_COUNTS[stage])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemPool, stage, sessionSeed])

  const [lastResult, setLastResult] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', image: null })
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)
  const [error, setError] = useState('')

  const suspended = profile?.status === 'suspended'

  function resetResult() {
    setLastResult(null)
    setSharing(false)
    setPosted(false)
    setError('')
  }

  function handleSelectStage(nextStage) {
    setStage(nextStage)
    setLesson(null)
    setSessionSeed(0)
    resetResult()
  }

  function handleSelectLesson(nextLesson) {
    setLesson(nextLesson)
    setSessionSeed(0)
    resetResult()
  }

  function handleBackToStages() {
    setStage(null)
    setLesson(null)
    resetResult()
  }

  function handleBackToLessons() {
    setLesson(null)
    resetResult()
  }

  function handleCarouselRestart() {
    setSessionSeed((s) => s + 1)
    resetResult()
  }

  async function handleFinish(result) {
    setLastResult(result)
    setSharing(false)
    setPosted(false)
    setForm({ title: '', content: '', image: null })

    // 자리연습(home)은 타수를 측정하지 않으므로 랭킹용 기록은 남기지 않습니다.
    if (stage !== 'home') {
      try {
        await addDoc(collection(db, 'scores'), {
          uid: currentUser.uid,
          name: profile.name,
          grade: profile.grade,
          classNum: profile.classNum,
          type: result.type,
          stage,
          accuracy: result.accuracy,
          cpm: result.cpm,
          createdAt: serverTimestamp(),
        })

        const bestRef = doc(db, 'bestScores', `${currentUser.uid}_${result.type}_${stage}`)
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(bestRef)
          const prevCpm = snap.exists() ? snap.data().cpm : -1
          if (result.cpm > prevCpm) {
            tx.set(bestRef, {
              uid: currentUser.uid,
              name: profile.name,
              grade: profile.grade,
              classNum: profile.classNum,
              type: result.type,
              stage,
              accuracy: result.accuracy,
              cpm: result.cpm,
              updatedAt: serverTimestamp(),
            })
          }
        })
      } catch (err) {
        console.error('score save failed', err)
      }

      try {
        await applyContestScoring(db, {
          type: result.type,
          stage,
          cpm: result.cpm,
          profile,
          uid: currentUser.uid,
        })
      } catch (err) {
        console.error('contest scoring failed', err)
      }
    }

    // 포인트 적립 + 열정 점수(연속 연습일) 갱신
    try {
      const userRef = doc(db, 'users', currentUser.uid)
      const streakUpdate = computeStreakUpdate(profile.streakCount, profile.lastPracticeDate)
      await updateDoc(userRef, {
        points: increment(POINTS_PER_PRACTICE),
        ...(streakUpdate || {}),
      })

      if (streakUpdate) {
        await setDoc(doc(db, 'passionScores', currentUser.uid), {
          uid: currentUser.uid,
          name: profile.name,
          grade: profile.grade,
          classNum: profile.classNum,
          streakCount: streakUpdate.streakCount,
          updatedAt: serverTimestamp(),
        })
      }
    } catch (err) {
      console.error('points/streak update failed', err)
    }
  }

  async function handleShare(e) {
    e.preventDefault()
    if (!lastResult) return
    setError('')

    if (containsBannedWords(form.title) || containsBannedWords(form.content)) {
      setError('제목이나 내용에 부적절한 표현이 포함되어 있어 게시할 수 없어요.')
      return
    }

    const postLimit = postLimitForPoints(profile.points || 0)
    if (form.content.length > postLimit) {
      setError(`아직 내용은 ${postLimit}자까지 쓸 수 있어요. 포인트를 더 모으면 늘어나요.`)
      return
    }

    setPosting(true)
    try {
      let imageData = ''
      if (form.image) {
        imageData = await compressImageToDataUrl(form.image)
      }

      await addDoc(collection(db, 'posts'), {
        authorUid: currentUser.uid,
        authorName: profile.name,
        authorGrade: profile.grade,
        authorClassNum: profile.classNum,
        authorNumber: profile.number,
        type: lastResult.type,
        accuracy: lastResult.accuracy,
        cpm: lastResult.cpm,
        title: form.title,
        content: form.content,
        imageData,
        deleted: false,
        likedBy: [],
        commentCount: 0,
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'users', currentUser.uid), { points: increment(POINTS_PER_POST) })
      setPosted(true)
      setSharing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-keycap mb-1">
        {type === 'korean' ? '한타 연습' : '영타 연습'}
      </h1>

      {!stage && (
        <>
          <p className="text-muted text-sm mb-6">어떤 단계로 연습할까요?</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectStage(s.id)}
                className="bg-panel border border-white/10 rounded-2xl p-6 text-left hover:border-keycap/50 transition-colors"
              >
                <h2 className="font-display text-xl text-keycap mb-1">{s.label}</h2>
                <p className="text-sm text-paper/70">{STAGE_DESC[s.id]}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {stage && needsLessonMenu && !lesson && (
        <>
          <button onClick={handleBackToStages} className="text-xs text-muted hover:text-keycap mb-4">
            ← 단계 선택으로
          </button>
          <p className="text-muted text-sm mb-6">
            {stage === 'home'
              ? '자리연습은 6단계로 나뉘어요. 순서대로 연습해보세요.'
              : '단어연습도 6단계로 나뉘어요. 각 단계는 자리연습에서 배운 자모/키까지만 사용한 낱말이에요.'}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {lessonSet.map((l) => (
              <button
                key={l.id}
                onClick={() => handleSelectLesson(l.id)}
                className="bg-panel border border-white/10 rounded-2xl p-6 text-left hover:border-keycap/50 transition-colors"
              >
                <p className="font-display text-xl text-keycap mb-2">{l.label}</p>
                {stage === 'home' ? (
                  <VirtualKeyboard mode={type} activeKeys={l.keys.map(unitToKey)} compact />
                ) : (
                  <p className="text-sm font-mono text-paper/70">{l.words.slice(0, 4).join(', ')} ...</p>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {stage && (!needsLessonMenu || lesson) && (
        <>
          <button
            onClick={needsLessonMenu ? handleBackToLessons : handleBackToStages}
            className="text-xs text-muted hover:text-keycap mb-4"
          >
            ← {needsLessonMenu ? `${stage === 'home' ? '자리연습' : '단어연습'} 단계 선택으로` : '단계 선택으로'}
          </button>

          {stage === 'long' ? (
            <>
              <p className="text-muted text-sm mb-6">
                문장을 끝까지 입력하면 정확도와 분당 타수가 계산돼요. 결과는 SNS에 공유할 수도 있어요.
              </p>
              <TypingTest
                key={`${stage}-long`}
                type={type}
                texts={LONG_TEXT_SETS[type]}
                onFinish={handleFinish}
                showKeyboard={false}
              />
            </>
          ) : (
            <>
              <p className="text-muted text-sm mb-6">
                {stage === 'home'
                  ? `가운데 문제를 한 번 입력하면 바로 다음으로 넘어가요. 총 ${items.length}문제예요.`
                  : `가운데 문제를 입력하고, 다 쓰면 스페이스나 엔터로 다음으로 넘어가요. 총 ${items.length}문제예요.`}
              </p>
              <TypingCarousel
                key={`${stage}-${lesson ?? ''}-${sessionSeed}`}
                type={type}
                items={items}
                onFinish={handleFinish}
                onRestart={handleCarouselRestart}
                showKeyboard={stage === 'home' || stage === 'word'}
                trackSpeed={stage !== 'home'}
                autoAdvance={stage === 'home'}
              />
            </>
          )}

          {lastResult && !posted && (
            <div className="mt-6">
              {!sharing ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setSharing(true)}
                    disabled={suspended}
                    className="key bg-mint text-ink font-semibold px-4 py-2 rounded-key disabled:opacity-50"
                  >
                    결과 SNS에 공유하기
                  </button>
                  {suspended && (
                    <span className="text-xs text-coral self-center">게시물 작성이 정지된 상태입니다.</span>
                  )}
                </div>
              ) : (
                <form onSubmit={handleShare} className="bg-panel border border-white/10 rounded-2xl p-5 flex flex-col gap-3 mt-2">
                  <input
                    placeholder="제목"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="input-base"
                    required
                  />
                  <textarea
                    placeholder="내용"
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    maxLength={postLimitForPoints(profile.points || 0)}
                    className="input-base min-h-24"
                    required
                  />
                  <p className="text-[11px] text-muted -mt-2">
                    {form.content.length}/{postLimitForPoints(profile.points || 0)}자 · 포인트를 모으면 늘어나요
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.files?.[0] ?? null }))}
                    className="text-sm text-muted"
                  />
                  {error && <p className="text-coral text-sm">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={posting}
                      className="key bg-keycap text-ink font-semibold px-4 py-2 rounded-key disabled:opacity-60"
                    >
                      {posting ? '게시 중...' : '게시하기'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSharing(false)}
                      className="px-4 py-2 text-sm text-muted hover:text-paper"
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {posted && <p className="mt-6 text-mint text-sm">게시물이 SNS에 공유되었습니다. 🎉</p>}
        </>
      )}
    </div>
  )
}
