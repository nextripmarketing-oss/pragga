const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `  } catch (error) {
    fs.appendFileSync('wa_audio_log.txt', "Audio generation error: " + (error as any).message + "\\n");
    console.error("AI Audio Error:", error);
    return null;
  }`;

const newBlock = `  } catch (error: any) {
    fs.appendFileSync('wa_audio_log.txt', "Audio generation error: " + error?.message + "\\n");
    if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('Quota exceeded')) {
      console.warn("\\n[WhatsApp] ⚠️ Gemini TTS Free Tier Limit Reached (10 requests/minute). Falling back to text message.\\n");
    } else {
      console.error("AI Audio Error:", error);
    }
    return null;
  }`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(file, content);
  console.log("Error handler patched successfully!");
} else {
  console.log("Could not find block to replace.");
}
