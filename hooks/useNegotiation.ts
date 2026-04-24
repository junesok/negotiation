'use client'
import { useState, useCallback, useRef } from 'react'
import type { GameState, Scenario, EventType, Message, Phase } from '@/types/negotiation'
import axios from 'axios'

const INIT: GameState = {
  phase: 'SETUP',
  scenario: null,
  messages: [],
  tension: 70,
  hostageCount: 0,
  killedCount: 0,
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
    let killedCount = gs.killedCount
    if (event === 'hostage_released' && hostageCount > 0) hostageCount -= 1
    if (event === 'hostage_killed' && hostageCount > 0) {
      hostageCount -= 1
      killedCount += 1
    }

    let phase: Phase = gs.phase
    if (event === 'surrender' || newTension <= 5) {
      phase = 'SURRENDERING'
    } else if (turnsLeft <= 0 || (gs.scenario && killedCount >= gs.scenario.hostageCount)) {
      phase = 'LOSE'
    }

    const doClosingScene = async (scenario: Scenario, messages: Message[]) => {
      try {
        const closingRes = await axios.post('/api/negotiate', {
          scenario,
          surrenderScene: true,
          history: messages,
          playerMessage: '',
          tension: 0,
          turnsLeft: 0,
        })
        const closingResponse: string = closingRes.data.response ?? '...'
        setIsTyping(true)
        setTypingText('')
        let ci = 0
        typingInterval.current = setInterval(() => {
          ci++
          setTypingText(closingResponse.slice(0, ci))
          if (ci >= closingResponse.length) {
            clearInterval(typingInterval.current!)
            typingInterval.current = null
            setIsTyping(false)
            const closingMsg = { role: 'suspect' as const, text: closingResponse }
            const winMsg: Message = { role: 'event', text: '인질범이 무기를 내려놓고 스스로 걸어나왔습니다.', eventType: 'surrender' }
            setState(s => ({
              ...s,
              messages: [...s.messages, closingMsg, winMsg],
              hostageCount: 0,
              phase: 'WIN',
            }))
            setBusy(false)
          }
        }, 25)
      } catch {
        setState(s => ({ ...s, phase: 'WIN' }))
        setBusy(false)
      }
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
        const eventMessages: Message[] = event ? [{
          role: 'event',
          text: {
            threat: '인질범이 극단적인 위협을 가했습니다.',
            hostage_released: '인질 1명이 석방되었습니다.',
            hostage_killed: '인질 1명이 사망했습니다.',
            breakdown: '인질범이 감정적으로 무너지고 있습니다.',
            surrender: '인질범이 항복 의사를 보입니다.',
          }[event],
          eventType: event,
        }] : []
        const finalMessages = [...updatedMessages, suspectMsg, ...eventMessages]
        setState(s => ({
          ...s,
          messages: finalMessages,
          tension: newTension,
          turnsLeft,
          hostageCount,
          killedCount,
          lastEvent: event,
          phase,
        }))
        if (phase === 'SURRENDERING') {
          doClosingScene(gs.scenario!, finalMessages)
        } else {
          setBusy(false)
        }
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
