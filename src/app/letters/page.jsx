'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

/** ========= CONFIG ========= */
const LETTERS = [
	{ ch: 'A', word: 'apple', emoji: '🍎' },
	{ ch: 'B', word: 'ball', emoji: '🟠' },
	{ ch: 'C', word: 'cat', emoji: '🐱' },
	{ ch: 'D', word: 'dog', emoji: '🐶' },
	{ ch: 'E', word: 'egg', emoji: '🥚' },
	{ ch: 'F', word: 'fish', emoji: '🐟' },
	{ ch: 'G', word: 'goat', emoji: '🐐' },
	{ ch: 'H', word: 'hat', emoji: '👒' },
	{ ch: 'I', word: 'igloo', emoji: '🏠' },
	{ ch: 'J', word: 'jelly', emoji: '🍮' },
	{ ch: 'K', word: 'kite', emoji: '🪁' },
	{ ch: 'L', word: 'leaf', emoji: '🍃' },
	{ ch: 'M', word: 'moon', emoji: '🌙' },
	{ ch: 'N', word: 'nest', emoji: '🪺' },
	{ ch: 'O', word: 'orange', emoji: '🍊' },
	{ ch: 'P', word: 'pizza', emoji: '🍕' },
	{ ch: 'Q', word: 'queen', emoji: '👸' },
	{ ch: 'R', word: 'rainbow', emoji: '🌈' },
	{ ch: 'S', word: 'sun', emoji: '☀️' },
	{ ch: 'T', word: 'turtle', emoji: '🐢' },
	{ ch: 'U', word: 'umbrella', emoji: '☂️' },
	{ ch: 'V', word: 'violin', emoji: '🎻' },
	{ ch: 'W', word: 'whale', emoji: '🐳' },
	{ ch: 'X', word: 'xylophone', emoji: '🎼' },
	{ ch: 'Y', word: 'yarn', emoji: '🧶' },
	{ ch: 'Z', word: 'zebra', emoji: '🦓' },
]
const USE_LOWERCASE = false
const BOX_INTERVALS = [0, 15, 45, 120]
const CHOICES = 4
const MASTERY_BOX = 3
const STORE_KEY = 'rapunzel_srs_v1'

/** ========= HELPERS ========= */
const now = () => Date.now()
const toPromptChar = (ch) => (USE_LOWERCASE ? ch.toLowerCase() : ch)
const pickRandom = (arr, n, excludeVal) => {
	const pool = arr.filter((x) => x !== excludeVal)
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[pool[i], pool[j]] = [pool[j], pool[i]]
	}
	return pool.slice(0, n)
}
const speak = (text) => {
	if (typeof window === 'undefined' || !text) return
	const u = new SpeechSynthesisUtterance(text)
	u.lang = 'en-US'
	u.rate = 0.95
	u.pitch = 1
	window.speechSynthesis.cancel()
	window.speechSynthesis.speak(u)
}
const loadProgress = () => {
	if (typeof window === 'undefined') return null
	try {
		const raw = localStorage.getItem(STORE_KEY)
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}
const saveProgress = (obj) => {
	try {
		localStorage.setItem(STORE_KEY, JSON.stringify(obj))
	} catch {}
}
const initDeck = () => {
	const saved = loadProgress()
	if (saved?.cards && Array.isArray(saved.cards)) return saved
	const cards = LETTERS.map((l) => ({
		ch: l.ch,
		box: 0,
		nextAt: 0,
		seen: 0,
		correct: 0,
	}))
	return { cards }
}
const pickNextCard = (cards) => {
	const due = cards.filter((c) => c.nextAt <= now())
	if (due.length > 0) {
		due.sort((a, b) => a.box - b.box || a.nextAt - b.nextAt)
		return due[0]
	}
	return [...cards].sort((a, b) => a.nextAt - b.nextAt)[0]
}

/** ========= UI ========= */
export default function RapunzelLettersSRS() {
	const [deck, setDeck] = useState(() => initDeck())
	const [current, setCurrent] = useState(null)
	const [options, setOptions] = useState([])
	const [message, setMessage] = useState('Tap the right letter!')
	const [sparkle, setSparkle] = useState(false)
	const [shakeKey, setShakeKey] = useState('')
	const [hairWave, setHairWave] = useState(false)
	const [allMastered, setAllMastered] = useState(false)

	const LOOKUP = useMemo(() => {
		const m = new Map()
		LETTERS.forEach((l) => m.set(l.ch, l))
		return m
	}, [])

	const masteredCount = useMemo(
		() => deck.cards.filter((c) => c.box >= MASTERY_BOX).length,
		[deck],
	)
	const masteryPct = Math.round((masteredCount / deck.cards.length) * 100)

	const newTurn = () => {
		const card = pickNextCard(deck.cards)
		setCurrent(card)
		const distractors = pickRandom(
			LETTERS.map((l) => toPromptChar(l.ch)),
			CHOICES - 1,
			toPromptChar(card.ch),
		)
		const mix = [toPromptChar(card.ch), ...distractors].sort(
			() => Math.random() - 0.5,
		)
		setOptions(mix)
		speak(`${toPromptChar(card.ch).toUpperCase()}`)
		setMessage('Tap the right letter!')
	}

	useEffect(() => {
		const done = deck.cards.every((c) => c.box >= MASTERY_BOX)
		setAllMastered(done)
		if (!done) newTurn()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		saveProgress(deck)
	}, [deck])

	useEffect(() => {
		const done = deck.cards.every((c) => c.box >= MASTERY_BOX)
		setAllMastered(done)
		if (done) {
			setSparkle(true)
			setTimeout(() => setSparkle(false), 1200)
			speak('Amazing! You learned all the letters!')
		}
	}, [deck])

	const choose = (picked) => {
		if (!current) return
		const isCorrect = picked === toPromptChar(current.ch)

		setDeck((prev) => {
			const cards = prev.cards.map((c) => {
				if (c.ch !== current.ch) return c
				const next = { ...c }
				next.seen += 1
				if (isCorrect) {
					next.correct += 1
					next.box = Math.min(BOX_INTERVALS.length - 1, c.box + 1)
				} else {
					next.box = 0
				}
				next.nextAt = now() + BOX_INTERVALS[next.box] * 1000
				return next
			})
			return { cards }
		})

		if (isCorrect) {
			setHairWave(true)
			setTimeout(() => setHairWave(false), 500)
			const info = LOOKUP.get(current.ch) || { word: '', emoji: '' }
			setMessage(`Yes! ${toPromptChar(current.ch)} is for ${info.word}.`)
			setSparkle(true)
			setTimeout(() => setSparkle(false), 500)
			setTimeout(newTurn, 450)
		} else {
			setShakeKey(picked)
			setTimeout(() => setShakeKey(''), 400)
			setMessage("Let's try again. Tap the right letter.")
			setTimeout(newTurn, 350)
		}
	}

	const repeatPrompt = () => {
		if (!current) return
		speak(`${toPromptChar(current.ch).toUpperCase()}`)
	}

	const resetAll = () => {
		const fresh = initDeck()
		setDeck(fresh)
		setAllMastered(false)
		setMessage('Tap the right letter!')
		setTimeout(newTurn, 0)
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-sky-300 via-pink-200 to-purple-200 text-slate-900 p-4 relative overflow-hidden">
			{/* confetti sparkle */}
			{sparkle ? (
				<div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
					<div className="text-[18vmin] animate-bounce">✨</div>
					<div className="absolute top-1/4 left-1/4 text-[12vmin] animate-ping">
						⭐
					</div>
					<div
						className="absolute top-1/3 right-1/4 text-[12vmin] animate-ping"
						style={{ animationDelay: '150ms' }}
					>
						🌟
					</div>
					<div
						className="absolute bottom-1/3 left-1/3 text-[12vmin] animate-ping"
						style={{ animationDelay: '300ms' }}
					>
						💫
					</div>
				</div>
			) : null}

			{/* win screen */}
			{allMastered ? (
				<div className="fixed inset-0 z-50 bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-300 flex items-center justify-center p-4">
					<div className="relative z-10 bg-white rounded-3xl border-8 border-yellow-400 shadow-2xl p-8 md:p-12 max-w-3xl w-full text-center space-y-6">
						<div className="relative w-48 h-48 mx-auto rounded-full border-8 border-yellow-400 overflow-hidden shadow-2xl">
							<Image
								src="/rapunzel.jpg"
								alt="Rapunzel celebrating"
								fill
								className="object-cover"
							/>
						</div>
						<div className="text-[16vmin] animate-pulse">👸✨</div>
						<h1 className="text-[6.5vmin] font-black text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 bg-clip-text">
							You Did It!
						</h1>
						<div className="text-[5vmin] font-black text-slate-700">
							All Letters! 🎉
						</div>
						<button
							onClick={resetAll}
							className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white border-8 border-green-700 font-black text-[5vmin] shadow-xl hover:scale-105 transition-all"
						>
							Play Again! 🔄
						</button>
						<Link
							href="/"
							className="inline-block mt-2 px-5 py-3 rounded-xl bg-white border-2 border-slate-800 font-bold shadow hover:scale-105 transition"
						>
							← Home
						</Link>
					</div>
				</div>
			) : null}

			<div className="mx-auto max-w-6xl relative z-10 space-y-4">
				{/* header (kept compact) */}
				<header className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Link
							href="/"
							className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 border-4 border-slate-800 font-black text-lg shadow"
						>
							← Home
						</Link>
						<div className="relative w-16 h-16 rounded-full border-4 border-pink-400 overflow-hidden shadow-lg">
							<Image
								src="/rapunzel.jpg"
								alt="Rapunzel"
								fill
								className="object-cover"
							/>
						</div>
					</div>
					<div className="w-48">
						<div className="text-xs font-bold text-slate-700 mb-1">
							Mastery: {masteredCount}/{deck.cards.length} ({masteryPct}%)
						</div>
						<div className="h-3 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
							<div
								className="h-full bg-emerald-500 transition-[width] duration-500"
								style={{ width: `${masteryPct}%` }}
							/>
						</div>
					</div>
				</header>

				{/* GAME CARD fills remaining viewport height */}
				<section
					className="bg-white rounded-3xl border-8 border-pink-400 shadow-2xl overflow-hidden"
					style={{
						/* header ~72px + page padding; keep card within viewport */
						height: 'calc(100vh - 100px)',
					}}
				>
					<div className="h-full flex flex-col">
						{/* PROMPT area (top) */}
						<div className="flex-[0_0_auto] p-4">
							<div className="rounded-2xl border-8 border-yellow-400 bg-gradient-to-br from-yellow-100 to-amber-100 p-4 text-center">
								{current ? (
									<div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 justify-items-center">
										<div
											className="leading-none select-none"
											style={{ fontSize: 'clamp(40px, 12vmin, 120px)' }}
										>
											{LOOKUP.get(current.ch)?.emoji}
										</div>
										<div className="text-slate-800">
											<div
												className="font-black uppercase leading-none"
												style={{ fontSize: 'clamp(36px, 10vmin, 96px)' }}
											>
												{toPromptChar(current.ch)}
											</div>
											<div
												className="font-bold text-slate-600"
												style={{ fontSize: 'clamp(18px, 4.5vmin, 36px)' }}
											>
												{LOOKUP.get(current.ch)?.word}
											</div>
										</div>
										<button
											onClick={repeatPrompt}
											className="rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 text-white border-4 border-blue-700 font-black shadow hover:scale-105 transition-all px-4 py-3"
											style={{ fontSize: 'clamp(18px, 4.5vmin, 28px)' }}
										>
											🔊 Listen
										</button>
									</div>
								) : null}
							</div>
						</div>

						{/* CHOICES area (bottom) — fixed 2×2, scales to fit */}
						<div className="flex-1 px-4 pb-4">
							<div
								className="grid grid-cols-2 gap-4 h-full"
								/* keep buttons inside without scroll */
								style={{ minHeight: 0 }}
							>
								{options.map((opt) => (
									<button
										key={opt}
										onClick={() => choose(opt)}
										className={[
											'rounded-2xl border-8 bg-gradient-to-br from-white to-slate-50 font-black shadow-2xl hover:scale-105 transition-all [will-change:transform] w-full h-full',
											shakeKey === opt
												? 'shake-no border-red-600 ring-4 ring-red-300 bg-red-50'
												: 'border-purple-400',
										].join(' ')}
										style={{
											fontSize: 'clamp(48px, 16vmin, 120px)',
											lineHeight: 1,
										}}
									>
										{opt}
									</button>
								))}
							</div>

							{/* Message bar (compact) */}
							<div className="mt-3 rounded-xl border-4 border-pink-300 bg-gradient-to-r from-pink-100 to-rose-100 text-center p-3">
								<div
									style={{ fontSize: 'clamp(16px, 3.8vmin, 24px)' }}
									className="font-bold text-slate-800"
								>
									{message}
								</div>
							</div>

							{/* Actions row (compact) */}
							<div className="mt-3 grid grid-cols-2 gap-3">
								<button
									onClick={repeatPrompt}
									className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-400 to-blue-500 text-white border-4 border-indigo-700 font-black shadow hover:scale-105 transition-all"
									style={{ fontSize: 'clamp(16px, 3.8vmin, 22px)' }}
								>
									🔁 Say Again
								</button>
								<button
									onClick={resetAll}
									className="px-4 py-3 rounded-xl bg-gradient-to-r from-slate-200 to-white text-slate-900 border-4 border-slate-600 font-black shadow hover:scale-105 transition-all"
									style={{ fontSize: 'clamp(16px, 3.8vmin, 22px)' }}
								>
									🔄 Start Over
								</button>
							</div>
						</div>
					</div>
				</section>

				{/* Your Letters (kept outside viewport-fit card so main play always fits) */}
				<section className="bg-white rounded-3xl border-8 border-purple-400 p-4 md:p-6 shadow-2xl">
					<h3 className="text-xl md:text-2xl font-black text-purple-700 mb-2">
						Your Letters
					</h3>
					<div className="text-sm md:text-base font-bold text-slate-600 mb-3">
						Green = You know it! ⭐
					</div>
					<div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
						{deck.cards.map((c) => {
							const mastered = c.box >= MASTERY_BOX
							return (
								<div
									key={c.ch}
									className={[
										'rounded-2xl border-4 p-2 text-center font-black',
										mastered
											? 'bg-emerald-100 border-emerald-400'
											: 'bg-slate-100 border-slate-300',
									].join(' ')}
								>
									<div className="text-lg md:text-2xl">
										{toPromptChar(c.ch)}
									</div>
									{mastered && (
										<div className="text-base md:text-xl mt-1">⭐</div>
									)}
								</div>
							)
						})}
					</div>
				</section>
			</div>

			{/* Local keyframes */}
			<style jsx>{`
				@keyframes shake-no {
					0% {
						transform: translateX(0);
					}
					15% {
						transform: translateX(-10px);
					}
					30% {
						transform: translateX(10px);
					}
					45% {
						transform: translateX(-8px);
					}
					60% {
						transform: translateX(8px);
					}
					75% {
						transform: translateX(-5px);
					}
					90% {
						transform: translateX(5px);
					}
					100% {
						transform: translateX(0);
					}
				}
				.shake-no {
					animation: shake-no 0.35s ease-in-out;
				}
			`}</style>
		</div>
	)
}
