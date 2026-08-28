const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("generateAIAudio")) {
    const importFs = `import fs from 'fs';\nimport { exec } from 'child_process';\nimport { promisify } from 'util';\nimport path from 'path';\n\nconst execAsync = promisify(exec);\n`;
    content = content.replace("import { GoogleGenAI } from '@google/genai';", importFs + "import { GoogleGenAI } from '@google/genai';");

    const audioFn = `
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
    const pcmPath = path.join('/tmp', \`audio-\${tmpId}.pcm\`);
    const oggPath = path.join('/tmp', \`audio-\${tmpId}.ogg\`);

    fs.writeFileSync(pcmPath, Buffer.from(base64Audio, 'base64'));

    await execAsync(\`ffmpeg -f s16le -ar 24000 -ac 1 -i \${pcmPath} -c:a libopus -y \${oggPath}\`);
    
    const oggBuffer = fs.readFileSync(oggPath);
    
    // Cleanup
    fs.unlinkSync(pcmPath);
    fs.unlinkSync(oggPath);
    
    return oggBuffer;
  } catch (error) {
    console.error("AI Audio Error:", error);
    return null;
  }
}
`;
    content = content.replace("export async function startWhatsAppBot() {", audioFn + "\nexport async function startWhatsAppBot() {");

    const msgHandling = `
        const replyText = await generateAIResponse(textMessage);
        
        // Send reply
        await sock.sendMessage(senderId, { text: replyText }, { quoted: msg });
        await sock.sendPresenceUpdate('paused', senderId);

        // Generate and send audio
        await sock.sendPresenceUpdate('recording', senderId);
        const audioBuffer = await generateAIAudio(replyText);
        if (audioBuffer) {
           await sock.sendMessage(senderId, { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true });
        }
        await sock.sendPresenceUpdate('paused', senderId);
`;
    content = content.replace(`
        const replyText = await generateAIResponse(textMessage);
        
        // Send reply
        await sock.sendMessage(senderId, { text: replyText }, { quoted: msg });
        await sock.sendPresenceUpdate('paused', senderId);`, msgHandling);
    
    fs.writeFileSync(file, content);
}
