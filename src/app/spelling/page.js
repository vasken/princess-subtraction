'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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

const pickRoundWords = (roundIdx, n) => {
	const seed = roundIdx * 1337
	const arr = [...WORDS]
	for (let i = arr.length - 1; i > 0; i--) {
		const j = (i + seed) % (i + 1)
		;[arr[i], arr[j]] = [arr[j], arr[i]]
	}
	return arr.slice(0, n)
}

/** ---------- Belle's library lessons ---------- */
const FLOORS = 6
const WORDS_PER_ROUND = 7
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
	"You've mastered the library! Belle is beaming with pride!",
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
	const [roundIndex, setRoundIndex] = useState(1)
	const [timeLeft, setTimeLeft] = useState(() => timeForRound(1))
	const [state, setState] = useState('playing')

	const [floorLit, setFloorLit] = useState(0)
	const atTop = useMemo(() => floorLit >= FLOORS - 1, [floorLit])

	const [solved, setSolved] = useState(0)
	const roundWords = useMemo(
		() => pickRoundWords(roundIndex, WORDS_PER_ROUND),
		[roundIndex],
	)
	const [wordIdx, setWordIdx] = useState(0)
	const currentWord = roundWords[wordIdx] || ''

	const [answer, setAnswer] = useState('')
	const [message, setMessage] = useState('Listen to the word and type it!')
	const [shake, setShake] = useState(false)
	const [sparkle, setSparkle] = useState(false)

	const intervalRef = useRef(null)
	const inputRef = useRef(null)

	const focusInput = () => inputRef.current?.focus()

	useEffect(() => {
		if (state !== 'playing') return
		if (intervalRef.current) clearInterval(intervalRef.current)
		intervalRef.current = setInterval(() => {
			setTimeLeft((t) => {
				if (t <= 1) {
					clearInterval(intervalRef.current)
					setState('timeout')
					setMessage(
						`Time's up for this lesson! You spelled ${solved}/${WORDS_PER_ROUND} words. Back to the library entrance.`,
					)
					setFloorLit(0)
					return 0
				}
				return t - 1
			})
		}, 1000)
		return () => intervalRef.current && clearInterval(intervalRef.current)
	}, [state, solved])

	useEffect(() => {
		if (state !== 'playing' || !currentWord) return
		speak(`Spell: ${currentWord}`)
		focusInput()
	}, [currentWord, state])

	const nextWord = () => {
		setTimeLeft(timeForRound(1))
		setWordIdx((i) => i + 1)
		setAnswer('')
	}

	const startNextRound = () => {
		const next = roundIndex + 1
		const t = timeForRound(next)
		setRoundIndex(next)
		setSolved(0)
		setAnswer('')
		setWordIdx(0)
		setTimeLeft(t)
		setState('playing')
		setMessage(`Lesson ${next}: ${WORDS_PER_ROUND} words in ${t}s!`)
		focusInput()
	}

	const roundSuccess = () => {
		const nextFloor = Math.min(FLOORS - 1, floorLit + 1)
		setFloorLit(nextFloor)
		if (intervalRef.current) clearInterval(intervalRef.current)

		if (nextFloor >= FLOORS - 1) {
			setState('victory')
			setMessage("Belle is so proud! You've become a true reader! 📚👑")
			return
		}

		setSparkle(true)
		setTimeout(() => setSparkle(false), 900)

		startNextRound()
	}

	const checkAnswer = () => {
		if (state !== 'playing') return
		const norm = answer.trim().toLowerCase()
		if (!norm) {
			setMessage('Type the word you heard.')
			return
		}
		if (norm === currentWord) {
			const s = solved + 1
			setSolved(s)
			const left = WORDS_PER_ROUND - s
			const encouragement =
				ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
			setMessage(
				left > 0
					? `✅ Correct! ${encouragement} ${left} more to go.`
					: `✅ ${encouragement}`,
			)
			if (s >= WORDS_PER_ROUND) {
				roundSuccess()
				return
			}
			nextWord()
		} else {
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
	}, [state, answer, solved, roundIndex, floorLit, currentWord])

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
		focusInput()
		setTimeout(() => speak(`Spell: ${pickRoundWords(1, 1)[0]}`), 0)
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-yellow-100 via-amber-100 to-orange-100 text-slate-900 p-4 md:p-8">
			{/* sparkle on floor clear */}
			{sparkle ? (
				<div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
					<div className="text-8xl animate-bounce">✨</div>
					<div className="absolute top-1/4 left-1/4 text-6xl animate-ping">
						📚
					</div>
					<div
						className="absolute top-1/3 right-1/4 text-6xl animate-ping"
						style={{ animationDelay: '150ms' }}
					>
						🌹
					</div>
					<div
						className="absolute bottom-1/3 left-1/3 text-6xl animate-ping"
						style={{ animationDelay: '300ms' }}
					>
						💛
					</div>
				</div>
			) : null}

			{/* victory overlay with video */}
			{state === 'victory' ? (
				<div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
					<video
						autoPlay
						controls
						className="w-full h-full max-w-4xl max-h-screen object-contain rounded-2xl border-8 border-yellow-500 shadow-2xl"
						onEnded={() => {
							// Optionally show the button after video ends
							// This keeps the video as the main focus
						}}
					>
						<source src="/belle-end.webm" type="video/webm" />
						Your browser does not support the video tag.
					</video>
					<button
						onClick={hardReset}
						className="absolute bottom-6 right-6 px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white border-4 border-yellow-700 font-black text-2xl shadow-xl hover:scale-105 transition-all"
					>
						📚 PLAY AGAIN
					</button>
				</div>
			) : null}

			<div className="mx-auto max-w-5xl space-y-6">
				<header className="text-center">
					<h1 className="text-4xl md:text-5xl font-black text-amber-900 mb-2">
						✨ Belle's Library Lesson ✨
					</h1>
					<p className="text-xl font-bold text-amber-800">
						Help Chip learn to read with Belle as your guide!
					</p>
				</header>

				<div
					className={`px-4 py-2 rounded-xl border-4 font-black text-2xl text-center ${
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

				<section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
					{/* Left: Library Shelves (progress) */}
					<div className="bg-gradient-to-b from-amber-50 to-yellow-50 rounded-2xl border-8 border-amber-800 p-4 md:p-6 shadow-lg">
						<h2 className="text-3xl font-black text-amber-900 mb-4">
							📚 Belle's Library
						</h2>
						<div className="space-y-3">
							{Array.from({ length: FLOORS }).map((_, idx) => {
								const level = FLOORS - 1 - idx
								const lit = level <= floorLit
								const isTop = level === FLOORS - 1
								return (
									<div
										key={level}
										className={`relative px-4 py-3 rounded-xl border-4 flex items-center justify-between font-bold text-lg transition-all ${
											lit
												? 'bg-gradient-to-r from-yellow-200 to-amber-200 border-yellow-600 shadow-md'
												: 'bg-gradient-to-r from-slate-100 to-slate-200 border-slate-400'
										}`}
									>
										<span className="text-amber-900">
											{isTop
												? "Belle's Special Collection"
												: `Shelf ${level + 1}`}
										</span>
										<span className="text-2xl">
											{isTop ? '👑' : '📖'} {lit ? '✨' : '🌙'}
										</span>
									</div>
								)
							})}
						</div>
						<div className="mt-4 text-center font-bold text-amber-900">
							{atTop
								? '🎉 Every shelf glows with magic!'
								: `${floorLit + 1}/${FLOORS} shelves lit`}
						</div>
					</div>

					{/* Right: Lesson Area */}
					<div className="bg-gradient-to-b from-amber-50 to-yellow-50 rounded-2xl border-8 border-yellow-600 p-6 md:p-8 flex flex-col gap-4 shadow-lg">
						<h1 className="text-3xl md:text-4xl font-black text-center text-amber-900">
							🔊 Spelling Lesson
						</h1>

						<div className="text-center font-bold text-lg text-amber-800">
							{
								LEVEL_MESSAGES[
									Math.min(roundIndex - 1, LEVEL_MESSAGES.length - 1)
								]
							}
						</div>

						<div className="text-center font-bold text-amber-900">
							Lesson {roundIndex} • Word {solved}/{WORDS_PER_ROUND}
						</div>

						{/* progress bar */}
						<div className="h-3 rounded-full bg-slate-200 overflow-hidden border-2 border-amber-800">
							<div
								className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-[width] duration-300"
								style={{ width: `${(solved / WORDS_PER_ROUND) * 100}%` }}
							/>
						</div>

						{/* speaker card */}
						<div className="rounded-2xl border-8 border-yellow-500 bg-gradient-to-br from-yellow-100 to-amber-100 p-6 flex items-center justify-center">
							<button
								onClick={() => speak(`Spell: ${currentWord}`)}
								className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-4 border-amber-700 font-black text-2xl shadow-lg hover:scale-105 transition-transform"
							>
								🔊 Hear the Word
							</button>
						</div>

						{state === 'playing' ? (
							<>
								<label className="text-lg font-bold text-amber-900 text-center">
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
									className={`px-6 py-5 rounded-2xl border-4 text-4xl font-black text-center bg-white focus:outline-none focus:ring-8 [will-change:transform] transition-colors ${
										shake
											? 'shake-no border-red-600 ring-4 ring-red-400'
											: 'border-yellow-500 focus:ring-amber-500'
									}`}
									placeholder="type here…"
									autoFocus
								/>

								<div className="flex items-center gap-3">
									<button
										onClick={checkAnswer}
										className="flex-1 px-6 py-5 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white border-4 border-green-700 font-black text-2xl shadow hover:scale-105 transition-transform"
									>
										✅ Check
									</button>
									<button
										onClick={() => speak(`Spell: ${currentWord}`)}
										className="px-6 py-5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-4 border-yellow-700 font-black text-xl shadow hover:scale-105 transition-transform"
									>
										🔁 Repeat
									</button>
									<button
										onClick={giveUp}
										className="px-6 py-5 rounded-2xl bg-gradient-to-r from-slate-400 to-slate-500 text-white border-4 border-slate-700 font-black text-xl shadow hover:scale-105 transition-transform"
									>
										🏳️ Quit
									</button>
								</div>
							</>
						) : (
							<div className="space-y-3">
								<div className="text-center text-2xl font-bold text-amber-900">
									{message}
								</div>
								<button
									onClick={hardReset}
									className="w-full px-6 py-5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-4 border-yellow-700 font-black text-2xl shadow hover:scale-105 transition-transform"
								>
									{state === 'victory'
										? '📚 Another Lesson (Enter)'
										: '🔄 New Lesson (Enter)'}
								</button>
							</div>
						)}

						<div
							className="mt-2 text-center text-sm font-bold text-amber-800"
							aria-live="polite"
						>
							{state === 'playing'
								? `Enter = Check • Esc = Quit • Time: ${timeForRound(
										roundIndex,
								  )}s`
								: 'Press Enter for a new lesson'}
						</div>

						<div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl p-4 text-center border-4 border-yellow-500 min-h-[80px] flex items-center justify-center shadow">
							<div className="text-lg font-bold text-amber-900">{message}</div>
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
