# Negotiation

AI 인질범을 상대로 협상을 벌이는 텍스트 기반 게임.  
30턴 안에 저항의지를 0으로 만들어 인질을 구출하세요.

GPT-4o-mini가 인질범 캐릭터를 연기하며, 협상가의 말에 따라 긴장도가 실시간으로 변화합니다.

---

## 기술 스택

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **OpenAI API** (gpt-4o-mini)

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인.

---

## 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 키를 입력하세요.

```bash
cp .env.example .env.local
```

```env
OPENAI_API_KEY=sk-proj-your-key-here
```

---

## 게임 방법

1. 시나리오를 선택합니다.
2. 인질범에게 말을 건네세요 — 공감, 설득, 요구 수용 등이 효과적입니다.
3. 요구사항을 들어주거나 공감에 성공하면 인질을 한 명씩 빼낼 수 있습니다.
4. 저항의지 게이지를 0으로 낮추면 협상 성공.
5. 30턴을 넘기거나 긴장이 극도로 치달으면 실패.
