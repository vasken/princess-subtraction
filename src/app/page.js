import Link from 'next/link'

export default function Home() {
	return (
		<main className="min-h-screen bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center p-6 md:p-10 relative overflow-hidden">
			<div className="absolute top-10 left-10 text-8xl opacity-30 animate-bounce-fun">
				⭐
			</div>
			<div
				className="absolute top-20 right-20 text-7xl opacity-30 animate-bounce-fun"
				style={{ animationDelay: '0.5s' }}
			>
				✨
			</div>
			<div
				className="absolute bottom-20 left-1/4 text-9xl opacity-20 animate-bounce-fun"
				style={{ animationDelay: '1s' }}
			>
				🌟
			</div>
			<div
				className="absolute bottom-10 right-1/3 text-8xl opacity-25 animate-bounce-fun"
				style={{ animationDelay: '1.5s' }}
			>
				💫
			</div>

			<div className="max-w-5xl w-full relative z-10">
				<div className="text-center mb-12">
					<h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
						<span className="inline-block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 text-transparent bg-clip-text drop-shadow-2xl animate-pulse-big">
							MATH GAMES!
						</span>
					</h1>
					<p className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
						Pick a game to play!
					</p>
				</div>

				<div className="grid md:grid-cols-2 gap-8">
					<Link
						href="/princess"
						className="group bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-8 border-pink-400 hover:border-pink-500 transition-all hover:scale-105 hover:shadow-3xl transform"
					>
						<div className="text-center">
							<div className="text-8xl md:text-9xl mb-6 group-hover:animate-bounce-fun">
								👑
							</div>
							<h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 text-transparent bg-clip-text">
								Rescue the Princess
							</h2>
							<p className="text-xl md:text-2xl font-bold text-slate-700 mb-4">
								Subtraction Adventure!
							</p>
							<div className="bg-purple-100 rounded-2xl p-4 border-4 border-purple-300">
								<p className="text-lg md:text-xl font-bold text-purple-800">
									Solve problems to move along the path and save the princess!
								</p>
							</div>
						</div>
					</Link>

					<Link
						href="/hangman"
						className="group bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-8 border-orange-400 hover:border-orange-500 transition-all hover:scale-105 hover:shadow-3xl transform"
					>
						<div className="text-center">
							<div className="text-8xl md:text-9xl mb-6 group-hover:animate-bounce-fun">
								⚡
							</div>
							<h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-transparent bg-clip-text">
								Speed Math Challenge
							</h2>
							<p className="text-xl md:text-2xl font-bold text-slate-700 mb-4">
								Fast & Fun!
							</p>
							<div className="bg-orange-100 rounded-2xl p-4 border-4 border-orange-300">
								<p className="text-lg md:text-xl font-bold text-orange-800">
									Race against the clock! 30 seconds to solve each problem!
								</p>
							</div>
						</div>
					</Link>
				</div>
			</div>
		</main>
	)
}
