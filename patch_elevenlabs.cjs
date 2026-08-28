const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

const startMarker = `async function generateAIAudio(text: string): Promise<Buffer | null> {`;
const endMarker = `  } catch (error: any) {
    fs.appendFileSync('wa_audio_log.txt', "Audio generation error: " + error?.message + "\\n");
    console.error("AI Audio Error:", error);
    return null;
  }
}`;

const newAudioBlock = `async function generateAIAudio(text: string): Promise<Buffer | null> {
  try {
    fs.appendFileSync('wa_audio_log.txt', "Generating audio for: " + text.substring(0, 50) + "\\n");
    
    // Clean text to avoid breaking the TTS engine
    const cleanText = text.replace(/[*#_]/g, '');

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      console.warn("[WhatsApp] ELEVENLABS_API_KEY not found. TTS is disabled.");
      fs.appendFileSync('wa_audio_log.txt', "ELEVENLABS_API_KEY missing\\n");
      return null;
    }

    const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Sarah voice (good multilingual)
    const response = await fetch(\`https://api.elevenlabs.io/v1/text-to-speech/\${voiceId}\`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      fs.appendFileSync('wa_audio_log.txt', "ElevenLabs API Error: " + errText + "\\n");
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tmpId = Math.random().toString(36).substring(7);
    const mp3Path = path.join('/tmp', \`audio-\${tmpId}.mp3\`);
    const oggPath = path.join('/tmp', \`audio-\${tmpId}.ogg\`);

    fs.writeFileSync(mp3Path, buffer);

    // Convert MP3 to Opus OGG for WhatsApp Voice Notes
    await execAsync(\`ffmpeg -i \${mp3Path} -c:a libopus -y \${oggPath}\`);
    const oggBuffer = fs.readFileSync(oggPath);
    
    // Cleanup
    fs.unlinkSync(mp3Path);
    fs.unlinkSync(oggPath);
    
    fs.appendFileSync('wa_audio_log.txt', "Successfully generated audio of size: " + oggBuffer.length + "\\n");
    return oggBuffer;
  } catch (error: any) {
    fs.appendFileSync('wa_audio_log.txt', "Audio generation error: " + error?.message + "\\n");
    console.error("AI Audio Error:", error);
    return null;
  }
}`;

if (content.includes(startMarker) && content.includes(endMarker)) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker) + endMarker.length;
  content = content.substring(0, startIndex) + newAudioBlock + content.substring(endIndex);
  
  // Also remove gtts require if it exists at the top
  content = content.replace("const gTTS = require('gtts');\n\n", "");
  
  fs.writeFileSync(file, content);
  console.log("Audio block patched successfully to use ElevenLabs.");
} else {
  console.log("Could not find exact audio block boundaries.");
}
