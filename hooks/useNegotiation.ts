'use client'
import { useState, useCallback } from 'react'
import type { GameState, Scenario, EventType } from '@/types/negotiation'
import axios from 'axios'

const INIT: GameState = {
  phase: 'SETUP',
  scenario: null,
  messages: [],
  tension: 70,
  hostageCount: 0,
  turnsLeft: 30,
  lastEvent: null,
}

export function useNegotiation() {
  const [state, setState] = useState<GameState>(INIT)
  const [busy, setBusy] = useState(false)

  const startGame = useCallback((scenario: Scenario) => {
    setState({
      ...INIT,
      phase: 'PLAYING',
      scenario,
      hostageCount: scenario.hostageCount,
      tension: 70,
    })
  }, [])

  const sendMessage = useCallback(async (text: string, gs: GameState) => {
    if (!text.trim() || !gs.scenario || busy) return
    setBusy(true)

    const playerMsg = { role: 'player' as const, text: text.trim() }
    const updatedMessages = [...gs.messages, playerMsg]

    setState(s => ({ ...s, messages: updatedMessages }))

    const res = await axios.post('/api/negotiate', {
      scenario: gs.scenario,
      playerMessage: text.trim(),
      history: gs.messages,
      tension: gs.tension,
      turnsLeft: gs.turnsLeft,
    })

    const { response, tensionDelta, event }: { response: string; tensionDelta: number; event: EventType | null } = res.data

    const newTension = Math.max(0, Math.min(100, gs.tension + tensionDelta))
    const turnsLeft = gs.turnsLeft - 1

    let hostageCount = gs.hostageCount
    if (event === 'hostage_released' && hostageCount > 0) hostageCount -= 1

    const suspectMsg = { role: 'suspect' as const, text: response }

    // 종료 조건 판단
    let phase = gs.phase
    if (event === 'surrender' || newTension <= 5) {
      phase = 'WIN'
    } else if (turnsLeft <= 0 || newTension >= 95) {
      phase = 'LOSE'
    }

    setState(s => ({
      ...s,
      messages: [...updatedMessages, suspectMsg],
      tension: newTension,
      turnsLeft,
      hostageCount,
      lastEvent: event,
      phase,
    }))

    setBusy(false)
  }, [busy])

  const reset = useCallback(() => setState(INIT), [])

  return { state, busy, startGame, sendMessage, reset }
}
