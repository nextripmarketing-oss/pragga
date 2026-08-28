import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateAIAudio(text: string): Promise<Buffer | null> {
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"] as any,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const tmpId = Math.random().toString(36).substring(7);
    const pcmPath = path.join('/tmp', 'audio-' + tmpId + '.pcm');
    const oggPath = path.join('/tmp', 'audio-' + tmpId + '.ogg');

    fs.writeFileSync(pcmPath, Buffer.from(base64Audio, 'base64'));

    await execAsync('ffmpeg -f s16le -ar 24000 -ac 1 -i ' + pcmPath + ' -c:a libopus -y ' + oggPath);
    
    const oggBuffer = fs.readFileSync(oggPath);
    fs.unlinkSync(pcmPath);
    fs.unlinkSync(oggPath);
    return oggBuffer;
  } catch (error) {
    console.error("AI Audio Error:", error);
    return null;
  }
}

async function main() {
  const buf = await generateAIAudio("জি স্যার, আমাদের অফিস পুরানা পল্টন, ফাহিমা টাওয়ারের উল্টো পাশে।");
  if (buf) {
    console.log("Success, buffer size:", buf.length);
  } else {
    console.log("Failed");
  }
}

main();
