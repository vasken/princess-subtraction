// app/api/storycraft/route.js
import OpenAI from 'openai'

export async function POST(req) {
	try {
		const { prompt, model } = await req.json()

		if (typeof prompt !== 'string' || !prompt.trim()) {
			return new Response(JSON.stringify({ error: 'Missing prompt string.' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
		if (!client.apiKey) {
			return new Response(
				JSON.stringify({ error: 'OPENAI_API_KEY is not set on the server.' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } },
			)
		}

		const completion = await client.chat.completions.create({
			model: (model || 'gpt-4o-mini').trim(),
			temperature: 0.7,
			messages: [
				{
					role: 'system',
					content:
						"You are a friendly children's storyteller. Follow the user's prompt exactly. Return plain text only (no code fences).",
				},
				{ role: 'user', content: prompt },
			],
		})

		const story =
			(completion.choices?.[0]?.message?.content || '')
				.replace(/^```[\s\S]*?\n/, '')
				.replace(/```$/, '')
				.trim() || 'Once upon a time…'

		return new Response(JSON.stringify({ story }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (err) {
		console.error('storycraft error:', err)
		return new Response(JSON.stringify({ error: 'Story generation failed.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
