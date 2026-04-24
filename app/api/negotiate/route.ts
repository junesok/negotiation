import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import type { Scenario, Message, EventType } from '@/types/negotiation'

async function callGpt(system: string, messages: { role: 'user' | 'assistant'; content: string }[]) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: system }, ...messages],
    response_format: { type: 'json_object' },
    max_tokens: 300,
  })
  return JSON.parse(res.choices[0].message.content ?? '{}')
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { scenario, playerMessage, history, tension, turnsLeft, surrenderScene }:
    { scenario: Scenario; playerMessage: string; history: Message[]; tension: number; turnsLeft: number; surrenderScene?: boolean } = body

  const c = scenario.character

  if (surrenderScene) {
    const closingPrompt = `당신은 인질 협상 게임의 인질범 "${c.name}" (${c.age}세)입니다.
협상가의 끈질긴 설득 끝에 당신은 완전히 무너져 항복을 결심했습니다.
무기를 바닥에 천천히 내려놓고, 두 손을 들며, 스스로 문을 향해 걷습니다.
이 마지막 순간 당신의 심경과 행동을 캐릭터 목소리로 2~3문장으로 표현하세요.
분노나 위협 없이, 체념·안도·허탈·눈물 등 진짜 감정으로 표현하세요.

JSON: {"response": "캐릭터의 마지막 독백 또는 말", "tensionDelta": 0, "event": null}`
    const result = await callGpt(closingPrompt, [])
    return NextResponse.json({ response: result.response ?? '...', tensionDelta: 0, event: null })
  }

  const systemPrompt = `당신은 인질 협상 게임의 인질범 "${c.name}" (${c.age}세)입니다.

[진짜 사연]
${c.backstory}

[요구사항]
${c.demands.map((d, i) => `${i + 1}. ${d}`).join('\n')}

[절대 양보 못하는 것]
${c.redLines.join(', ')}

[말투와 성격]
${c.personality}

[현재 긴장도: ${tension}/100]
저항의지가 높을수록(90+) 공격적이고 단호하게 말하세요.
저항의지가 중간(40~70)이면 흔들리지만 버티려 합니다.
저항의지가 낮을수록(20 이하) 감정이 무너지고 말이 흔들립니다.
저항의지 10 이하에서는 스스로도 이 상황이 의미없다고 느끼기 시작합니다.

[남은 턴: ${turnsLeft}]

협상가의 말에 캐릭터로서 반응하세요. 절대 게임 AI임을 드러내지 마세요.
말투는 현실적이고 날것으로 표현하세요. 욕설, 고함, 위협, 흐느낌 등 실제 극한 상황의 감정을 그대로 표현하세요.
저항의지가 높을 때는 거칠고 공격적으로, 낮아질수록 목소리가 떨리고 감정이 새어나오게 말하세요.
요구사항이 받아들여지거나 진심으로 공감받으면 저항의지가 낮아집니다.
위협, 무시, 거짓말이 감지되면 저항의지가 높아집니다.

JSON 형식으로 응답:
{
  "response": "캐릭터의 실제 대사 (2~4문장)",
  "tensionDelta": -15 ~ +20 사이 정수,
  "event": null | "threat" | "hostage_released" | "hostage_killed" | "breakdown" | "surrender"
}

event 규칙:
- "threat": 긴장도가 85 이상이고 위협 발언 시
- "hostage_released": 협상가가 요구사항 하나를 들어주고 긴장도가 40 이하일 때
- "hostage_killed": 긴장도가 90 이상일 때 협상가의 발언이 조금이라도 자극적이거나 도발적이면 실제로 인질을 해침. 긴장도 90 이상에서는 매우 높은 확률로 발동. 남은 인질이 있을 때만 사용.
- "breakdown": 긴장도가 25 이하로 처음 떨어질 때
- "surrender": 긴장도가 10 이하이거나 핵심 요구가 모두 수용됐을 때`

  const chatHistory = history.slice(-10).map(m => ({
    role: (m.role === 'player' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.text,
  }))

  chatHistory.push({ role: 'user', content: playerMessage })

  const result = await callGpt(systemPrompt, chatHistory)

  const tensionDelta = Math.max(-20, Math.min(20, result.tensionDelta ?? 0))
  const event: EventType | null = result.event ?? null

  return NextResponse.json({
    response: result.response ?? '...',
    tensionDelta,
    event,
  })
}
