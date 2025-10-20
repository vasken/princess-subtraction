import Link from 'next/link'

/** Reusable game card */
function GameCard({
	href,
	ariaLabel,
	emoji,
	title,
	subtitle,
	description,
	videoSrc,
	poster, // optional: '/file.jpg'
	border = 'border-slate-400 hover:border-slate-500',
	titleGradient = 'from-white to-white',
	panelBg = 'bg-white/20',
	panelBorder = 'border-white/30',
}) {
	return (
		<Link
			href={href}
			aria-label={ariaLabel || title}
			className={`group relative rounded-3xl overflow-hidden border-8 ${border} shadow-2xl hover:shadow-3xl transform transition-all hover:scale-105 bg-black`}
		>
			{/* background video */}
			<video
				className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none motion-reduce:hidden"
				autoPlay
				muted
				loop
				playsInline
				preload="metadata"
				poster={poster || undefined}
			>
				<source src={videoSrc} type="video/webm" />
				{/* Optional image fallback:
					{poster ? <img src={poster} alt="" aria-hidden="true" /> : null} */}
			</video>

			{/* readability overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

			{/* content */}
			<div className="relative p-8 md:p-12 text-center">
				<div className="text-8xl md:text-9xl mb-6 group-hover:animate-bounce-fun">
					{emoji}
				</div>
				<h3
					className={`text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r ${titleGradient} text-transparent bg-clip-text drop-shadow`}
				>
					{title}
				</h3>
				{subtitle ? (
					<p className="text-xl md:text-2xl font-bold text-white/90 mb-4 drop-shadow">
						{subtitle}
					</p>
				) : null}
				<div
					className={`${panelBg} backdrop-blur-sm rounded-2xl p-4 border-4 ${panelBorder}`}
				>
					<p className="text-lg md:text-xl font-bold text-white">
						{description}
					</p>
				</div>
			</div>
		</Link>
	)
}

/** Configurable game lists (edit here, not JSX) */
const MATH_GAMES = [
	{
		href: '/princess',
		emoji: '👑',
		title: 'Rescue the Princess',
		subtitle: 'Subtraction Adventure!',
		description: 'Solve problems to move along the path and save the princess!',
		videoSrc: '/sofia-running.webm',
		border: 'border-pink-400 hover:border-pink-500',
		titleGradient: 'from-pink-200 via-fuchsia-200 to-white',
		panelBg: 'bg-white/20',
		panelBorder: 'border-white/30',
	},
	{
		href: '/hangman',
		emoji: '⚡',
		title: 'Speed Math Challenge',
		subtitle: 'Fast & Fun!',
		description: 'Race against the clock! 30 seconds to solve each problem!',
		videoSrc: '/aurora-sick.webm',
		border: 'border-orange-400 hover:border-orange-500',
		titleGradient: 'from-orange-300 via-yellow-200 to-white',
		panelBg: 'bg-black/30',
		panelBorder: 'border-white/30',
	},
]

const LANGUAGE_GAMES = [
	{
		href: '/spelling',
		emoji: '📚',
		title: 'Spelling Library',
		subtitle: 'Listen & Type',
		description: 'Hear a word, spell it correctly, and advance on the board!',
		videoSrc: '/belle-reading.webm', // place in /public
		border: 'border-violet-400 hover:border-violet-500',
		titleGradient: 'from-violet-200 via-rose-200 to-white',
		panelBg: 'bg-white/20',
		panelBorder: 'border-white/30',
	},
]

export default function Home() {
	return (
		<main className="min-h-screen bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center p-6 md:p-10 relative overflow-hidden">
			{/* floating sparkle bits */}
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

			<div className="w-full max-w-6xl relative z-10 space-y-12">
				{/* Header */}
				<div className="text-center">
					<h1 className="text-6xl md:text-8xl font-black mb-4 leading-tight">
						<span className="inline-block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 text-transparent bg-clip-text drop-shadow-2xl animate-pulse-big">
							LEARNING GAMES
						</span>
					</h1>
					<p className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
						Pick a game to play!
					</p>
				</div>

				{/* Math Section */}
				<section aria-labelledby="math-games">
					<h2
						id="math-games"
						className="text-2xl md:text-3xl font-black text-white/95 drop-shadow mb-4"
					>
						🧮 Math
					</h2>
					<div className="grid grid-cols-2 gap-8">
						{MATH_GAMES.map((g) => (
							<GameCard key={g.href} {...g} />
						))}
					</div>
				</section>

				{/* Language Section */}
				<section aria-labelledby="language-games">
					<h2
						id="language-games"
						className="text-2xl md:text-3xl font-black text-white/95 drop-shadow mb-4"
					>
						🔤 Language
					</h2>
					<div className="grid grid-cols-2 gap-8">
						{LANGUAGE_GAMES.map((g) => (
							<GameCard key={g.href} {...g} />
						))}
					</div>
				</section>
			</div>
		</main>
	)
}
