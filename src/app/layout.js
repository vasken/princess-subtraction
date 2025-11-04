// app/layout.js
import './globals.css'

export const metadata = {
	title: 'Rescue the Princess',
	description: 'Kumon-style subtraction by regrouping game',
}

// ✅ Declare viewport separately
export const viewport = {
	width: 'device-width',
	initialScale: 1,
	// optional extras:
	// maximumScale: 1,
	// themeColor: '#f472b6',
}

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-pink-50 text-slate-800 antialiased">
				{children}
			</body>
		</html>
	)
}
