// app/layout.js
import './globals.css'

export const metadata = {
	title: 'Rescue the Princess',
	description: 'Kumon-style subtraction by regrouping game',
	viewport: 'width=device-width, initial-scale=1',
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
