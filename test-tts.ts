import { GoogleGenAI, Modality } from "@google/genai";
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: 'হ্যালো, আমি প্রজ্ঞা। আপনি কেমন আছেন?' }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    fs.writeFileSync('test-bengali.pcm', Buffer.from(base64Audio, 'base64'));
    console.log('Saved test-bengali.pcm');
  }
}
test().catch(console.error);
