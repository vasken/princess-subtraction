'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

/** ————— words (swap with your own lists) ————— */
const WORDS = [
	'cat',
	'ship',
	'flag',
	'castle',
	'bridge',
	'dragon',
	'princess',
	'winter',
	'summer',
	'sparkle',
	'library',
	'puzzle',
	'whisper',
	'feather',
	'teacher',
	'magic',
	'tower',
]

const shuffle = (arr) => {
	const a = [...arr]
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[a[i], a[j]] = [a[j], a[i]]
	}
	return a
}

const BOARD_LEN = 40 // finish when >= BOARD_LEN
const SPECIALS = {
	3: { kind: 'jump', delta: +2 },
	7: { kind: 'goto', to: 12 },
	11: { kind: 'jump', delta: +3 },
	18: { kind: 'skip', turns: -1 }, // extra turn
	22: { kind: 'goto', to: 16 }, // slide back
	25: { kind: 'jump', delta: +4 },
	28: { kind: 'skip', turns: +1 }, // miss a turn
	31: { kind: 'jump', delta: -3 },
	34: { kind: 'goto', to: 37 },
}

const buildBoard = (n) =>
	Array.from({ length: n }, (_, i) => {
		const idx = i + 1
		let t = { i: idx }
		if (idx === 1) t = { ...t, label: 'Start', emoji: '🏁' }
		if (idx === n) t = { ...t, label: 'Cottage', emoji: '🏠' }
		const effect = SPECIALS[idx]
		if (effect) {
			if (effect.kind === 'jump' && effect.delta > 0)
				t = { ...t, label: 'Bonus', emoji: '⚡', effect }
			else if (effect.kind === 'jump' && effect.delta < 0)
				t = { ...t, label: 'Trap', emoji: '🪤', effect }
			else if (effect.kind === 'goto')
				t = { ...t, label: 'Portal', emoji: '✨', effect }
			else if (effect.kind === 'skip' && effect.turns > 0)
				t = { ...t, label: 'Skip', emoji: '⏭', effect }
			else if (effect.kind === 'skip' && effect.turns < 0)
				t = { ...t, label: 'Extra', emoji: '➕', effect }
		}
		return t
	})

/** ————— TTS ————— */
const speak = (text) => {
	if (typeof window === 'undefined') return
	if (!text) return
	const u = new SpeechSynthesisUtterance(text)
	u.rate = 0.98
	u.pitch = 1
	u.lang = 'en-US'
	window.speechSynthesis.cancel()
	window.speechSynthesis.speak(u)
}

/** small helper to await */
const wait = (ms) => new Promise((res) => setTimeout(res, ms))

export default function SpellingPiticotPage() {
	// board & pawn
	const BOARD = useMemo(() => buildBoard(BOARD_LEN), [])
	const [pos, setPos] = useState(1) // 1-indexed tiles
	const [skipTurns, setSkipTurns] = useState(0)

	// game state
	const [state, setState] = useState('playing') // 'playing' | 'victory'

	// words (single endless list, reshuffle when exhausted)
	const [words, setWords] = useState(() => shuffle(WORDS))
	const [idx, setIdx] = useState(0)
	const currentWord = words[idx] ?? ''

	// ui
	const [answer, setAnswer] = useState('')
	const [message, setMessage] = useState('Listen to the word and spell it!')
	const [shake, setShake] = useState(false)
	const [sparkle, setSparkle] = useState(false)

	// dice phase
	const [rollPhase, setRollPhase] = useState(false)
	const [rolling, setRolling] = useState(false)
	const [lastRoll, setLastRoll] = useState(null)

	// movement animation
	const [isAnimating, setIsAnimating] = useState(false)

	const inputRef = useRef(null)

	/** auto speak + focus on new word (only when answering) */
	useEffect(() => {
		if (state !== 'playing' || rollPhase || !currentWord) return
		speak(`Spell: ${currentWord}`)
		inputRef.current?.focus()
	}, [currentWord, state, rollPhase])

	const rollDie = () => {
		const n = Math.floor(Math.random() * 6) + 1
		setLastRoll(n)
		return n
	}

	/** animate step-by-step hops from current pos to target */
	const hopTo = async (target) => {
		setIsAnimating(true)
		let cur = pos
		const dir = target > cur ? 1 : -1
		while (cur !== target) {
			cur += dir
			setPos(cur)
			// cute hop effect by briefly scaling the pawn via ring class; handled by CSS state (re-render)
			await wait(220)
		}
		setIsAnimating(false)
		return cur
	}

	/** apply special effect at a tile; animate extra movement if needed */
	const applyTileEffectWithAnimation = async (tileIndex) => {
		const t = BOARD[Math.min(tileIndex - 1, BOARD.length - 1)]
		if (!t?.effect) return tileIndex

		if (t.effect.kind === 'jump') {
			const dest = Math.max(1, Math.min(BOARD_LEN, tileIndex + t.effect.delta))
			setMessage(
				t.effect.delta > 0
					? `⚡ Bonus +${t.effect.delta}! Hopping to ${dest}…`
					: `🪤 Trap ${t.effect.delta}! Hopping to ${dest}…`,
			)
			await hopTo(dest)
			return dest
		}

		if (t.effect.kind === 'goto') {
			const dest = t.effect.to
			setMessage(`✨ Portal! Hopping to ${dest}…`)
			await hopTo(dest)
			return dest
		}

		if (t.effect.kind === 'skip') {
			const turns = t.effect.turns
			setSkipTurns((s) => s + turns)
			setMessage(turns > 0 ? `⏭ You skip ${turns} turn(s).` : '➕ Extra turn!')
			return tileIndex
		}

		return tileIndex
	}

	const nextWord = () => {
		const next = idx + 1
		if (next >= words.length) {
			setWords(shuffle(WORDS))
			setIdx(0)
		} else {
			setIdx(next)
		}
		setAnswer('')
	}

	const checkAnswer = () => {
		if (state !== 'playing' || rollPhase || isAnimating) return
		if (skipTurns > 0) {
			setSkipTurns((s) => s - 1)
			setMessage('⏭ Special tile — you skip this turn.')
			return nextWord()
		}
		const norm = answer.trim().toLowerCase()
		if (!norm) {
			setMessage('Type the word you heard.')
			return
		}
		if (norm === currentWord) {
			setMessage('✅ Correct! Roll the dice to move.')
			setRollPhase(true)
		} else {
			setShake(true)
			setTimeout(() => setShake(false), 400)
			const back = Math.max(1, pos - 1)
			setPos(back)
			setMessage(`❌ Try again! You step back to ${back}.`)
		}
	}

	const doPlayerRoll = async () => {
		if (!rollPhase || state !== 'playing' || isAnimating) return
		setRolling(true)
		const r = rollDie()
		setMessage(`🎲 You rolled ${r}! Hopping…`)

		// hop step-by-step to pos + r
		const rawTarget = Math.min(BOARD_LEN, pos + r)
		await hopTo(rawTarget)

		// apply & animate tile effect (if any)
		const finalPos = await applyTileEffectWithAnimation(rawTarget)

		setRolling(false)
		setRollPhase(false)
		setMessage(`🎲 You rolled ${r}. You’re on ${finalPos}.`)

		// finish check
		if (finalPos >= BOARD_LEN) {
			setState('victory')
			setSparkle(true)
			setTimeout(() => setSparkle(false), 900)
			setMessage('🏠 You reached the cottage! Bravo!')
			return
		}

		// continue with a new word
		nextWord()
	}

	const hardReset = () => {
		setPos(1)
		setSkipTurns(0)
		setState('playing')
		setWords(shuffle(WORDS))
		setIdx(0)
		setAnswer('')
		setRollPhase(false)
		setRolling(false)
		setLastRoll(null)
		setIsAnimating(false)
		setMessage('New game! Listen and spell to advance.')
		inputRef.current?.focus()
	}

	// global keys (don’t steal keys from inputs)
	useEffect(() => {
		const onKey = (e) => {
			const tag = e.target?.tagName
			if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable)
				return
			if (e.key === 'Enter') {
				e.preventDefault()
				if (state !== 'playing') return hardReset()
				rollPhase ? doPlayerRoll() : checkAnswer()
			} else if (e.key === 'Escape') {
				e.preventDefault()
				state !== 'playing' ? hardReset() : hardReset()
			}
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [state, rollPhase, pos, idx, answer, skipTurns, isAnimating])

	return (
		<div className="min-h-screen bg-gradient-to-b from-sky-200 via-amber-100 to-rose-100 text-slate-900 p-4 md:p-8">
			{/* sparkle on victory */}
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
					<div className="relative z-10 bg-white rounded-3xl border-8 border-yellow-400 shadow-2xl p-8 md:p-12 max-w-3xl w-full text-center space-y-6">
						<div className="text-9xl animate-pulse">🏠👑</div>
						<h1 className="text-5xl md:text-7xl font-black text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 bg-clip-text leading-tight">
							PITICOT — YOU WIN!
						</h1>
						<button
							onClick={hardReset}
							className="w-full px-8 py-6 rounded-2xl bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white border-8 border-blue-700 font-black text-3xl md:text-4xl shadow-xl hover:scale-105 transition-all"
						>
							🎮 Play again
						</button>
						<div className="text-xl font-bold text-slate-600">
							Enter = replay
						</div>
					</div>
				</div>
			) : null}

			<div className="mx-auto max-w-6xl space-y-6">
				<header className="flex items-center justify-between">
					<Link
						href="/"
						className="px-4 py-2 rounded-xl bg-white/90 hover:bg-white border-2 border-slate-800 font-bold shadow"
					>
						← Back
					</Link>
					<div className="px-4 py-2 rounded-xl border-4 font-black text-2xl bg-slate-200 border-slate-400 text-slate-700">
						Piticot Spelling
					</div>
				</header>

				<section className="grid lg:grid-cols-2 gap-6">
					{/* Board */}
					<div className="bg-white rounded-2xl border-8 border-slate-800 p-4 md:p-6">
						<h2 className="text-2xl font-black mb-3">🏁 Piticot Track</h2>
						{/* serpentine grid: 5 cols x 8 rows = 40 tiles */}
						<div className="grid grid-cols-5 gap-2">
							{Array.from({ length: BOARD_LEN }).map((_, idxTile) => {
								const tileNo = idxTile + 1
								const row = Math.floor(idxTile / 5)
								const inRowIndex = idxTile % 5
								const displayIdx = row % 2 === 0 ? inRowIndex : 4 - inRowIndex
								const t = BOARD[tileNo - 1]
								const isHere = pos === tileNo
								const isFinish = tileNo === BOARD_LEN
								const color = isFinish
									? 'from-amber-200 to-amber-300 border-amber-500'
									: t.effect?.kind === 'jump' && (t.effect.delta ?? 0) > 0
									? 'from-emerald-100 to-emerald-200 border-emerald-400'
									: t.effect?.kind === 'jump'
									? 'from-rose-100 to-rose-200 border-rose-400'
									: t.effect?.kind === 'goto'
									? 'from-purple-100 to-pink-100 border-purple-400'
									: t.effect?.kind === 'skip' && (t.effect.turns ?? 0) > 0
									? 'from-yellow-100 to-yellow-200 border-yellow-400'
									: t.effect?.kind === 'skip'
									? 'from-cyan-100 to-cyan-200 border-cyan-400'
									: 'from-slate-50 to-slate-100 border-slate-300'
								return (
									<div
										key={tileNo}
										style={{ order: row * 5 + displayIdx }}
										className={[
											'relative h-20 rounded-xl border-4 p-2 flex flex-col justify-between bg-gradient-to-br',
											color,
											isHere ? 'ring-4 ring-pink-400 scale-[1.02]' : '',
											'transition-all',
										].join(' ')}
									>
										<div className="flex items-center justify-between">
											<span className="text-xs font-black text-slate-500">
												#{tileNo}
											</span>
											<span>{t.emoji ? t.emoji : ''}</span>
										</div>
										<div className="text-[10px] font-bold text-slate-600">
											{t.label ? t.label : '\u00A0'}
										</div>
										{isHere ? (
											<div
												className={[
													'absolute -top-4 -right-3 text-2xl transition-transform',
													isAnimating ? 'animate-bounce' : '',
												].join(' ')}
											>
												🧝‍♀️
											</div>
										) : null}
									</div>
								)
							})}
						</div>

						<div className="mt-3 flex items-center gap-3 text-sm font-bold">
							<span>📍 Pos: {pos}</span>
							<span>🎲 {lastRoll ? `Roll: ${lastRoll}` : '—'}</span>
						</div>
					</div>

					{/* Spelling / Roll panel */}
					<div className="bg-white rounded-2xl border-8 border-yellow-400 p-6 md:p-8 flex flex-col gap-4">
						<h1 className="text-3xl md:text-4xl font-black text-center">
							🔊 Spelling Piticot
						</h1>

						{rollPhase ? (
							<div className="rounded-2xl border-8 border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-100 p-8 flex flex-col items-center justify-center gap-4">
								<div className="text-8xl">
									<div className="w-24 h-24 rounded-2xl border-4 border-amber-600 bg-white flex items-center justify-center font-black text-5xl shadow">
										{lastRoll ?? '–'}
									</div>
								</div>

								<div className="text-2xl font-black text-slate-800 text-center">
									{rolling || isAnimating
										? 'Moving…'
										: 'Correct! Now roll the dice to move.'}
								</div>

								<button
									onClick={doPlayerRoll}
									disabled={rolling || isAnimating}
									className={[
										'px-8 py-6 rounded-2xl text-white border-4 font-black text-3xl shadow',
										rolling || isAnimating
											? 'bg-slate-400 border-slate-500 cursor-not-allowed'
											: 'bg-gradient-to-r from-amber-400 to-orange-500 border-amber-600 hover:scale-105',
									].join(' ')}
								>
									{rolling || isAnimating ? 'Moving…' : 'Roll the dice (Enter)'}
								</button>
							</div>
						) : (
							<>
								<div className="rounded-2xl border-8 border-purple-400 bg-gradient-to-br from-purple-100 to-pink-100 p-6 flex items-center justify-center">
									<button
										onClick={() => speak(`Spell: ${currentWord}`)}
										className="px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-400 to-purple-500 text-white border-4 border-indigo-700 font-black text-2xl shadow hover:scale-105"
									>
										🔊 Hear the word
									</button>
								</div>

								<label className="text-xl font-bold text-slate-700 text-center">
									Type the word
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
											hardReset()
										}
									}}
									disabled={isAnimating}
									className={[
										'px-6 py-5 rounded-2xl border-4 text-4xl font-black text-center bg-amber-50 focus:outline-none focus:ring-8 focus:ring-orange-500 [will-change:transform]',
										shake
											? 'shake-no border-red-600 ring-4 ring-red-400'
											: 'border-blue-400',
										isAnimating ? 'opacity-60' : '',
									].join(' ')}
									placeholder="type here…"
									autoFocus
								/>

								<div className="flex items-center gap-3">
									<button
										onClick={checkAnswer}
										disabled={isAnimating}
										className={[
											'flex-1 px-6 py-5 rounded-2xl text-white border-4 font-black text-2xl shadow hover:scale-105',
											isAnimating
												? 'bg-slate-400 border-slate-500 cursor-not-allowed'
												: 'bg-gradient-to-r from-green-400 to-emerald-500 border-green-700',
										].join(' ')}
									>
										✅ Check
									</button>
									<button
										onClick={() => speak(`Spell: ${currentWord}`)}
										disabled={isAnimating}
										className={[
											'px-6 py-5 rounded-2xl text-white border-4 font-black text-xl shadow hover:scale-105',
											isAnimating
												? 'bg-slate-400 border-slate-500 cursor-not-allowed'
												: 'bg-gradient-to-r from-indigo-400 to-blue-500 border-indigo-700',
										].join(' ')}
									>
										🔁 Repeat
									</button>
									<button
										onClick={hardReset}
										className="px-6 py-5 rounded-2xl bg-gradient-to-r from-rose-400 to-red-500 text-white border-4 border-red-700 font-black text-xl shadow hover:scale-105"
									>
										🏳️ Reset
									</button>
								</div>
							</>
						)}

						<div className="bg-gradient-to-r from-yellow-200 to-amber-200 rounded-xl p-4 text-center border-4 border-yellow-400 min-h-[64px] flex items-center justify-center">
							<div className="text-xl font-bold text-slate-800">{message}</div>
						</div>
					</div>
				</section>
			</div>

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
