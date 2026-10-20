import OpenAI from 'openai'

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

export async function completeJson(system: string, user: string): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  const client = new OpenAI({ apiKey, timeout: 25_000, maxRetries: 0 })
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  const text = completion.choices[0]?.message?.content
  if (!text) throw new Error('The model returned an empty response')
  return JSON.parse(text) as unknown
}
