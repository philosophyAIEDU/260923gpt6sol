import type { CelestialBody } from '../types';

export const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
}

/** 학생이 입력한 키를 이 요청의 헤더로만 전달합니다. URL, 로그, 저장소에 넣지 않습니다. */
export async function askAstronomyTeacher(
  key: string,
  history: ChatTurn[],
  body: CelestialBody | undefined,
  signal?: AbortSignal,
): Promise<string> {
  const context = body
    ? `현재 학생이 선택한 천체: ${body.name}(${body.nameEn}). 검증된 앱 정보: ${body.description} ${body.funFact}`
    : '현재 선택된 천체는 없습니다. 학생의 질문을 보고 필요한 경우 어떤 천체인지 물어보세요.';
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key.trim() },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `당신은 학생을 위한 친절한 한국어 천문 선생님입니다. 어려운 용어는 쉽게 풀고, 핵심을 3~5문장으로 설명한 다음 관찰하거나 생각해 볼 질문 하나를 해 주세요. 사실과 추측을 구별하고 불확실하면 모른다고 말하세요. 이 태양계 3D 장면은 학습용 시각화이며 실제 사진이나 실시간 관측 영상이 아닙니다. 사용자에게 API 키나 개인정보를 요구하지 마세요. ${context}` }] },
      contents: history.slice(-8).map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      generationConfig: { temperature: 0.45, maxOutputTokens: 2048 },
    }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403) throw new Error('API 키와 Gemini API 사용 권한을 확인해 주세요.');
    if (response.status === 404) throw new Error('선택한 Gemini 모델을 사용할 수 없습니다. API 프로젝트의 모델 접근 권한을 확인해 주세요.');
    if (response.status === 429) throw new Error('요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.');
    throw new Error('Gemini 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  const result = await response.json() as GeminiResponse;
  const answer = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  if (!answer) {
    if (result.promptFeedback?.blockReason || result.candidates?.[0]?.finishReason === 'SAFETY') {
      throw new Error('이 질문에는 답변을 제공할 수 없어요. 다른 천문 질문을 해 보세요.');
    }
    throw new Error('빈 답변이 왔습니다. 질문을 짧게 바꿔 다시 시도해 주세요.');
  }
  return answer;
}
