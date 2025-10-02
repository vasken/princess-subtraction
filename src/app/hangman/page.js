'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

function generateProblem() {
	const a = randInt(0, 9)
	const b = randInt(0, 9)
	const op = Math.random() < 0.5 ? '+' : '-'
	if (op === '+') return { a, b, op, ans: a + b }
	const [larger, smaller] = a >= b ? [a, b] : [b, a]
	return { a: larger, b: smaller, op, ans: larger - smaller }
}

// 0..6 hangman ASCII stages
const GALLOWS = [
	['  +---+', '  |   |', '      |', '      |', '      |', '      |', '======+'],
	['  +---+', '  |   |', '  O   |', '      |', '      |', '      |', '======+'],
	['  +---+', '  |   |', '  O   |', '  |   |', '      |', '      |', '======+'],
	['  +---+', '  |   |', '  O   |', ' /|   |', '      |', '      |', '======+'],
	[
		'  +---+',
		'  |   |',
		'  O   |',
		' /|\\  |',
		'      |',
		'      |',
		'======+',
	],
	[
		'  +---+',
		'  |   |',
		'  O   |',
		' /|\\  |',
		' /    |',
		'      |',
		'======+',
	],
	[
		'  +---+',
		'  |   |',
		'  O   |',
		' /|\\  |',
		' / \\  |',
		'      |',
		'======+',
	],
]

// tower & timing
const TOWER_LEVELS = 6 // rounds to win
const QUESTIONS_PER_ROUND = 7 // <-- new
const BASE_TIME = 60
const STEP_TIME = 5
const MIN_TIME = 5
const timeForRound = (roundIndex) =>
	Math.max(MIN_TIME, BASE_TIME - STEP_TIME * (roundIndex - 1))

export default function MathHangmanPage() {
	const [problem, setProblem] = useState(() => generateProblem())
	const [answer, setAnswer] = useState('')
	const [wrong, setWrong] = useState(0)
	const [lives, setLives] = useState(6)
	const [state, setState] = useState('playing') // 'playing' | 'lost' | 'timeout' | 'victory'
	const [message, setMessage] = useState(
		'Solve 7 questions before time runs out!',
	)
	const [roundIndex, setRoundIndex] = useState(1)
	const [timeLeft, setTimeLeft] = useState(() => timeForRound(1))

	// per-round progress
	const [solved, setSolved] = useState(0) // 0..7

	// princess progress
	const [princessLevel, setPrincessLevel] = useState(0) // 0..TOWER_LEVELS-1
	const atTop = useMemo(
		() => princessLevel >= TOWER_LEVELS - 1,
		[princessLevel],
	)
	// ✨ round celebration overlay
	const [roundSparkle, setRoundSparkle] = useState(false)

	const intervalRef = useRef(null)
	const inputRef = useRef(null)

	// timer (per round)
	useEffect(() => {
		if (state !== 'playing') return
		if (intervalRef.current) clearInterval(intervalRef.current)
		intervalRef.current = setInterval(() => {
			setTimeLeft((t) => {
				if (t <= 1) {
					clearInterval(intervalRef.current)
					setState('timeout')
					setMessage(
						`⏱️ Time’s up! You solved ${solved}/${QUESTIONS_PER_ROUND}. Princess returns to bottom.`,
					)
					setPrincessLevel(0)
					return 0
				}
				return t - 1
			})
		}, 1000)
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [state, solved])

	const focusInput = () => inputRef.current?.focus()

	const startNextRound = () => {
		const nextRound = roundIndex + 1
		setRoundIndex(nextRound)
		setProblem(generateProblem())
		setAnswer('')
		setSolved(0)
		const t = timeForRound(nextRound)
		setTimeLeft(t)
		setState('playing')
		setMessage(`Round ${nextRound}: solve ${QUESTIONS_PER_ROUND} in ${t}s!`)
		focusInput()
	}

	const roundSuccess = () => {
		// princess climbs one level
		const nextLevel = Math.min(TOWER_LEVELS - 1, princessLevel + 1)
		setPrincessLevel(nextLevel)
		if (intervalRef.current) clearInterval(intervalRef.current)

		if (nextLevel >= TOWER_LEVELS - 1) {
			setState('victory')
			setMessage('👑 The princess reached the top! You win!')
			return
		}

		// ✨ flash sparkle
		setRoundSparkle(true)
		setTimeout(() => setRoundSparkle(false), 900)

		setMessage('🎉 Round cleared! The princess climbs higher!')
		startNextRound()
	}

	const loseRound = (reason) => {
		if (intervalRef.current) clearInterval(intervalRef.current)
		setState(reason || 'lost')
		setMessage(
			`💀 You lost! The answer was ${problem.ans}. Princess returns to bottom.`,
		)
		setPrincessLevel(0)
	}

	const checkAnswer = () => {
		if (state !== 'playing') return
		const num = Number.parseInt(answer, 10)
		if (!Number.isFinite(num)) {
			setMessage('Type a number (0–18).')
			return
		}
		if (num === problem.ans) {
			const s = solved + 1
			setSolved(s)
			setAnswer('')
			setProblem(generateProblem())
			if (s >= QUESTIONS_PER_ROUND) {
				roundSuccess()
			} else {
				setMessage(
					`✅ Correct! ${QUESTIONS_PER_ROUND - s} to finish the round.`,
				)
			}
		} else {
			const w = wrong + 1
			setWrong(w)
			setLives(6 - w)
			setAnswer('')
			if (w >= 6) {
				loseRound('lost')
			} else {
				setMessage(`❌ Not quite. ${6 - w} lives left. Keep going!`)
			}
		}
	}

	const giveUp = () => {
		if (state !== 'playing') {
			hardReset()
			return
		}
		loseRound('lost')
	}

	// global keyboard
	useEffect(() => {
		const onKey = (e) => {
			if (e.key === 'Enter') {
				e.preventDefault()
				if (state === 'playing') checkAnswer()
				else hardReset()
			} else if (e.key === 'Escape') {
				e.preventDefault()
				if (state === 'playing') giveUp()
				else hardReset()
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [state, answer, wrong, problem, solved, princessLevel, roundIndex])

	const hardReset = () => {
		if (intervalRef.current) clearInterval(intervalRef.current)
		setProblem(generateProblem())
		setAnswer('')
		setWrong(0)
		setLives(6)
		setRoundIndex(1)
		setSolved(0)
		setTimeLeft(timeForRound(1))
		setPrincessLevel(0)
		setState('playing')
		setMessage(
			`New game! Round 1 — solve ${QUESTIONS_PER_ROUND} in ${timeForRound(
				1,
			)}s.`,
		)
		focusInput()
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-amber-200 via-orange-200 to-rose-200 text-slate-900 p-4 md:p-8">
			{/* ✨ round-clear sparkle overlay */}
			{roundSparkle ? (
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

			{state === 'victory' ? (
				<div className="fixed inset-0 z-50 bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center p-4">
					{/* Floating celebration emojis */}
					<div className="absolute top-10 left-10 text-8xl animate-bounce">
						🎉
					</div>
					<div
						className="absolute top-20 right-20 text-8xl animate-bounce"
						style={{ animationDelay: '0.2s' }}
					>
						🎊
					</div>
					<div
						className="absolute bottom-20 left-20 text-8xl animate-bounce"
						style={{ animationDelay: '0.4s' }}
					>
						🏆
					</div>
					<div
						className="absolute bottom-10 right-10 text-8xl animate-bounce"
						style={{ animationDelay: '0.6s' }}
					>
						👑
					</div>
					<div className="absolute top-1/3 left-1/4 text-7xl animate-ping">
						⭐
					</div>
					<div
						className="absolute top-1/2 right-1/4 text-7xl animate-ping"
						style={{ animationDelay: '0.3s' }}
					>
						✨
					</div>
					<div
						className="absolute bottom-1/3 left-1/3 text-7xl animate-ping"
						style={{ animationDelay: '0.6s' }}
					>
						💫
					</div>
					<div
						className="absolute top-2/3 right-1/3 text-7xl animate-ping"
						style={{ animationDelay: '0.9s' }}
					>
						🌟
					</div>

					{/* Main victory card */}
					<div className="relative z-10 bg-white rounded-3xl border-8 border-yellow-400 shadow-2xl p-8 md:p-12 max-w-3xl w-full text-center space-y-6 ">
						<div className="text-9xl animate-pulse">🧝‍♀️👑</div>
						<h1 className="text-5xl md:text-7xl font-black text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 bg-clip-text leading-tight">
							YOU DID IT!
						</h1>
						<div className="text-3xl md:text-4xl font-black text-purple-700">
							The Princess is FREE! 🎉
						</div>
						<div className="bg-gradient-to-r from-yellow-200 to-amber-200 rounded-2xl p-6 border-4 border-yellow-400">
							<div className="text-2xl md:text-3xl font-bold text-slate-800 space-y-2">
								<div>🏰 You climbed all {TOWER_LEVELS} levels!</div>
								<div>
									📚 You solved {TOWER_LEVELS * QUESTIONS_PER_ROUND} problems!
								</div>
								<div>⚡ You completed {roundIndex} rounds!</div>
							</div>
						</div>
						<div className="text-4xl md:text-5xl font-black text-green-600 animate-pulse">
							YOU'RE A MATH HERO! 🦸🏻‍♀️
						</div>
						<button
							onClick={hardReset}
							className="w-full px-8 py-6 rounded-2xl bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white border-8 border-blue-700 font-black text-3xl md:text-4xl shadow-xl hover:scale-105 transition-all"
						>
							🎮 PLAY AGAIN!
						</button>
						<div className="text-xl font-bold text-slate-600">
							Press Enter to start a new adventure!
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

				<section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
					{/* Left: Hangman + Tower */}
					<div className="space-y-6">
						<div className="bg-white rounded-2xl border-8 border-slate-800 p-4 md:p-6">
							<pre className="text-lg md:text-2xl leading-6 font-mono select-none whitespace-pre">
								{GALLOWS[Math.min(wrong, 6)].join('\n')}
							</pre>
							<div className="mt-4 flex items-center gap-2">
								{Array.from({ length: 6 }).map((_, i) => (
									<span
										key={i}
										className={`text-2xl ${
											i < lives ? '' : 'grayscale opacity-40'
										}`}
									>
										{i < lives ? '❤️' : '🖤'}
									</span>
								))}
							</div>
						</div>

						{/* Tower */}
						<div className="bg-white rounded-2xl border-8 border-purple-700 p-4 md:p-6">
							<h2 className="text-2xl font-black text-purple-700 mb-3">
								🏰 Princess Tower
							</h2>
							<div className="grid grid-rows-6 gap-2">
								{Array.from({ length: TOWER_LEVELS }).map((_, idx) => {
									const level = TOWER_LEVELS - 1 - idx // render top -> bottom
									const isPrincess = level === princessLevel
									const isTop = level === TOWER_LEVELS - 1
									return (
										<div
											key={level}
											className={[
												'relative h-12 rounded-xl border-4 flex items-center justify-between px-3',
												isTop
													? 'bg-gradient-to-r from-yellow-200 to-amber-200 border-yellow-500'
													: 'bg-gradient-to-r from-indigo-100 to-purple-100 border-purple-300',
											].join(' ')}
										>
											<span className="font-black text-slate-700">
												Level {level + 1}
											</span>
											<span className="text-2xl">
												{isTop ? '👑' : null}
												{isPrincess ? ' 🧝‍♀️' : null}
											</span>
										</div>
									)
								})}
							</div>
							<div className="mt-3 text-center font-bold">
								{atTop
									? '🎉 Princess at the top — game over!'
									: `Progress: ${princessLevel + 1}/${TOWER_LEVELS}`}
							</div>
						</div>
					</div>

					{/* Right: Problem & Controls */}
					<div className="bg-white rounded-2xl border-8 border-yellow-400 p-6 md:p-8 flex flex-col gap-4">
						<h1 className="text-3xl md:text-4xl font-black text-center">
							🪢 Math Hangman
						</h1>
						<div className="text-center font-bold">
							Round {roundIndex} • Q {solved}/{QUESTIONS_PER_ROUND}
						</div>
						{/* tiny progress bar */}
						<div className="h-2 rounded-full bg-slate-200 overflow-hidden">
							<div
								className="h-full bg-emerald-500 transition-[width] duration-300"
								style={{ width: `${(solved / QUESTIONS_PER_ROUND) * 100}%` }}
							/>
						</div>

						<div className="rounded-2xl border-8 border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100 p-6 flex items-center justify-center">
							<div className="text-7xl md:text-8xl font-black font-mono text-purple-800 flex items-center gap-4">
								<span>{problem.a}</span>
								<span className="text-rose-500">{problem.op}</span>
								<span>{problem.b}</span>
								<span className="text-emerald-600">=</span>
								<span className="text-orange-500">?</span>
							</div>
						</div>

						{state === 'playing' ? (
							<>
								<label className="text-xl font-bold text-slate-700">
									Your Answer
								</label>
								<input
									ref={inputRef}
									type="tel"
									inputMode="numeric"
									value={answer}
									onChange={(e) =>
										setAnswer(e.target.value.replace(/[^0-9-]/g, ''))
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
									className="px-6 py-5 rounded-2xl border-4 border-blue-400 text-4xl font-black text-center bg-blue-50 focus:outline-none focus:ring-8 focus:ring-orange-500"
									placeholder="???"
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
								? `Enter = Check • Esc = Give Up • This round: ${timeForRound(
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
		</div>
	)
}
