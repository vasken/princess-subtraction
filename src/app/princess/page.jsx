'use client'

import { useState, useEffect, useRef } from 'react'

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

function generateProblem({ min = 20, max = 999, requireRegroup = true } = {}) {
	let a = randInt(min, max)
	let b = randInt(min, max)
	if (a < b) [a, b] = [b, a]

	if (requireRegroup) {
		const a1 = a % 10
		let b1 = b % 10
		if (a1 >= b1) {
			b1 = (a1 + randInt(1, 9)) % 10 || 9
			b = b - (b % 10) + b1
			if (b >= a) b = Math.max(min, a - randInt(1, 9))
		}
		if (a >= 100 && Math.random() < 0.4) {
			const a10 = Math.floor((a % 100) / 10)
			let b10 = Math.floor((b % 100) / 10)
			if (a10 <= b10) {
				b10 = Math.min(9, a10 + randInt(1, 3))
				b = b - Math.floor((b % 100) / 10) * 10 + b10 * 10
				if (b >= a) b = Math.max(min, a - randInt(1, 9))
			}
		}
	}
	return { a, b, ans: a - b }
}

const pad3 = (n) => n.toString().padStart(3, '0')

const BOARD_TILES = [
	{ id: 0, label: 'Village Gate', emoji: '🏡' },
	{ id: 1, label: 'Forest Path', emoji: '🌲' },
	{ id: 2, label: 'River Bend', emoji: '🌊' },
	{ id: 3, label: 'Fairy Glade', emoji: '🧚' },
	{ id: 4, label: 'Dragon Guard', effect: 'dragon', emoji: '🐉' },
	{ id: 5, label: 'Torch Tunnel', emoji: '🔦' },
	{ id: 6, label: 'Moon Steps', emoji: '🌙' },
	{ id: 7, label: 'Magic Bridge', effect: 'bridge', emoji: '✨' },
	{ id: 8, label: 'Castle Gate', emoji: '🚪' },
	{ id: 9, label: 'Castle Stairs', emoji: '🪜' },
	{ id: 10, label: 'Castle Tower', effect: 'finish', emoji: '🏰' },
]

export default function Page() {
	const [pos, setPos] = useState(0)
	const [keys, setKeys] = useState(0)
	const [streak, setStreak] = useState(0)
	const [problem, setProblem] = useState(() =>
		generateProblem({ requireRegroup: true }),
	)
	const [answer, setAnswer] = useState('')
	const [message, setMessage] = useState(
		'🎮 Solve the math problem to move forward!',
	)
	const [timerOn, setTimerOn] = useState(false)
	const [seconds, setSeconds] = useState(60)
	const [bridgeArmed, setBridgeArmed] = useState(false)
	const [celebrating, setCelebrating] = useState(false)
	const intervalRef = useRef(null)

	useEffect(() => {
		if (!timerOn) return
		intervalRef.current = setInterval(() => {
			setSeconds((s) => (s > 0 ? s - 1 : 0))
		}, 1000)
		return () => clearInterval(intervalRef.current)
	}, [timerOn])

	useEffect(() => {
		if (seconds === 0 && timerOn) {
			setTimerOn(false)
			setMessage("⏱️ Time up! But that's okay, try the next one! 💪")
		}
	}, [seconds, timerOn])

	const drawCard = (forceRegroup = true) => {
		setProblem(generateProblem({ requireRegroup: forceRegroup }))
		setAnswer('')
		setSeconds(60)
		setTimerOn(false)
		setMessage('')
	}

	const move = (steps) => {
		const next = Math.min(10, pos + steps)
		setPos(next)
		const tile = BOARD_TILES[next]
		if (tile?.effect === 'dragon') {
			setMessage(
				'🐉 OH NO! A Dragon! Solve one more problem to keep going! You can do it! 💪',
			)
		}
		if (tile?.effect === 'bridge') {
			setMessage(
				'✨ WOW! Magic Bridge! Solve the next one super fast for a BONUS! ⚡',
			)
			setTimerOn(true)
			setBridgeArmed(true)
		}
		if (tile?.effect === 'finish') {
			if (keys < 3)
				setMessage(
					'🏰 You made it to the tower! Get 3 keys to save the princess! 👑',
				)
			else
				setMessage(
					"🎉🎊 AMAZING! You rescued the princess! You're a MATH HERO! 🌟⭐✨",
				)
		}
	}

	const checkAnswer = () => {
		const numeric = Number.parseInt(answer, 10)
		if (!Number.isFinite(numeric)) {
			setMessage('🤔 Type a number to answer!')
			return
		}
		const correct = numeric === problem.ans
		drawCard(true)
		setTimerOn(false)
		setBridgeArmed(false)
		if (correct) {
			setCelebrating(true)
			setTimeout(() => setCelebrating(false), 1000)
			setStreak((s) => s + 1)
			setKeys((k) => Math.min(3, k + 1))
			setMessage("🎉 YES! You got it RIGHT! You're so smart! ⭐ Move forward!")
			move(1)
		} else {
			setStreak(0)
			const currentTile = BOARD_TILES[pos]
			if (currentTile?.effect) {
				setMessage(
					`💫 Oops! The answer was ${problem.ans}. Let\'s try again from the start! 🌟`,
				)
				setPos(0)
			} else {
				setMessage(
					`💙 Not quite! The answer was ${problem.ans}. Keep trying, you\'re learning! 🌈`,
				)
				setPos((p) => Math.max(0, p - 1))
			}
		}
	}

	const resetGame = () => {
		setPos(0)
		setKeys(0)
		setStreak(0)
		drawCard(true)
		setMessage("🚀 NEW ADVENTURE! Let's rescue the princess! 👑")
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-blue-200 text-slate-900 p-4 md:p-8 relative overflow-hidden">
			<div className="absolute top-10 left-10 text-6xl opacity-40 animate-bounce-fun">
				☁️
			</div>
			<div
				className="absolute top-20 right-20 text-5xl opacity-40 animate-bounce-fun"
				style={{ animationDelay: '0.5s' }}
			>
				☁️
			</div>
			<div
				className="absolute bottom-20 left-1/4 text-7xl opacity-30 animate-bounce-fun"
				style={{ animationDelay: '1s' }}
			>
				☁️
			</div>

			{celebrating && (
				<div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
					<div className="text-9xl animate-pulse-big">🎉</div>
					<div className="absolute top-1/4 left-1/4 text-6xl animate-sparkle">
						⭐
					</div>
					<div
						className="absolute top-1/3 right-1/4 text-6xl animate-sparkle"
						style={{ animationDelay: '0.3s' }}
					>
						✨
					</div>
					<div
						className="absolute bottom-1/3 left-1/3 text-6xl animate-sparkle"
						style={{ animationDelay: '0.6s' }}
					>
						🌟
					</div>
				</div>
			)}

			<div className="mx-auto max-w-7xl relative z-10">
				<header className="flex flex-col items-center justify-center mb-8 gap-4">
					<h1 className="text-5xl md:text-7xl font-black text-center leading-tight">
						<span className="inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 text-transparent bg-clip-text drop-shadow-lg animate-pulse-big">
							👑 RESCUE THE PRINCESS! 👸
						</span>
					</h1>
					<div className="text-2xl md:text-3xl font-bold text-white bg-purple-500 px-6 py-3 rounded-full shadow-xl border-4 border-white">
						✏️ Subtraction Adventure! ✨
					</div>
				</header>

				<div className="grid lg:grid-cols-2 gap-6 md:gap-8">
					<section className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 border-8 border-yellow-300">
						<h2 className="text-3xl md:text-4xl font-black mb-6 text-purple-600 flex items-center gap-3">
							🗺️ Your Adventure Path
						</h2>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
							{BOARD_TILES.map((t, i) => (
								<div
									key={t.id}
									className={[
										'rounded-2xl border-4 p-4 md:p-6 text-center h-32 md:h-40 flex flex-col items-center justify-center transition-all transform hover:scale-105 cursor-pointer font-bold',
										pos === i
											? 'border-pink-500 bg-gradient-to-br from-pink-300 to-pink-400 shadow-2xl scale-110 animate-pulse-big'
											: t.effect === 'dragon'
											? 'border-red-400 bg-gradient-to-br from-red-200 to-orange-200 hover:bg-red-300'
											: t.effect === 'bridge'
											? 'border-purple-400 bg-gradient-to-br from-purple-200 to-pink-200 hover:bg-purple-300'
											: t.effect === 'finish'
											? 'border-yellow-400 bg-gradient-to-br from-yellow-200 to-amber-300 hover:bg-yellow-300'
											: 'border-green-400 bg-gradient-to-br from-green-100 to-emerald-200 hover:bg-green-200',
									].join(' ')}
								>
									<div className="text-4xl md:text-5xl mb-2">{t.emoji}</div>
									<div className="text-xs md:text-sm font-black text-slate-800">
										{i}. {t.label}
									</div>
									{pos === i && (
										<div className="mt-2 text-3xl md:text-4xl animate-bounce-fun">
											🧝‍♀️
										</div>
									)}
								</div>
							))}
						</div>

						<div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
							<button
								onClick={() => move(1)}
								className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-black text-xl border-4 border-blue-600 shadow-xl transition-all hover:scale-110 hover:shadow-2xl"
							>
								➡️ Move +1
							</button>
							<button
								onClick={() => resetGame()}
								className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-black text-xl border-4 border-rose-600 shadow-xl transition-all hover:scale-110 hover:shadow-2xl"
							>
								🔄 New Game
							</button>
						</div>

						<div className="mt-6 grid grid-cols-3 gap-3">
							<div className="bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-2xl p-4 text-center border-4 border-yellow-400 shadow-lg">
								<div className="text-3xl md:text-4xl font-black text-yellow-800">
									{pos}
								</div>
								<div className="text-sm md:text-base font-bold text-yellow-700">
									📍 Position
								</div>
							</div>
							<div className="bg-gradient-to-br from-amber-200 to-orange-300 rounded-2xl p-4 text-center border-4 border-amber-400 shadow-lg">
								<div className="text-3xl md:text-4xl font-black text-amber-800">
									{keys}/3
								</div>
								<div className="text-sm md:text-base font-bold text-amber-700">
									🔑 Keys
								</div>
							</div>
							<div className="bg-gradient-to-br from-green-200 to-emerald-300 rounded-2xl p-4 text-center border-4 border-green-400 shadow-lg">
								<div className="text-3xl md:text-4xl font-black text-green-800">
									{streak}
								</div>
								<div className="text-sm md:text-base font-bold text-green-700">
									🔥 Streak
								</div>
							</div>
						</div>
					</section>

					<section className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 border-8 border-pink-300">
						<h2 className="text-3xl md:text-4xl font-black mb-6 text-pink-600 flex items-center gap-3">
							🎯 Solve This Problem!
						</h2>
						<div className="grid grid-cols-1 gap-6">
							<div className="rounded-3xl border-8 border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100 p-8 md:p-12 flex flex-col items-center justify-center shadow-inner">
								<div className="text-6xl md:text-8xl font-black leading-tight text-purple-800 font-mono">
									<div className="whitespace-pre text-center">
										{pad3(problem.a)}
									</div>
									<div className="whitespace-pre text-center">
										- {pad3(problem.b)}
									</div>
									<div className="mt-4 border-t-8 border-purple-600 w-48 md:w-64 mx-auto"></div>
								</div>
							</div>

							<div className="flex flex-col gap-4">
								<label className="text-2xl md:text-3xl font-black text-purple-600">
									✍️ Your Answer:
								</label>
								<input
									inputMode="numeric"
									value={answer}
									onChange={(e) =>
										setAnswer(e.target.value.replace(/[^0-9]/g, ''))
									}
									className="px-6 py-6 md:py-8 rounded-2xl border-8 border-blue-400 w-full text-4xl md:text-5xl font-black text-center focus:outline-none focus:ring-8 focus:ring-pink-500 focus:border-pink-500 transition-all bg-blue-50"
									placeholder="???"
								/>
								<div className="flex flex-col sm:flex-row items-center gap-3">
									<button
										onClick={() => checkAnswer()}
										className="w-full sm:flex-1 px-8 py-6 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-black text-2xl md:text-3xl border-4 border-green-600 shadow-xl transition-all hover:scale-110 hover:shadow-2xl"
									>
										✅ CHECK!
									</button>
									<button
										onClick={() => drawCard(true)}
										className="w-full sm:w-auto px-6 py-6 rounded-2xl bg-gradient-to-r from-orange-300 to-yellow-400 hover:from-orange-400 hover:to-yellow-500 font-black text-lg md:text-xl border-4 border-orange-500 shadow-lg transition-all hover:scale-105"
									>
										🎴 New Card
									</button>
									<div
										className={`px-6 py-4 rounded-2xl font-black text-2xl md:text-3xl border-4 shadow-lg ${
											seconds <= 10 && timerOn
												? 'bg-red-400 border-red-600 text-white animate-pulse-big'
												: 'bg-yellow-300 border-yellow-500 text-yellow-900'
										}`}
									>
										⏱️ {seconds}s
									</div>
								</div>

								<div className="bg-gradient-to-r from-yellow-200 to-amber-200 rounded-2xl p-6 text-center border-4 border-yellow-400 shadow-lg min-h-[100px] flex items-center justify-center">
									<div className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
										{message}
									</div>
								</div>
							</div>
						</div>
					</section>
				</div>

				<section className="mt-8 bg-white rounded-3xl shadow-2xl p-6 md:p-8 border-8 border-green-300">
					<h2 className="text-3xl md:text-4xl font-black mb-4 text-green-600 flex items-center gap-3">
						📜 How to Play
					</h2>
					<ul className="space-y-3 text-lg md:text-xl font-bold text-slate-800">
						<li className="flex items-start gap-3 bg-green-100 p-4 rounded-2xl border-4 border-green-300">
							<span className="text-3xl">✅</span>
							<span>
								Get it RIGHT = Move forward and get a KEY! 🔑 Get 3 keys to save
								the princess!
							</span>
						</li>
						<li className="flex items-start gap-3 bg-purple-100 p-4 rounded-2xl border-4 border-purple-300">
							<span className="text-3xl">✨</span>
							<span>
								Land on the MAGIC BRIDGE and solve super fast for a BONUS space!
								⚡
							</span>
						</li>
						<li className="flex items-start gap-3 bg-red-100 p-4 rounded-2xl border-4 border-red-300">
							<span className="text-3xl">🐉</span>
							<span>
								Watch out for the DRAGON! Solve an extra problem to keep going!
								💪
							</span>
						</li>
					</ul>
				</section>
			</div>
		</div>
	)
}
