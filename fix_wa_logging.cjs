const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

const replacement = `
async function generateAIAudio(text: string): Promise<Buffer | null> {
  if (!ai) {
    fs.appendFileSync('wa_audio_log.txt', "No AI instance\\n");
    return null;
  }
  try {
    fs.appendFileSync('wa_audio_log.txt', "Generating audio for: " + text.substring(0, 50) + "\\n");
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
    if (!base64Audio) {
      fs.appendFileSync('wa_audio_log.txt', "No base64Audio returned\\n");
      return null;
    }

    const tmpId = Math.random().toString(36).substring(7);
    const pcmPath = path.join('/tmp', \`audio-\${tmpId}.pcm\`);
    const oggPath = path.join('/tmp', \`audio-\${tmpId}.ogg\`);

    fs.writeFileSync(pcmPath, Buffer.from(base64Audio, 'base64'));

    await execAsync(\`ffmpeg -f s16le -ar 24000 -ac 1 -i \${pcmPath} -c:a libopus -y \${oggPath}\`);
    
    const oggBuffer = fs.readFileSync(oggPath);
    
    // Cleanup
    fs.unlinkSync(pcmPath);
    fs.unlinkSync(oggPath);
    
    fs.appendFileSync('wa_audio_log.txt', "Successfully generated audio of size: " + oggBuffer.length + "\\n");
    return oggBuffer;
  } catch (error) {
    fs.appendFileSync('wa_audio_log.txt', "Audio generation error: " + (error as any).message + "\\n");
    console.error("AI Audio Error:", error);
    return null;
  }
}
`;

content = content.replace(/async function generateAIAudio\([\s\S]*?\n\}/, replacement);
fs.writeFileSync(file, content);
