'use client'
import { useState, useEffect, useRef } from 'react'
import { useNegotiation } from '@/hooks/useNegotiation'
import { SCENARIOS } from '@/lib/scenarios'

export default function Page() {
  const { state, busy, isTyping, typingText, startGame, sendMessage, reset } = useNegotiation()
  const [input, setInput] = useState('')
  const [briefingOpen, setBriefingOpen] = useState(true)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
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
  }, [state.messages, typingText])

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
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-xs flex flex-col gap-6">
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
        </div>
      </main>
    )
  }

  // ── WIN / LOSE ────────────────────────────────────────────────
  if (state.phase === 'WIN' || state.phase === 'LOSE') {
    const isWin = state.phase === 'WIN'
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col gap-6 items-center">
          <div className="text-center flex flex-col gap-2">
            <div className={`text-2xl font-mono tracking-widest ${isWin ? 'text-zinc-100' : 'text-red-400'}`}>
              {isWin ? '협상 성공' : '협상 실패'}
            </div>
            <div className="text-xs font-mono text-zinc-500">
              {isWin
                ? state.killedCount > 0
                  ? `${state.scenario?.character.name}이(가) 항복했습니다. 인질 ${state.hostageCount}명 생존, ${state.killedCount}명 사망.`
                  : `${state.scenario?.character.name}이(가) 항복했습니다. 인질 ${state.hostageCount}명 전원 안전.`
                : state.scenario && state.killedCount >= state.scenario.hostageCount
                  ? '인질 전원이 사망했습니다. 협상이 완전히 실패했습니다.'
                  : '제한 시간이 초과되어 특공대가 진입했습니다.'}
            </div>
          </div>

          <div ref={logRef} className="w-full border border-zinc-800 rounded p-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
            {state.messages.map((m, i) => {
              if (m.role === 'event') {
                const isPositive = m.eventType === 'hostage_released' || m.eventType === 'breakdown' || m.eventType === 'surrender'
                const isKilled = m.eventType === 'hostage_killed'
                return (
                  <div key={i} className={`text-xs font-mono text-center ${isKilled ? 'text-red-500' : isPositive ? 'text-green-600' : 'text-orange-500'}`}>
                    — {m.text} —
                  </div>
                )
              }
              return (
                <div key={i} className={`text-xs font-mono ${m.role === 'player' ? 'text-zinc-400' : 'text-zinc-300'}`}>
                  <span className="text-zinc-600">{m.role === 'player' ? '협상가' : state.scenario?.character.name}: </span>
                  {m.text}
                </div>
              )
            })}
          </div>

          <button onClick={reset}
            className="py-2 px-6 text-xs font-mono border border-zinc-600 text-zinc-200 rounded hover:border-zinc-400 transition-colors tracking-widest">
            목록으로
          </button>
        </div>
      </main>
    )
  }

  // ── PLAYING ──────────────────────────────────────────────────
  const scenario = state.scenario!

  return (
    <main className="h-screen overflow-hidden bg-[#0a0a0a] flex justify-center">
      <div className="w-full max-w-[720px] flex flex-col h-full px-4 py-4 gap-3">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors tracking-widest"
            >
              ← 목록
            </button>
            <span className="text-xs font-mono text-zinc-800">|</span>
            <span className="text-xs font-mono text-zinc-700">{scenario.location}</span>
          </div>
          <span className={`text-xs font-mono tabular-nums px-2 py-0.5 border rounded ${state.turnsLeft <= 5 ? 'border-red-900 text-red-500' : 'border-zinc-800 text-zinc-500'}`}>
            {state.turnsLeft}턴
          </span>
        </div>

        {/* 상태 패널 */}
        <div className="border border-zinc-800 rounded p-3 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-600">저항의지</span>
            <span className={`text-xs font-mono ${willState.color}`}>{willState.label}</span>
          </div>
          <div className="h-1.5 bg-zinc-900 rounded overflow-hidden">
            <div className={`h-full ${willState.bar} transition-all duration-500`} style={{ width: `${state.tension}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-700">
            <span>항복</span>
            <span>저항</span>
          </div>

          {/* 인질 현황 */}
          <div className="border-t border-zinc-900 pt-2 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-600">인질 현황</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-500">
                석방 <span className="text-green-600 tabular-nums">{scenario.hostageCount - state.hostageCount - state.killedCount}</span>명
              </span>
              {state.killedCount > 0 && (
                <>
                  <span className="text-xs font-mono text-zinc-700">|</span>
                  <span className="text-xs font-mono text-zinc-500">
                    사망 <span className="text-red-500 tabular-nums">{state.killedCount}</span>명
                  </span>
                </>
              )}
              <span className="text-xs font-mono text-zinc-700">|</span>
              <span className="text-xs font-mono text-zinc-500">
                억류 <span className="text-zinc-300 tabular-nums">{state.hostageCount}</span>명
              </span>
            </div>
          </div>

          {/* 인질 아이콘 */}
          {(() => {
            const released = scenario.hostageCount - state.hostageCount - state.killedCount
            return (
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: scenario.hostageCount }).map((_, i) => (
                  <div key={i}
                    className={`w-3.5 h-3.5 rounded-sm border transition-colors duration-300 ${
                      i < released
                        ? 'border-green-800 bg-green-900/40'
                        : i < released + state.killedCount
                          ? 'border-red-800 bg-red-900/50'
                          : 'border-zinc-700 bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            )
          })()}
        </div>

        {/* 상황 브리핑 */}
        <div className="border border-zinc-800 rounded shrink-0">
          <button
            onClick={() => setBriefingOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <span>상황 브리핑</span>
            <span className="text-zinc-700">{briefingOpen ? '−' : '+'}</span>
          </button>
          {briefingOpen && (
            <div className="px-3 pb-3 flex flex-col gap-2 border-t border-zinc-900">
              <p className="text-xs font-mono text-zinc-400 leading-relaxed pt-2">{scenario.briefing}</p>
              <div className="flex flex-col gap-1">
                <div className="text-xs font-mono text-zinc-600">요구사항</div>
                {scenario.character.demands.map((d, i) => (
                  <span key={i} className="text-xs font-mono text-zinc-500">· {d}</span>
                ))}
              </div>
              {state.messages.length === 0 && (
                <div className="text-xs font-mono text-zinc-700">
                  저항의지를 0으로 만드세요. 첫 마디를 건네세요.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 대화 로그 */}
        <div ref={logRef} className="flex-1 min-h-0 overflow-y-auto border border-zinc-900 rounded p-4 flex flex-col gap-3">
          {state.messages.map((m, i) => {
            if (m.role === 'event') {
              const isPositive = m.eventType === 'hostage_released' || m.eventType === 'breakdown' || m.eventType === 'surrender'
              const isKilled = m.eventType === 'hostage_killed'
              return (
                <div key={i} className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className={`text-xs font-mono px-2 shrink-0 ${
                    isKilled ? 'text-red-400' : isPositive ? 'text-green-500' : 'text-orange-400'
                  }`}>
                    {m.text}
                  </span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>
              )
            }
            return (
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
            )
          })}
          {busy && !isTyping && (
            <div className="flex items-start">
              <div className="border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-700 animate-pulse">
                {scenario.character.name} ...
              </div>
            </div>
          )}
          {isTyping && (
            <div className="flex flex-col gap-0.5 items-start">
              <span className="text-xs font-mono text-zinc-700">{scenario.character.name}</span>
              <div className="max-w-[85%] px-3 py-2 rounded text-xs font-mono leading-relaxed border border-zinc-800 text-zinc-300">
                {typingText}<span className="animate-pulse">|</span>
              </div>
            </div>
          )}
        </div>

        {/* 입력창 */}
        <div className="flex gap-2 items-end shrink-0">
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
            placeholder="협상가로서 말을 건네세요..."
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

      {/* 포기 확인 팝업 */}
      {showQuitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-zinc-700 rounded p-6 flex flex-col gap-4 w-full max-w-xs">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-mono text-zinc-200">협상을 포기하시겠습니까?</div>
              <div className="text-xs font-mono text-zinc-600">진행 중인 협상이 종료되고 목록으로 돌아갑니다.</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { reset(); setShowQuitConfirm(false) }}
                className="flex-1 py-2 text-xs font-mono border border-zinc-600 text-zinc-300 rounded hover:border-zinc-400 transition-colors"
              >
                포기
              </button>
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-2 text-xs font-mono border border-zinc-800 text-zinc-500 rounded hover:border-zinc-600 transition-colors"
              >
                계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
