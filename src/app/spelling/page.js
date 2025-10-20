'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

/** ---------- word list (swap with your own) ---------- */
const WORDS = [
	// easy CVC / blends
	'cat',
	'ship',
	'flag',
	'drum',
	'best',
	'frog',
	'duck',
	'lamp',
	'mask',
	'nest',
	// school words
	'book',
	'pencil',
	'paper',
	'class',
	'magic',
	'castle',
	'princess',
	'tower',
	'bridge',
	'dragon',
	// a bit harder
	'whisper',
	'teacher',
	'library',
	'puzzle',
	'winter',
	'summer',
	'thunder',
	'sparkle',
	'potion',
	'feather',
]

const pickRoundWords = (roundIdx, n) => {
	// deterministic-ish shuffle per round for variety
	const seed = roundIdx * 1337
	const arr = [...WORDS]
	for (let i = arr.length - 1; i > 0; i--) {
		const j = (i + seed) % (i + 1)
		;[arr[i], arr[j]] = [arr[j], arr[i]]
	}
	return arr.slice(0, n)
}

/** ---------- library tower & timing ---------- */
const FLOORS = 6 // victory after 6 cleared rounds
const WORDS_PER_ROUND = 7
const BASE_TIME = 60
const STEP_TIME = 5
const MIN_TIME = 5
const timeForRound = (r) => Math.max(MIN_TIME, BASE_TIME - STEP_TIME * (r - 1))

/** ---------- TTS helpers (Web Speech API) ---------- */
const speak = (text) => {
	if (typeof window === 'undefined' || !text) return
	const u = new SpeechSynthesisUtterance(text)
	u.rate = 0.95
	u.pitch = 1.0
	u.lang = 'en-US'
	window.speechSynthesis.cancel()
	window.speechSynthesis.speak(u)
}

export default function SpellingLibraryPage() {
	// round/timer
	const [roundIndex, setRoundIndex] = useState(1)
	const [timeLeft, setTimeLeft] = useState(() => timeForRound(1))
	const [state, setState] = useState('playing') // 'playing' | 'timeout' | 'victory'

	// progress
	const [floorLit, setFloorLit] = useState(0) // 0..FLOORS-1 (lanterns lit)
	const atTop = useMemo(() => floorLit >= FLOORS - 1, [floorLit])

	// words
	const [solved, setSolved] = useState(0) // 0..7
	const roundWords = useMemo(
		() => pickRoundWords(roundIndex, WORDS_PER_ROUND),
		[roundIndex],
	)
	const [wordIdx, setWordIdx] = useState(0)
	const currentWord = roundWords[wordIdx] || ''

	// UI
	const [answer, setAnswer] = useState('')
	const [message, setMessage] = useState('Listen to the word and type it!')
	const [shake, setShake] = useState(false)
	const [sparkle, setSparkle] = useState(false)

	// refs
	const intervalRef = useRef(null)
	const inputRef = useRef(null)

	const focusInput = () => inputRef.current?.focus()

	/** timer (per round) */
	useEffect(() => {
		if (state !== 'playing') return
		if (intervalRef.current) clearInterval(intervalRef.current)
		intervalRef.current = setInterval(() => {
			setTimeLeft((t) => {
				if (t <= 1) {
					clearInterval(intervalRef.current)
					setState('timeout')
					setMessage(
						`⏱️ Time’s up! You spelled ${solved}/${WORDS_PER_ROUND}. Back to the library entrance.`,
					)
					setFloorLit(0)
					return 0
				}
				return t - 1
			})
		}, 1000)
		return () => intervalRef.current && clearInterval(intervalRef.current)
	}, [state, solved])

	/** auto-speak on word + focus */
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
		setMessage(`Round ${next}: ${WORDS_PER_ROUND} words in ${t}s!`)
		focusInput()
	}

	const roundSuccess = () => {
		// light next lantern / climb a floor
		const nextFloor = Math.min(FLOORS - 1, floorLit + 1)
		setFloorLit(nextFloor)
		if (intervalRef.current) clearInterval(intervalRef.current)

		if (nextFloor >= FLOORS - 1) {
			setState('victory')
			setMessage('📚 All lanterns lit! The bookish princess cheers—You win!')
			return
		}

		// sparkle
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
			setMessage(
				left > 0 ? `✅ Correct! ${left} to finish the floor.` : '✅ Correct!',
			)
			if (s >= WORDS_PER_ROUND) {
				roundSuccess()
				return
			}
			nextWord()
		} else {
			setShake(true)
			setTimeout(() => setShake(false), 400)
			setMessage('❌ Not quite. Try again—listen carefully!')
			// keep the same word (spelling bee style)
		}
	}

	const giveUp = () => {
		if (state !== 'playing') {
			hardReset()
			return
		}
		if (intervalRef.current) clearInterval(intervalRef.current)
		setState('timeout')
		setMessage('🏳️ You stopped. Press Enter for a new game.')
		setFloorLit(0)
	}

	// global keys
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
		setMessage(
			`New game! Floor 1 — ${WORDS_PER_ROUND} words in ${timeForRound(1)}s.`,
		)
		setAnswer('')
		focusInput()
		setTimeout(() => speak(`Spell: ${pickRoundWords(1, 1)[0]}`), 0)
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-amber-200 via-orange-200 to-rose-200 text-slate-900 p-4 md:p-8">
			{/* sparkle on floor clear */}
			{sparkle ? (
				<div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
					<div className="text-8xl animate-bounce">✨</div>
					<div className="absolute top-1/4 left-1/4 text-6xl animate-ping">
						⭐
					</div>
					<div
						className="absolute top-1/3 right-1/4 text-6xl animate-ping"
						style={{ animationDelay: '150ms' }}
					>
						🌟
					</div>
					<div
						className="absolute bottom-1/3 left-1/3 text-6xl animate-ping"
						style={{ animationDelay: '300ms' }}
					>
						💫
					</div>
				</div>
			) : null}

			{/* victory overlay */}
			{state === 'victory' ? (
				<div className="fixed inset-0 z-50 bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center p-4">
					<div className="relative z-10 bg-white rounded-3xl border-8 border-yellow-400 shadow-2xl p-8 md:p-12 max-w-3xl w-full text-center space-y-6 ">
						<div className="text-9xl animate-pulse">📚👑</div>
						<h1 className="text-5xl md:text-7xl font-black text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 bg-clip-text leading-tight">
							LIBRARY MASTER!
						</h1>
						<div className="text-3xl md:text-4xl font-black text-purple-700">
							All lanterns are lit! 🎉
						</div>
						<button
							onClick={hardReset}
							className="w-full px-8 py-6 rounded-2xl bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white border-8 border-blue-700 font-black text-3xl md:text-4xl shadow-xl hover:scale-105 transition-all"
						>
							🎮 PLAY AGAIN!
						</button>
						<div className="text-xl font-bold text-slate-600">
							Press Enter to start again
						</div>
					</div>
				</div>
			) : null}

			<div className="mx-auto max-w-5xl space-y-6">
				<header className="flex items-center justify-between">
					<Link
						href="/"
						className="px-4 py-2 rounded-xl bg-white/90 hover:bg-white border-2 border-slate-800 font-bold shadow"
					>
						← Back
					</Link>
					<div
						className={`px-4 py-2 rounded-xl border-4 font-black text-2xl ${
							state === 'playing'
								? timeLeft <= 5
									? 'bg-red-500 text-white border-red-700 animate-pulse'
									: 'bg-yellow-300 border-yellow-500 text-yellow-900'
								: 'bg-slate-200 border-slate-400 text-slate-700'
						}`}
						aria-live="polite"
					>
						⏱️ {timeLeft}s
					</div>
				</header>

				<section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
					{/* Left: Library Tower (lantern progress) */}
					<div className="bg-white rounded-2xl border-8 border-purple-700 p-4 md:p-6">
						<h2 className="text-2xl font-black text-purple-700 mb-3">
							🏰 Library Tower
						</h2>
						<div className="grid grid-rows-6 gap-2">
							{Array.from({ length: FLOORS }).map((_, idx) => {
								const level = FLOORS - 1 - idx // render top -> bottom
								const lit = level <= floorLit
								const isTop = level === FLOORS - 1
								return (
									<div
										key={level}
										className={[
											'relative h-12 rounded-xl border-4 flex items-center justify-between px-3',
											lit
												? 'bg-gradient-to-r from-yellow-100 to-amber-200 border-yellow-500'
												: 'bg-gradient-to-r from-indigo-100 to-purple-100 border-purple-300',
										].join(' ')}
									>
										<span className="font-black text-slate-700">
											Floor {level + 1}
										</span>
										<span className="text-2xl">
											{isTop ? '👑' : '📚'} {lit ? '🕯️' : '💤'}
										</span>
									</div>
								)
							})}
						</div>
						<div className="mt-3 text-center font-bold">
							{atTop
								? '🎉 All floors lit — game over!'
								: `Progress: ${floorLit + 1}/${FLOORS}`}
						</div>
					</div>

					{/* Right: Word & Controls */}
					<div className="bg-white rounded-2xl border-8 border-yellow-400 p-6 md:p-8 flex flex-col gap-4">
						<h1 className="text-3xl md:text-4xl font-black text-center">
							🔊 Spelling Tower
						</h1>

						<div className="text-center font-bold">
							Floor {roundIndex} • Word {solved}/{WORDS_PER_ROUND}
						</div>

						{/* tiny progress bar */}
						<div className="h-2 rounded-full bg-slate-200 overflow-hidden">
							<div
								className="h-full bg-emerald-500 transition-[width] duration-300"
								style={{ width: `${(solved / WORDS_PER_ROUND) * 100}%` }}
							/>
						</div>

						{/* speaker card */}
						<div className="rounded-2xl border-8 border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100 p-6 flex items-center justify-center">
							<button
								onClick={() => speak(`Spell: ${currentWord}`)}
								className="px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-400 to-purple-500 text-white border-4 border-indigo-700 font-black text-2xl shadow hover:scale-105"
							>
								🔊 Hear Word
							</button>
						</div>

						{state === 'playing' ? (
							<>
								<label className="text-xl font-bold text-slate-700 text-center">
									Type what you heard
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
									className={[
										'px-6 py-5 rounded-2xl border-4 text-4xl font-black text-center bg-amber-50 focus:outline-none focus:ring-8 focus:ring-orange-500 [will-change:transform]',
										shake
											? 'shake-no border-red-600 ring-4 ring-red-400'
											: 'border-blue-400',
									].join(' ')}
									placeholder="type it here…"
									autoFocus
								/>

								<div className="flex items-center gap-3">
									<button
										onClick={checkAnswer}
										className="flex-1 px-6 py-5 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white border-4 border-green-700 font-black text-2xl shadow hover:scale-105"
									>
										✅ Check
									</button>
									<button
										onClick={() => speak(`Spell: ${currentWord}`)}
										className="px-6 py-5 rounded-2xl bg-gradient-to-r from-indigo-400 to-blue-500 text-white border-4 border-indigo-700 font-black text-xl shadow hover:scale-105"
									>
										🔁 Repeat
									</button>
									<button
										onClick={giveUp}
										className="px-6 py-5 rounded-2xl bg-gradient-to-r from-rose-400 to-red-500 text-white border-4 border-red-700 font-black text-xl shadow hover:scale-105"
									>
										🏳️ Give Up
									</button>
								</div>
							</>
						) : (
							<div className="space-y-3">
								<div className="text-center text-2xl font-bold">{message}</div>
								<button
									onClick={hardReset}
									className="w-full px-6 py-5 rounded-2xl bg-gradient-to-r from-blue-400 to-cyan-500 text-white border-4 border-blue-700 font-black text-2xl shadow hover:scale-105"
								>
									{state === 'victory'
										? '🎮 Play Again (Enter)'
										: '🔄 New Game (Enter)'}
								</button>
							</div>
						)}

						<div
							className="mt-2 text-center text-lg font-bold"
							aria-live="polite"
						>
							{state === 'playing'
								? `Enter = Check • Esc = Give Up • This floor: ${timeForRound(
										roundIndex,
								  )}s`
								: 'Press Enter to start a new game'}
						</div>

						<div className="bg-gradient-to-r from-yellow-200 to-amber-200 rounded-xl p-4 text-center border-4 border-yellow-400 min-h-[64px] flex items-center justify-center">
							<div className="text-xl font-bold text-slate-800">{message}</div>
						</div>
					</div>
				</section>
			</div>

			{/* local keyframes for the shake */}
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
