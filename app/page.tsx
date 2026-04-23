'use client'
import { useState, useEffect, useRef } from 'react'
import { useNegotiation } from '@/hooks/useNegotiation'
import { SCENARIOS } from '@/lib/scenarios'
import TokenUsage from '@/components/TokenUsage'

export default function Page() {
  const { state, busy, startGame, sendMessage, reset } = useNegotiation()
  const [input, setInput] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxH = 76
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px'
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden'
  }

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [state.messages])

  const handleSend = () => {
    if (!input.trim() || busy) return
    sendMessage(input, state)
    setInput('')
  }

  const willState =
    state.tension >= 90 ? { label: '극도로 방어적', color: 'text-red-400', bar: 'bg-red-700' } :
    state.tension >= 70 ? { label: '방어적', color: 'text-orange-400', bar: 'bg-orange-700' } :
    state.tension >= 50 ? { label: '경계 중', color: 'text-yellow-500', bar: 'bg-yellow-700' } :
    state.tension >= 30 ? { label: '흔들림', color: 'text-blue-400', bar: 'bg-blue-700' } :
    state.tension >= 15 ? { label: '감정 붕괴', color: 'text-indigo-400', bar: 'bg-indigo-700' } :
    { label: '항복 직전', color: 'text-green-400', bar: 'bg-green-700' }

  // ── SETUP ────────────────────────────────────────────────────
  if (state.phase === 'SETUP') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-80 flex flex-col gap-6">
          <div className="text-center flex flex-col gap-1">
            <div className="text-xs font-mono text-zinc-600 tracking-widest">NEGOTIATION</div>
            <h1 className="text-xl font-mono text-zinc-100 tracking-widest">인질 협상</h1>
            <p className="text-xs font-mono text-zinc-600 mt-1">30턴 안에 인질범을 설득하세요</p>
          </div>

          <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
            {SCENARIOS.map(s => (
              <button key={s.id} onClick={() => startGame(s)}
                className="flex flex-col gap-1 p-4 border border-zinc-800 rounded text-left hover:border-zinc-600 transition-colors group shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-zinc-300 group-hover:text-white transition-colors">{s.title}</span>
                  <span className="text-xs font-mono text-zinc-700 shrink-0">{s.location}</span>
                </div>
                <p className="text-xs font-mono text-zinc-600 leading-relaxed">{s.briefing.slice(0, 60)}...</p>
                <div className="text-xs font-mono text-zinc-700">인질 {s.hostageCount}명</div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <TokenUsage />
          </div>
        </div>
      </main>
    )
  }

  // ── WIN / LOSE ────────────────────────────────────────────────
  if (state.phase === 'WIN' || state.phase === 'LOSE') {
    const isWin = state.phase === 'WIN'
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-96 flex flex-col gap-6 items-center">
          <div className="text-center flex flex-col gap-2">
            <div className={`text-2xl font-mono tracking-widest ${isWin ? 'text-zinc-100' : 'text-red-400'}`}>
              {isWin ? '협상 성공' : '협상 실패'}
            </div>
            <div className="text-xs font-mono text-zinc-500">
              {isWin
                ? `${state.scenario?.character.name}이(가) 항복했습니다. 인질 ${state.hostageCount}명 전원 안전.`
                : state.tension >= 95
                  ? '긴장이 극도로 치달아 사건이 최악으로 치달았습니다.'
                  : '제한 시간이 초과되어 특공대가 진입했습니다.'}
            </div>
          </div>

          {/* 대화 요약 */}
          <div ref={logRef} className="w-full border border-zinc-800 rounded p-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
            {state.messages.map((m, i) => (
              <div key={i} className={`text-xs font-mono ${m.role === 'player' ? 'text-zinc-400' : 'text-zinc-300'}`}>
                <span className="text-zinc-600">{m.role === 'player' ? '협상가' : state.scenario?.character.name}: </span>
                {m.text}
              </div>
            ))}
          </div>

          <button onClick={reset}
            className="py-2 px-6 text-xs font-mono border border-zinc-600 text-zinc-200 rounded hover:border-zinc-400 transition-colors tracking-widest">
            다시 하기
          </button>
        </div>
      </main>
    )
  }

  // ── PLAYING ──────────────────────────────────────────────────
  const scenario = state.scenario!

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex justify-center py-6">
      <div className="w-[720px] flex flex-col gap-4 px-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-600 tracking-widest">NEGOTIATION</span>
            <span className="text-xs font-mono text-zinc-700">{scenario.location}</span>
          </div>
          <div className="flex items-center gap-3">
            <TokenUsage />
            <span className={`text-xs font-mono tabular-nums px-2 py-0.5 border rounded ${state.turnsLeft <= 5 ? 'border-red-900 text-red-500' : 'border-zinc-800 text-zinc-500'}`}>
              {state.turnsLeft}턴
            </span>
          </div>
        </div>

        {/* 상태 패널 */}
        <div className="border border-zinc-800 rounded p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-600">저항의지</span>
            <span className={`text-xs font-mono ${willState.color}`}>{willState.label}</span>
          </div>
          <div className="h-2 bg-zinc-900 rounded overflow-hidden">
            <div className={`h-full ${willState.bar} transition-all duration-500`} style={{ width: `${state.tension}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-700">
            <span>항복</span>
            <span>저항</span>
          </div>

          {/* 인질 현황 */}
          <div className="border-t border-zinc-900 pt-3 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-600">인질 현황</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-500">
                석방 <span className="text-green-600 tabular-nums">{scenario.hostageCount - state.hostageCount}</span>명
              </span>
              <span className="text-xs font-mono text-zinc-700">|</span>
              <span className="text-xs font-mono text-zinc-500">
                억류 <span className="text-zinc-300 tabular-nums">{state.hostageCount}</span>명
              </span>
            </div>
          </div>

          {/* 인질 아이콘 */}
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: scenario.hostageCount }).map((_, i) => (
              <div key={i}
                className={`w-4 h-4 rounded-sm border transition-colors duration-300 ${
                  i < scenario.hostageCount - state.hostageCount
                    ? 'border-green-800 bg-green-900/40'
                    : 'border-zinc-700 bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 상황 브리핑 (최초 1회) */}
        {state.messages.length === 0 && (
          <div className="border border-zinc-800 rounded p-4 flex flex-col gap-3">
            <div className="text-xs font-mono text-zinc-600">상황 브리핑</div>
            <p className="text-xs font-mono text-zinc-400 leading-relaxed">{scenario.briefing}</p>
            <div className="border-t border-zinc-900 pt-3 flex flex-col gap-1">
              <div className="text-xs font-mono text-zinc-600">요구사항</div>
              {scenario.character.demands.map((d, i) => (
                <span key={i} className="text-xs font-mono text-zinc-500">· {d}</span>
              ))}
            </div>
            <div className="text-xs font-mono text-zinc-700">
              저항의지를 0으로 만드세요. 첫 마디를 건네세요.
            </div>
          </div>
        )}

        {/* 이벤트 배너 */}
        {state.lastEvent && state.lastEvent !== null && (
          <div className={`px-3 py-2 rounded text-xs font-mono border ${
            state.lastEvent === 'surrender' || state.lastEvent === 'hostage_released' || state.lastEvent === 'breakdown'
              ? 'border-green-900 text-green-500 bg-green-950/20'
              : 'border-red-900 text-red-500 bg-red-950/20'
          }`}>
            {{
              threat: '위협: 인질범이 극단적인 발언을 했습니다.',
              hostage_released: '인질 1명이 석방되었습니다.',
              breakdown: '인질범이 감정적으로 무너지고 있습니다.',
              surrender: '인질범이 항복 의사를 보입니다.',
            }[state.lastEvent]}
          </div>
        )}

        {/* 대화 로그 */}
        <div ref={logRef} className="flex flex-col gap-3 min-h-[280px] max-h-[400px] overflow-y-auto border border-zinc-900 rounded p-4">
          {state.messages.map((m, i) => (
            <div key={i} className={`flex flex-col gap-0.5 ${m.role === 'player' ? 'items-end' : 'items-start'}`}>
              <span className="text-xs font-mono text-zinc-700">
                {m.role === 'player' ? '협상가' : scenario.character.name}
              </span>
              <div className={`max-w-[85%] px-3 py-2 rounded text-xs font-mono leading-relaxed ${
                m.role === 'player'
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'border border-zinc-800 text-zinc-300'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-start">
              <div className="border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-700 animate-pulse">
                {scenario.character.name} ...
              </div>
            </div>
          )}
        </div>

        {/* 입력창 */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); adjustHeight() }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
                if (textareaRef.current) textareaRef.current.style.height = 'auto'
              }
            }}
            placeholder="협상가로서 말을 건네세요... (Shift+Enter 줄바꿈)"
            disabled={busy}
            rows={1}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-600 disabled:opacity-40 placeholder:text-zinc-700 resize-none overflow-hidden leading-relaxed"
          />
          <button onClick={() => { handleSend(); if (textareaRef.current) textareaRef.current.style.height = 'auto' }}
            disabled={busy || !input.trim()}
            className="px-4 py-2 text-xs font-mono border border-zinc-700 text-zinc-400 rounded hover:border-zinc-500 disabled:opacity-30 transition-colors shrink-0">
            전송
          </button>
        </div>
      </div>
    </main>
  )
}
