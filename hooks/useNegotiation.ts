'use client'
import { useState, useCallback, useRef } from 'react'
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
  const [typingText, setTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typingInterval = useRef<ReturnType<typeof setInterval> | null>(null)

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

    let phase = gs.phase
    if (event === 'surrender' || newTension <= 5) {
      phase = 'WIN'
    } else if (turnsLeft <= 0 || newTension >= 95) {
      phase = 'LOSE'
    }

    // 타이프라이터 애니메이션
    setIsTyping(true)
    setTypingText('')

    let idx = 0
    typingInterval.current = setInterval(() => {
      idx++
      setTypingText(response.slice(0, idx))
      if (idx >= response.length) {
        clearInterval(typingInterval.current!)
        typingInterval.current = null
        setIsTyping(false)
        const suspectMsg = { role: 'suspect' as const, text: response }
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
      }
    }, 25)
  }, [busy])

  const reset = useCallback(() => {
    if (typingInterval.current) {
      clearInterval(typingInterval.current)
      typingInterval.current = null
    }
    setIsTyping(false)
    setTypingText('')
    setState(INIT)
  }, [])

  return { state, busy, isTyping, typingText, startGame, sendMessage, reset }
}
