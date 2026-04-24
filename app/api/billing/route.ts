import { NextResponse } from 'next/server'

const PRICE_INPUT = 0.15
const PRICE_OUTPUT = 0.60

export async function GET() {
  const apiKey = process.env.OPENAI_ADMIN_KEY ?? process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ estimatedUsdCost: 0 })

  const startOfToday = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)

  try {
    const res = await fetch(
      `https://api.openai.com/v1/organization/usage/completions?start_time=${startOfToday}&limit=180`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      }
    )

    if (!res.ok) return NextResponse.json({ estimatedUsdCost: 0 })

    const json = await res.json()

    let inputTokens = 0
    let outputTokens = 0
    for (const item of json.data ?? []) {
      inputTokens += item.input_tokens ?? 0
      outputTokens += item.output_tokens ?? 0
    }

    const estimatedUsdCost =
      (inputTokens / 1_000_000) * PRICE_INPUT +
      (outputTokens / 1_000_000) * PRICE_OUTPUT

    return NextResponse.json({ estimatedUsdCost })
  } catch {
    return NextResponse.json({ estimatedUsdCost: 0 })
  }
}
