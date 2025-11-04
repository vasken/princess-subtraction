'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const ALL_WORDS = [
	// Lesson 1
	'fast',
	'bird',
	'nine',
	'life',
	'since',
	'kill',
	'cannot',
	'egg',
	'water',
	'mark',
	'person',
	'quite',
	'beside',
	'sister',
	'forest',
	// Lesson 2
	'ice',
	'pick',
	'gone',
	'case',
	'face',
	'cage',
	'magic',
	'age',
	'wagon',
	'give',
	'giant',
	'once',
	'danger',
	'places',
	'climb',
	// Lesson 3
	'little',
	'its',
	'rock',
	'under',
	'dead',
	'past',
	'them',
	'caller',
	'dug',
	'does',
	'gobble',
	'bottom',
	'level',
	'felt',
	'next',
	// Lesson 4
	'main',
	'daily',
	'safe',
	'jail',
	'tail',
	'blame',
	'explain',
	'awake',
	'mail',
	'raise',
	'paid',
	'paint',
	'baked',
	'claim',
	'train',
	// Lesson 5
	'alive',
	'grind',
	'pint',
	'drive',
	'diet',
	'size',
	'rise',
	'died',
	'tried',
	'dial',
	'five',
	'pies',
	'inside',
	'cried',
	'island',
]

/** ---------- word list (Belle's library themed) ---------- */
const WORDS = [
	// Lesson 1
	'fast',
	'bird',
	'nine',
	'life',
	'since',
	'kill',
	'cannot',
	/**
	'egg',
	'water',
	'mark',
	'person',
	'quite',
	'beside',
	'sister',
	'forest',
	// Lesson 2
	'ice',
	'pick',
	'gone',
	'case',
	'face',
	'cage',
	'magic',
	'age',
	'wagon',
	'give',
	'giant',
	'once',
	'danger',
	'places',
	'climb',
	// Lesson 3
	'little',
	'its',
	'rock',
	'under',
	'dead',
	'past',
	'them',
	'caller',
	'dug',
	'does',
	'gobble',
	'bottom',
	'level',
	'felt',
	'next',
	// Lesson 4
	'main',
	'daily',
	'safe',
	'jail',
	'tail',
	'blame',
	'explain',
	'awake',
	'mail',
	'raise',
	'paid',
	'paint',
	'baked',
	'claim',
	'train',
	// Lesson 5
	'alive',
	'grind',
	'pint',
	'drive',
	'diet',
	'size',
	'rise',
	'died',
	'tried',
	'dial',
	'five',
	'pies',
	'inside',
	'cried',
	'island',
	*/
]

/* ===================== Helpers ===================== */

// ---- Story library (localStorage) ----
const STORY_STORE_KEY = 'belleStoryLibrary.v1'
const DAILY_NEW_LIMIT = 5

function lsSafeGet(key, fallback) {
	if (typeof window === 'undefined') return fallback
	try {
		const raw = localStorage.getItem(key)
		return raw ? JSON.parse(raw) : fallback
	} catch {
		return fallback
	}
}

function lsSafeSet(key, value) {
	if (typeof window === 'undefined') return
	try {
		localStorage.setItem(key, JSON.stringify(value))
	} catch {
		// ignore quota errors
	}
}

function todayKey() {
	// Uses browser local time (good enough for client-only gating)
	const d = new Date()
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const dd = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${dd}`
}

function loadStoryStore() {
	// Shape: { all: [string], perDay: { 'YYYY-MM-DD': { newCount: number } } }
	const def = { all: [], perDay: {} }
	const data = lsSafeGet(STORY_STORE_KEY, def)
	return {
		all: Array.isArray(data.all) ? data.all : [],
		perDay: data.perDay || {},
	}
}

function saveNewStory(text) {
	const store = loadStoryStore()
	// De-dupe exact matches
	if (!store.all.includes(text)) {
		store.all.push(text)
	}
	const day = todayKey()
	const entry = store.perDay[day] || { newCount: 0 }
	entry.newCount = (entry.newCount || 0) + 1
	store.perDay[day] = entry
	lsSafeSet(STORY_STORE_KEY, store)
	return store
}

function canCreateNewStoryToday() {
	const { perDay } = loadStoryStore()
	const entry = perDay[todayKey()] || { newCount: 0 }
	return (entry.newCount || 0) < DAILY_NEW_LIMIT
}

function pickRandomSavedStory() {
	const { all } = loadStoryStore()
	if (!all.length) return null
	const idx = Math.floor(Math.random() * all.length)
	return all[idx]
}
// crypto-friendly random
const randFloat = () => {
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		const u32 = new Uint32Array(1)
		crypto.getRandomValues(u32)
		return u32[0] / 0x100000000
	}
	return Math.random()
}

const shuffle = (arr) => {
	const a = [...arr]
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(randFloat() * (i + 1))
		;[a[i], a[j]] = [a[j], a[i]]
	}
	return a
}

// Distribute total words across floors as evenly as possible
const distributeCounts = (total, floors) => {
	const base = Math.floor(total / floors)
	const rem = total % floors
	return Array.from({ length: floors }, (_, i) => base + (i < rem ? 1 : 0))
}

/** ---------- Belle's library lessons ---------- */
const FLOORS = 6 // keep shelves visual the same
const BASE_TIME = 60
const STEP_TIME = 5
const MIN_TIME = 5
const timeForRound = (r) => Math.max(MIN_TIME, BASE_TIME - STEP_TIME * (r - 1))

/** ---------- Belle's encouragement ---------- */
const ENCOURAGEMENTS = [
	'"Wonderful! You\'re a natural reader!"',
	'"Oh, that\'s splendid! Just like in my books!"',
	'"Marvelous! Mrs. Potts would be so proud!"',
	'"Excellent! You\'re learning so quickly!"',
	'"Beautiful work! Keep going, dear!"',
]

const LEVEL_MESSAGES = [
	"Let's begin your first lesson!",
	'Wonderful progress, Chip! Belle believes in you!',
	'The Beast is understanding more each day!',
	"Look how far you've come already!",
	"You're becoming quite the scholar!",
	"You've reached the highest shelf—almost there!",
	"Review Time! Let's try the tricky words again!", // NEW: review message slot
]

const speak = (text) => {
	if (typeof window === 'undefined' || !text) return
	const u = new SpeechSynthesisUtterance(text)
	u.rate = 0.95
	u.pitch = 1.0
	u.lang = 'en-US'
	window.speechSynthesis.cancel()
	window.speechSynthesis.speak(u)
}

export default function BelleSpellingGame() {
	// ===== Core game state =====
	const [roundIndex, setRoundIndex] = useState(1) // 1..FLOORS, then review
	const [timeLeft, setTimeLeft] = useState(() => timeForRound(1))
	const [state, setState] = useState('playing') // playing | timeout | victory

	// Shelves (progress)
	const [floorLit, setFloorLit] = useState(0)
	const atTop = useMemo(() => floorLit >= FLOORS - 1, [floorLit])

	// NEW: pool & allocation so every word is covered exactly once across floors
	const perFloorCounts = useMemo(
		() => distributeCounts(WORDS.length, FLOORS),
		[],
	)
	const [pool, setPool] = useState(() => shuffle(WORDS)) // remaining words not yet asked

	// NEW: current round word list (varies in length per floor)
	const [currentRoundWords, setCurrentRoundWords] = useState([])
	const [wordIdx, setWordIdx] = useState(0)
	const currentWord = currentRoundWords[wordIdx] || ''

	const [solved, setSolved] = useState(0)
	const [answer, setAnswer] = useState('')
	const [message, setMessage] = useState('Listen to the word and type it!')
	const [shake, setShake] = useState(false)
	const [sparkle, setSparkle] = useState(false)

	// Track correct/incorrect words over the whole run
	const [usedWords, setUsedWords] = useState([]) // correctly spelled (for story)
	const [missedWords, setMissedWords] = useState([]) // ever missed at least once
	const [unsolvedWords, setUnsolvedWords] = useState([]) // leftovers on timeout/quit

	// NEW: review level flag
	const [isReview, setIsReview] = useState(false)

	// Story UI
	const [story, setStory] = useState('')
	const [storyLoading, setStoryLoading] = useState(false)
	const [storyError, setStoryError] = useState('')
	const [storyFromLibrary, setStoryFromLibrary] = useState(false)

	const intervalRef = useRef(null)
	const inputRef = useRef(null)
	const focusInput = () => inputRef.current?.focus()

	// ====== Round bootstrap ======
	useEffect(() => {
		// Start the very first round from the pool
		if (currentRoundWords.length === 0 && pool.length > 0 && roundIndex === 1) {
			startRound(1)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// ====== Timer ======
	useEffect(() => {
		if (state !== 'playing') return
		if (intervalRef.current) clearInterval(intervalRef.current)
		intervalRef.current = setInterval(() => {
			setTimeLeft((t) => {
				if (t <= 1) {
					clearInterval(intervalRef.current)
					setState('timeout')
					setMessage(
						`Time's up for this lesson! You spelled ${solved}/${currentRoundWords.length} words. Back to the library entrance.`,
					)
					setFloorLit(0)
					setUnsolvedWords(currentRoundWords.slice(wordIdx)) // NEW
					return 0
				}
				return t - 1
			})
		}, 1000)
		return () => intervalRef.current && clearInterval(intervalRef.current)
	}, [state, solved, currentRoundWords, wordIdx])

	// ====== TTS on new word ======
	useEffect(() => {
		if (state !== 'playing' || !currentWord) return
		speak(`Spell: ${currentWord}`)
		focusInput()
	}, [currentWord, state])

	// ====== Round management ======
	function startRound(index) {
		// If we still have floors to cover from the main pool
		if (index >= 1 && index <= FLOORS) {
			const take = perFloorCounts[index - 1]
			setPool((prev) => {
				const chunk = prev.slice(0, take)
				const rest = prev.slice(take)
				setCurrentRoundWords(shuffle(chunk))
				setRoundIndex(index)
				setSolved(0)
				setAnswer('')
				setWordIdx(0)
				setTimeLeft(timeForRound(index))
				setState('playing')
				setUnsolvedWords([])
				setIsReview(false)
				setMessage(`Lesson ${index}: ${take} words in ${timeForRound(index)}s!`)
				focusInput()
				return rest
			})
			return
		}

		// If we finished all floors, decide between review or victory
		if (index > FLOORS) {
			const reviewList = Array.from(new Set(missedWords))
			if (reviewList.length > 0) {
				// Start Review Level
				const reviewWords = shuffle(reviewList)
				setCurrentRoundWords(reviewWords)
				setRoundIndex(FLOORS + 1)
				setSolved(0)
				setAnswer('')
				setWordIdx(0)
				// Keep time generous on review (use floor top time again)
				setTimeLeft(timeForRound(FLOORS))
				setState('playing')
				setUnsolvedWords([])
				setIsReview(true)
				setMessage(
					`Review Level: Let's try ${reviewWords.length} tricky word(s) again!`,
				)
				focusInput()
			} else {
				// Nothing to review -> straight to victory
				setState('victory')
				setMessage("Belle is so proud! You've become a true reader! 📚👑")
				generateStory()
			}
		}
	}

	const nextWord = () => {
		setTimeLeft(timeForRound(isReview ? FLOORS : roundIndex))
		setWordIdx((i) => i + 1)
		setAnswer('')
	}

	const roundSuccess = () => {
		if (intervalRef.current) clearInterval(intervalRef.current)

		if (!isReview) {
			// Progress shelves for main floors only
			const nextFloor = Math.min(FLOORS - 1, floorLit + 1)
			setFloorLit(nextFloor)

			// If we just cleared the top shelf, go to review or victory
			if (nextFloor >= FLOORS - 1) {
				startRound(FLOORS + 1) // triggers review or victory
				return
			}

			// Else, sparkle + next floor
			setSparkle(true)
			setTimeout(() => setSparkle(false), 900)
			startRound(roundIndex + 1)
		} else {
			// Review completed -> victory
			setState('victory')
			setMessage("Belle is so proud! You've become a true reader! 📚👑")
			generateStory()
		}
	}

	// ====== Answer checking ======
	const checkAnswer = () => {
		if (state !== 'playing') return
		const norm = answer.trim().toLowerCase()
		if (!norm) {
			setMessage('Type the word you heard.')
			return
		}
		const target = currentWord
		const roundGoal = currentRoundWords.length

		if (norm === target) {
			const s = solved + 1
			setSolved(s)

			// record correct (avoid duplicates)
			setUsedWords((prev) => (prev.includes(target) ? prev : [...prev, target]))

			const left = roundGoal - s
			const encouragement =
				ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
			setMessage(
				left > 0
					? `✅ Correct! ${encouragement} ${left} more to go.`
					: `✅ ${encouragement}`,
			)

			if (s >= roundGoal) {
				roundSuccess()
				return
			}
			nextWord()
		} else {
			// mark missed at least once
			setMissedWords((prev) =>
				prev.includes(target) ? prev : [...prev, target],
			)

			setShake(true)
			setTimeout(() => setShake(false), 400)
			setMessage(`Not quite, dear. Try again—Belle knows you can do it!`)
		}
	}

	const giveUp = () => {
		if (state !== 'playing') {
			hardReset()
			return
		}
		if (intervalRef.current) clearInterval(intervalRef.current)
		setState('timeout')
		setMessage("Come back when you're ready for another lesson!")
		setFloorLit(0)
		setUnsolvedWords(currentRoundWords.slice(wordIdx))
	}

	useEffect(() => {
		const onKey = (e) => {
			const tag = e.target?.tagName
			if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable)
				return
			if (e.key === 'Enter') {
				e.preventDefault()
				state === 'playing' ? checkAnswer() : hardReset()
			} else if (e.key === 'Escape') {
				e.preventDefault()
				state === 'playing' ? giveUp() : hardReset()
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [state, answer, solved, roundIndex, currentWord])

	const hardReset = () => {
		if (intervalRef.current) clearInterval(intervalRef.current)
		setRoundIndex(1)
		setSolved(0)
		setWordIdx(0)
		setTimeLeft(timeForRound(1))
		setFloorLit(0)
		setState('playing')
		setMessage(LEVEL_MESSAGES[0])
		setAnswer('')
		setUsedWords([])
		setMissedWords([])
		setUnsolvedWords([])
		setStory('')
		setStoryError('')
		setStoryLoading(false)
		setIsReview(false)
		setPool(shuffle(WORDS)) // reset pool
		setCurrentRoundWords([]) // will be set by startRound below
		setTimeout(() => {
			startRound(1)
			speak(`Spell: ${WORDS[0]}`) // quick prompt; actual first word will speak on render
		}, 0)
	}

	// ====== Story (generic route) ======
	const generateStory = async () => {
		try {
			setStory('')
			setStoryError('')
			setStoryLoading(true)

			// If we've already hit the daily new-story cap, serve a random saved story.
			if (!canCreateNewStoryToday()) {
				const cached = pickRandomSavedStory()
				if (cached) {
					setStory(cached)
					setStoryFromLibrary(true)
					return
				}
				// fall through to generate if no cache exists (first-ever day, etc.)
			}

			const vocab = ALL_WORDS.join(', ') //Array.from(new Set(usedWords)).join(', ')
			const prompt = `
Write a short, cozy story for a Grade 2 reader, involving Disney's Belle from Beauty and the Beast.
Use EVERY ONE of these words at least once, naturally: ${vocab}.
Positive, gentle tone. No scary parts.
`.trim()

			const res = await fetch('/api/storycraft', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt }),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data?.error || 'Failed to generate story.')
			const text = (data.story || '').trim()

			// Save every newly generated story
			saveNewStory(text)

			setStory(text)
			setStoryFromLibrary(false)
		} catch (err) {
			setStoryError(err.message || 'Story generation failed.')
		} finally {
			setStoryLoading(false)
		}
	}

	// ====== TTS for story ======
	const readStoryAloud = () => {
		if (!story) return
		const chunks = story.match(/[^.!?]+[.!?]/g) || [story]
		window.speechSynthesis.cancel()
		chunks.forEach((line) => {
			const u = new SpeechSynthesisUtterance(line.trim())
			u.rate = 0.95
			u.pitch = 1.0
			u.lang = 'en-US'
			window.speechSynthesis.speak(u)
		})
	}

	const WordPill = ({ w }) => (
		<span className="inline-block px-2 py-1 rounded-lg bg-amber-100 border border-amber-400 text-amber-900 text-sm mr-1 mb-1">
			{w}
		</span>
	)

	// Derived UI text for header
	const headerMessage = (() => {
		if (isReview) return LEVEL_MESSAGES[6]
		return LEVEL_MESSAGES[Math.min(roundIndex - 1, LEVEL_MESSAGES.length - 2)]
	})()

	return (
		<div className="min-h-screen bg-gradient-to-b from-yellow-100 via-amber-100 to-orange-100 text-slate-900 p-3 md:p-6 lg:p-8">
			{/* sparkle on floor clear */}
			{sparkle ? (
				<div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
					<div className="text-6xl md:text-8xl animate-bounce">✨</div>
					<div className="absolute top-1/4 left-1/4 text-4xl md:text-6xl animate-ping">
						📚
					</div>
					<div
						className="absolute top-1/3 right-1/4 text-4xl md:text-6xl animate-ping"
						style={{ animationDelay: '150ms' }}
					>
						🌹
					</div>
					<div
						className="absolute bottom-1/3 left-1/3 text-4xl md:text-6xl animate-ping"
						style={{ animationDelay: '300ms' }}
					>
						💛
					</div>
				</div>
			) : null}

			{state === 'victory' ? (
				<div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 md:p-4 overflow-auto">
					<div className="grid w-full max-w-6xl gap-3 md:gap-4 lg:grid-cols-2 my-4">
						<div className="rounded-xl md:rounded-2xl overflow-hidden border-4 md:border-8 border-yellow-500 shadow-2xl bg-black">
							<video autoPlay controls className="w-full h-full object-contain">
								<source src="/belle-end.webm" type="video/webm" />
								Your browser does not support the video tag.
							</video>
						</div>

						{/* Story panel */}
						<div className="rounded-xl md:rounded-2xl border-4 md:border-8 border-amber-600 bg-gradient-to-b from-amber-50 to-yellow-50 p-3 md:p-4 flex flex-col">
							<h3 className="text-xl md:text-2xl font-black text-amber-900 mb-2">
								📖 Belle's Library Story
							</h3>
							<div className="text-xs md:text-sm text-amber-800 mb-2 md:mb-3">
								Your story uses every word you spelled correctly:{' '}
								<b>{usedWords.length}</b> words.
							</div>

							<div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3">
								<button
									onClick={generateStory}
									disabled={storyLoading}
									className="px-3 py-2 md:px-4 rounded-lg md:rounded-xl bg-amber-500 text-white border-2 md:border-4 border-amber-700 font-black text-sm md:text-base shadow hover:scale-105 disabled:opacity-60"
								>
									✨ {storyLoading ? 'Making magic…' : 'Generate Story Again'}
								</button>
								<button
									onClick={() => navigator.clipboard.writeText(story || '')}
									disabled={!story}
									className="px-3 py-2 md:px-4 rounded-lg md:rounded-xl bg-yellow-400 text-white border-2 md:border-4 border-yellow-700 font-black text-sm md:text-base shadow hover:scale-105 disabled:opacity-60"
								>
									📋 Copy
								</button>
								<button
									onClick={readStoryAloud}
									disabled={!story}
									className="px-3 py-2 md:px-4 rounded-lg md:rounded-xl bg-emerald-500 text-white border-2 md:border-4 border-emerald-700 font-black text-sm md:text-base shadow hover:scale-105 disabled:opacity-60"
								>
									🔊 Read Aloud
								</button>
							</div>

							<div
								className="rounded-lg md:rounded-xl border-2 md:border-4 border-yellow-600 bg-white p-2 md:p-3 mb-2 md:mb-3 overflow-auto max-h-[40vh] md:max-h-[45vh] lg:max-h-[60vh]"
								role="region"
								aria-label="Generated story"
							>
								{storyError ? (
									<div className="text-red-700 font-bold text-sm md:text-base">
										{storyError}
									</div>
								) : storyLoading ? (
									<div className="animate-pulse text-amber-700 font-bold text-sm md:text-base">
										Creating your story…
									</div>
								) : story ? (
									<p className="whitespace-pre-wrap text-base md:text-lg leading-relaxed text-amber-900">
										{story}
									</p>
								) : (
									<div className="text-amber-800 text-sm md:text-base">
										Press "Generate Story Again" if needed.
									</div>
								)}
							</div>

							{/* Missed-at-least-once list */}
							<div className="rounded-lg md:rounded-xl border-2 md:border-4 border-amber-500 bg-amber-100/70 p-2 md:p-3">
								<div className="font-bold text-amber-900 mb-1 text-sm md:text-base">
									❌ Words you missed at least once:
								</div>
								<div className="flex flex-wrap">
									{missedWords.length ? (
										missedWords.map((w) => <WordPill key={`m-${w}`} w={w} />)
									) : (
										<span className="text-amber-800 text-sm">
											None—perfect run!
										</span>
									)}
								</div>
							</div>
						</div>
					</div>

					<button
						onClick={hardReset}
						className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-4 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white border-2 md:border-4 border-yellow-700 font-black text-lg md:text-2xl shadow-xl hover:scale-105 transition-all"
					>
						📚 PLAY AGAIN
					</button>
				</div>
			) : null}

			<div className="mx-auto max-w-6xl space-y-4 md:space-y-6">
				<header className="text-center">
					<h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-amber-900 mb-2">
						✨ Belle's Library Lesson ✨
					</h1>
					<p className="text-lg md:text-xl font-bold text-amber-800">
						Help Chip learn to read with Belle as your guide!
					</p>
				</header>

				<div
					className={`px-3 py-2 md:px-4 rounded-xl border-4 font-black text-xl md:text-2xl text-center ${
						state === 'playing'
							? timeLeft <= 5
								? 'bg-red-500 text-white border-red-700 animate-pulse'
								: 'bg-yellow-300 border-yellow-600 text-yellow-900'
							: 'bg-slate-200 border-slate-400 text-slate-700'
					}`}
					aria-live="polite"
				>
					⏱️ {timeLeft}s
				</div>

				<section className="grid xl:grid-cols-[1.05fr_0.95fr] gap-4 md:gap-6">
					{/* Left: Library Shelves (progress) */}
					<div className="bg-gradient-to-b from-amber-50 to-yellow-50 rounded-xl md:rounded-2xl border-4 md:border-8 border-amber-800 p-3 md:p-4 lg:p-6 shadow-lg">
						<h2 className="text-2xl md:text-3xl font-black text-amber-900 mb-3 md:mb-4">
							📚 Belle's Library
						</h2>
						<div className="space-y-2 md:space-y-3">
							{Array.from({ length: FLOORS }).map((_, idx) => {
								const level = FLOORS - 1 - idx
								const lit = level <= floorLit
								const isTop = level === FLOORS - 1
								const per = perFloorCounts[level] // NEW: show per-floor target
								return (
									<div
										key={level}
										className={`relative px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border-2 md:border-4 flex items-center justify-between font-bold text-base md:text-lg transition-all ${
											lit
												? 'bg-gradient-to-r from-yellow-200 to-amber-200 border-yellow-600 shadow-md'
												: 'bg-gradient-to-r from-slate-100 to-slate-200 border-slate-400'
										}`}
									>
										<span className="text-amber-900">
											{isTop
												? "Belle's Special Collection"
												: `Shelf ${level + 1}`}{' '}
											<span className="text-amber-700">• {per} words</span>
										</span>
										<span className="text-xl md:text-2xl">
											{isTop ? '👑' : '📖'} {lit ? '✨' : '🌙'}
										</span>
									</div>
								)
							})}
							{/* NEW: Review indicator (after shelves) */}
							<div
								className={`relative px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border-2 md:border-4 flex items-center justify-between font-bold text-base md:text-lg transition-all ${
									isReview
										? 'bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-600'
										: 'bg-gradient-to-r from-slate-100 to-slate-200 border-slate-400'
								}`}
							>
								<span className="text-amber-900">Review Level</span>
								<span className="text-xl md:text-2xl">🔁</span>
							</div>
						</div>
						<div className="mt-3 md:mt-4 text-center font-bold text-amber-900 text-base md:text-lg">
							{atTop && !isReview
								? '🎉 Every shelf glows with magic!'
								: `${Math.min(floorLit + 1, FLOORS)}/${FLOORS} shelves lit`}
						</div>
					</div>

					<div className="bg-gradient-to-b from-amber-50 to-yellow-50 rounded-xl md:rounded-2xl border-4 md:border-8 border-yellow-600 p-4 md:p-6 lg:p-8 flex flex-col gap-3 md:gap-4 shadow-lg">
						<h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-center text-amber-900">
							🔊 Spelling Lesson
						</h1>

						<div className="text-center font-bold text-base md:text-lg text-amber-800">
							{headerMessage}
						</div>

						<div className="text-center font-bold text-amber-900 text-sm md:text-base">
							{isReview ? (
								<>
									Review • Word {solved}/{currentRoundWords.length}
								</>
							) : (
								<>
									Lesson {roundIndex} • Word {solved}/{currentRoundWords.length}
								</>
							)}
						</div>

						{/* progress bar */}
						<div className="h-2 md:h-3 rounded-full bg-slate-200 overflow-hidden border-2 border-amber-800">
							<div
								className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-[width] duration-300"
								style={{
									width: `${
										currentRoundWords.length
											? (solved / currentRoundWords.length) * 100
											: 0
									}%`,
								}}
							/>
						</div>

						<div className="rounded-xl md:rounded-2xl border-4 md:border-8 border-yellow-500 bg-gradient-to-br from-yellow-100 to-amber-100 p-4 md:p-6 flex items-center justify-center">
							<button
								onClick={() => speak(`Spell: ${currentWord}`)}
								className="px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-2 md:border-4 border-amber-700 font-black text-xl md:text-2xl shadow-lg hover:scale-105 transition-transform"
							>
								🔊 Hear the Word
							</button>
						</div>

						{state === 'playing' ? (
							<>
								<label className="text-base md:text-lg font-bold text-amber-900 text-center">
									Belle says: "Type what you hear, dear!"
								</label>
								<input
									ref={inputRef}
									type="text"
									autoCapitalize="none"
									autoCorrect="off"
									spellCheck={false}
									value={answer}
									onChange={(e) =>
										setAnswer(
											e.target.value.replace(/[^a-zA-Z'-]/g, '').toLowerCase(),
										)
									}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											e.stopPropagation()
											checkAnswer()
										} else if (e.key === 'Escape') {
											e.preventDefault()
											e.stopPropagation()
											giveUp()
										}
									}}
									className={`px-4 py-4 md:px-6 md:py-5 rounded-xl md:rounded-2xl border-4 text-3xl md:text-4xl font-black text-center bg-white focus:outline-none focus:ring-4 md:focus:ring-8 [will-change:transform] transition-colors ${
										shake
											? 'shake-no border-red-600 ring-4 ring-red-400'
											: 'border-yellow-500 focus:ring-amber-500'
									}`}
									placeholder="type here…"
									autoFocus
								/>

								<div className="flex flex-wrap items-center gap-2 md:gap-3">
									<button
										onClick={checkAnswer}
										className="flex-1 min-w-[120px] px-4 py-3 md:px-6 md:py-5 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 md:border-4 border-green-700 font-black text-lg md:text-2xl shadow hover:scale-105 transition-transform"
									>
										✅ Check
									</button>
									<button
										onClick={() => speak(`Spell: ${currentWord}`)}
										className="px-4 py-3 md:px-6 md:py-5 rounded-xl md:rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-2 md:border-4 border-yellow-700 font-black text-base md:text-xl shadow hover:scale-105 transition-transform"
									>
										🔁 Repeat
									</button>
									<button
										onClick={giveUp}
										className="px-4 py-3 md:px-6 md:py-5 rounded-xl md:rounded-2xl bg-gradient-to-r from-slate-400 to-slate-500 text-white border-2 md:border-4 border-slate-700 font-black text-base md:text-xl shadow hover:scale-105 transition-transform"
									>
										🏳️ Quit
									</button>
								</div>
							</>
						) : (
							<div className="space-y-3">
								<div className="text-center text-xl md:text-2xl font-bold text-amber-900">
									{message}
								</div>
								{state === 'timeout' && (
									<div className="grid gap-2 md:gap-3">
										<div className="rounded-lg md:rounded-xl border-2 md:border-4 border-amber-500 bg-amber-100/70 p-2 md:p-3">
											<div className="font-bold text-amber-900 mb-1 text-sm md:text-base">
												❌ Words you missed at least once:
											</div>
											<div className="flex flex-wrap">
												{missedWords.length ? (
													missedWords.map((w) => (
														<WordPill key={`m2-${w}`} w={w} />
													))
												) : (
													<span className="text-amber-800 text-sm">
														None this time!
													</span>
												)}
											</div>
										</div>
										<div className="rounded-lg md:rounded-xl border-2 md:border-4 border-yellow-500 bg-yellow-100/70 p-2 md:p-3">
											<div className="font-bold text-amber-900 mb-1 text-sm md:text-base">
												⏳ Unsolved this round:
											</div>
											<div className="flex flex-wrap">
												{unsolvedWords.length ? (
													unsolvedWords.map((w) => (
														<WordPill key={`u-${w}`} w={w} />
													))
												) : (
													<span className="text-amber-800 text-sm">
														You finished the list!
													</span>
												)}
											</div>
										</div>
									</div>
								)}
								<button
									onClick={hardReset}
									className="w-full px-4 py-4 md:px-6 md:py-5 rounded-xl md:rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-2 md:border-4 border-yellow-700 font-black text-xl md:text-2xl shadow hover:scale-105 transition-transform"
								>
									{state === 'victory'
										? '📚 Another Lesson (Enter)'
										: '🔄 New Lesson (Enter)'}
								</button>
							</div>
						)}

						<div
							className="mt-2 text-center text-xs md:text-sm font-bold text-amber-800"
							aria-live="polite"
						>
							{state === 'playing'
								? `Enter = Check • Esc = Quit • Time: ${timeForRound(
										isReview ? FLOORS : roundIndex,
								  )}s`
								: 'Press Enter for a new lesson'}
						</div>

						<div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg md:rounded-xl p-3 md:p-4 text-center border-2 md:border-4 border-yellow-500 min-h-[60px] md:min-h-[80px] flex items-center justify-center shadow">
							<div className="text-base md:text-lg font-bold text-amber-900">
								{message}
							</div>
						</div>
					</div>
				</section>
			</div>

			{/* shake animation */}
			<style jsx>{`
				@keyframes shake-no {
					0% {
						transform: translateX(0);
					}
					15% {
						transform: translateX(-8px);
					}
					30% {
						transform: translateX(8px);
					}
					45% {
						transform: translateX(-6px);
					}
					60% {
						transform: translateX(6px);
					}
					75% {
						transform: translateX(-4px);
					}
					90% {
						transform: translateX(4px);
					}
					100% {
						transform: translateX(0);
					}
				}
				.shake-no {
					animation: shake-no 0.4s ease-in-out;
				}
			`}</style>
		</div>
	)
}
