export type Phase = 'SETUP' | 'PLAYING' | 'SURRENDERING' | 'WIN' | 'LOSE'

export type EventType =
  | 'threat'           // 위협 발언
  | 'hostage_released' // 인질 석방
  | 'hostage_killed'   // 인질 제거
  | 'breakdown'        // 감정 붕괴 (협상 여지)
  | 'surrender'        // 항복

export interface Scenario {
  id: string
  title: string
  location: string
  character: {
    name: string
    age: number
    backstory: string      // AI에게 전달되는 진짜 동기
    demands: string[]      // 요구사항
    redLines: string[]     // 절대 양보 안 하는 것
    personality: string    // 말투/성격
  }
  hostageCount: number
  briefing: string         // 플레이어에게 보여주는 상황 설명
}

export interface Message {
  role: 'player' | 'suspect' | 'event'
  text: string
  eventType?: EventType
}

export interface GameState {
  phase: Phase
  scenario: Scenario | null
  messages: Message[]
  tension: number          // 0~100 (낮을수록 협상 여지)
  hostageCount: number     // 현재 억류 중인 인질 수
  killedCount: number      // 사망한 인질 수
  turnsLeft: number
  lastEvent: EventType | null
  loseReason?: 'timeout' | 'all_killed' | 'suspect_fired'
}
