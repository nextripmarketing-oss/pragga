const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

const oldAudioBlock = `async function generateAIAudio(text: string): Promise<Buffer | null> {
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
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
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
  } catch (error: any) {
    fs.appendFileSync('wa_audio_log.txt', "Audio generation error: " + error?.message + "\\n");
    if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('Quota exceeded')) {
      console.warn("\\n[WhatsApp] ⚠️ Gemini TTS Free Tier Limit Reached (10 requests/minute). Falling back to text message.\\n");
    } else {
      console.error("AI Audio Error:", error);
    }
    return null;
  }
}`;

const newAudioBlock = `const gTTS = require('gtts');

async function generateAIAudio(text: string): Promise<Buffer | null> {
  try {
    fs.appendFileSync('wa_audio_log.txt', "Generating audio for: " + text.substring(0, 50) + "\\n");
    
    // Clean text to avoid breaking the TTS engine
    const cleanText = text.replace(/[*#_]/g, '');

    return new Promise((resolve, reject) => {
      const tts = new gTTS(cleanText, 'bn');
      const tmpId = Math.random().toString(36).substring(7);
      const mp3Path = path.join('/tmp', \`audio-\${tmpId}.mp3\`);
      const oggPath = path.join('/tmp', \`audio-\${tmpId}.ogg\`);

      tts.save(mp3Path, async (err: any) => {
        if (err) {
          fs.appendFileSync('wa_audio_log.txt', "gTTS error: " + err + "\\n");
          return resolve(null);
        }

        try {
          // Convert MP3 to Opus OGG for WhatsApp Voice Notes
          await execAsync(\`ffmpeg -i \${mp3Path} -c:a libopus -y \${oggPath}\`);
          const oggBuffer = fs.readFileSync(oggPath);
          
          // Cleanup
          fs.unlinkSync(mp3Path);
          fs.unlinkSync(oggPath);
          
          fs.appendFileSync('wa_audio_log.txt', "Successfully generated audio of size: " + oggBuffer.length + "\\n");
          resolve(oggBuffer);
        } catch (convErr) {
           fs.appendFileSync('wa_audio_log.txt', "FFMPEG error: " + convErr + "\\n");
           resolve(null);
        }
      });
    });
  } catch (error: any) {
    fs.appendFileSync('wa_audio_log.txt', "Audio generation error: " + error?.message + "\\n");
    console.error("AI Audio Error:", error);
    return null;
  }
}`;

// Make sure to find the EXACT match, or we fall back to a more robust search.
const startMarker = `async function generateAIAudio(text: string): Promise<Buffer | null> {`;
const endMarker = `  } catch (error: any) {
    fs.appendFileSync('wa_audio_log.txt', "Audio generation error: " + error?.message + "\\n");
    if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('Quota exceeded')) {
      console.warn("\\n[WhatsApp] ⚠️ Gemini TTS Free Tier Limit Reached (10 requests/minute). Falling back to text message.\\n");
    } else {
      console.error("AI Audio Error:", error);
    }
    return null;
  }
}`;

if (content.includes(startMarker) && content.includes(endMarker)) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker) + endMarker.length;
  content = content.substring(0, startIndex) + newAudioBlock + content.substring(endIndex);
  fs.writeFileSync(file, content);
  console.log("Audio block patched successfully to use gTTS.");
} else {
  console.log("Could not find exact audio block boundaries.");
}
