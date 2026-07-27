import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload limits for base64 image uploads
app.use(express.json({ limit: '15mb' }));

// Helper to instantiate Gemini AI client lazily
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. AI Camera Recognition Endpoint
app.post('/api/gemini/analyze-waste', async (req, res) => {
  try {
    const { imageBase64, textPrompt } = req.body;

    if (!imageBase64 && !textPrompt) {
      return res.status(400).json({ error: '이미지 또는 텍스트 설명이 필요합니다.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
너는 대한민국 표준 분리배출(환경부 분리배출 가이드라인) 전문 AI 감별사 '에코비움'이야.
사용자가 촬영하거나 입력한 재활용품/쓰레기 사진이나 설명을 분석하고, 정확한 분리배출 카테고리와 구체적인 분리배출 방법 3단계, 주의사항, 환경적 가치를 JSON 형식으로 답변해줘.

카테고리는 반드시 다음 중 하나만 선택해:
- 'PET' (투명 페트병)
- 'PLASTIC' (일반 플라스틱)
- 'VINYL' (비닐류)
- 'PAPER' (종이류 - 택배상자, 신문, 노트)
- 'PAPER_PACK' (종이팩 - 우유팩, 두유팩, 주스팩)
- 'GLASS' (유리병)
- 'CAN_METAL' (캔/고철류, 부탄가스)
- 'STYROFOAM' (스티로폼 - 완충재, 흰색 상자)
- 'GENERAL' (일반쓰레기 종량제 - 오염된 종이/플라스틱, 영수증, 깨진유리)
- 'E_WASTE' (폐가전, 폐건전지, 형광등)
- 'FOOD' (음식물 쓰레기)

출력 형식은 다음과 같은 유효한 JSON이어야 해:
{
  "itemName": "물품 이름 (예: 라벨 붙은 500ml 투명 페트병)",
  "category": "PET",
  "categoryNameKor": "투명 페트병",
  "recyclable": true,
  "recyclabilityScore": 95,
  "steps": [
    "1. 내용물을 깨끗이 비우고 물로 헹굽니다.",
    "2. 비닐 라벨을 떼어 비닐류로 분리합니다.",
    "3. 찌그러뜨려 뚜껑을 닫은 뒤 투명 페트병 전용함에 배출합니다."
  ],
  "caution": "라벨을 떼지 않고 배출하면 일반 쓰레기로 분류되거나 재활용 품질이 떨어집니다.",
  "disposalMethod": "아파트 단지 또는 지자체 지정 투명 페트병 전용 수거함",
  "environmentalImpact": "투명 페트병 10개를 올바르게 재활용하면 고품질 의류용 고기능성 원사 1벌을 만들 수 있습니다.",
  "tags": ["투명페트병", "라벨제거", "친환경"]
}
`;

    const contents: any = [];

    if (imageBase64) {
      // Extract base64 mime type and raw base64 data
      const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/jpeg';
      const rawData = match ? match[2] : imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

      contents.push({
        inlineData: {
          mimeType,
          data: rawData,
        },
      });
    }

    const userPrompt = textPrompt
      ? `이 물품의 사진/설명을 분석해주세요: "${textPrompt}"`
      : '사진 속 쓰레기/재활용품을 분석하여 올바른 분리배출법을 알려주세요.';

    contents.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Clean JSON if wrapped in markdown
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({ success: true, result: parsedData });
  } catch (error: any) {
    console.error('Error analyzing waste:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'AI 카메라 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
});

// 2. Recycling Verification Endpoint
app.post('/api/gemini/verify-disposal', async (req, res) => {
  try {
    const { imageBase64, expectedItem } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: '인증할 사진이 필요합니다.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
너는 분리배출 실천 인증 AI 심사위원이야.
사용자가 제출한 분리배출 사진을 평가해줘.
예:
- 투명 페트병: 라벨이 떼어졌는가? 씻겨져있는가? 압착되어있는가?
- 우유팩: 물로 헹구고 펼쳐 말려져있는가?
- 택배상자: 비닐 테이프와 운송장이 완전히 제거되어 있는가?
- 배달 용기: 빨간 양념 및 음식물이 깨끗이 세척되어 있는가?

판정 기준:
- 올바르게 분리배출 및 사전 작업(라벨 제거, 세척, 펼치기 등)이 확인되면 isPassed: true, score 80~100점, earnedPoints 100~150점 부여.
- 라벨 미제거, 테이프 미제거, 세척 안됨 등 미흡한 경우 isPassed: false, score 30~70점, earnedPoints 20~50점 부여 및 개선 팁 전달.

응답 JSON 구조:
{
  "isPassed": true,
  "score": 95,
  "itemName": "라벨이 깔끔하게 제거된 투명 페트병",
  "feedback": "완벽합니다! 비닐 라벨을 깔끔하게 떼어내고 세척 후 압착하여 배출 준비를 마쳤습니다.",
  "earnedPoints": 100,
  "tips": [
    "뚜껑을 찌그러뜨린 뒤 닫아서 내놓으면 수거 시 부피를 줄일 수 있습니다."
  ]
}
`;

    const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    const mimeType = match ? match[1] : 'image/jpeg';
    const rawData = match ? match[2] : imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const contents = [
      {
        inlineData: {
          mimeType,
          data: rawData,
        },
      },
      {
        text: expectedItem
          ? `사용자가 "${expectedItem}" 분리배출을 완료했다고 제출했습니다. 올바르게 배출 준비가 되었는지 검증해주세요.`
          : '제출된 사진이 올바르게 분리배출 준비가 되었는지 평가해주세요.',
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({ success: true, result: parsedData });
  } catch (error: any) {
    console.error('Error verifying disposal:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '인증 심사 중 오류가 발생했습니다.',
    });
  }
});

// 3. AI Waste Q&A Endpoint
app.post('/api/gemini/ask-qna', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: '질문을 입력해주세요.' });
    }

    const ai = getGenAIClient();

    const systemInstruction = `
너는 친절하고 명확한 대한민국 환경부 기준 분리수거 답변봇 '에코비움 챗봇'이야.
사용자의 질문에 대해:
1. 배출 구분 (예: 일반쓰레기 / 종이팩 / 투명페트병 / 불연성 마대 등)
2. 핵심 분리 법칙
3. 세부 배출 단계 및 꿀팁
을 친절하고 가독성 좋게 설명해줘.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: question,
      config: {
        systemInstruction,
      },
    });

    return res.json({ success: true, answer: response.text });
  } catch (error: any) {
    console.error('Error answering Q&A:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '질문 답변 생성 실패',
    });
  }
});

// Vite & Static file setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eco Sorting Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
