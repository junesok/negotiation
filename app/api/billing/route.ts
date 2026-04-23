import { NextResponse } from 'next/server'

const PRICE_INPUT = 0.15
const PRICE_OUTPUT = 0.60

export interface UsageStats {
  promptTokens: number
  completionTokens: number
  estimatedUsdCost: number
  callCount: number
}

const stats: UsageStats = { promptTokens: 0, completionTokens: 0, estimatedUsdCost: 0, callCount: 0 }

export function recordUsage(prompt: number, completion: number) {
  stats.promptTokens += prompt
  stats.completionTokens += completion
  stats.estimatedUsdCost += (prompt / 1_000_000) * PRICE_INPUT + (completion / 1_000_000) * PRICE_OUTPUT
  stats.callCount += 1
}

export async function GET() {
  return NextResponse.json(stats)
}
