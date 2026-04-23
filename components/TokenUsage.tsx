'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function TokenUsage() {
  const [cost, setCost] = useState<number | null>(null)
  useEffect(() => {
    const fetch = () => axios.get('/api/billing').then(r => setCost(r.data.estimatedUsdCost)).catch(() => {})
    fetch()
    const id = setInterval(fetch, 10000)
    return () => clearInterval(id)
  }, [])
  if (cost === null) return null
  return (
    <span className="text-xs font-mono text-zinc-700" title="이번 세션 예상 비용">
      ~${cost.toFixed(4)}
    </span>
  )
}
