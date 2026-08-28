const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `        // Indicate typing
        await sock.sendPresenceUpdate('composing', senderId);
        
        const replyText = await generateAIResponse(promptText, audioData);
        
        // Send reply
        await sock.sendMessage(senderId, { text: replyText }, { quoted: msg });
        await sock.sendPresenceUpdate('paused', senderId);

        // Generate and send audio
        await sock.sendPresenceUpdate('recording', senderId);
        const audioBuffer = await generateAIAudio(replyText);
        if (audioBuffer) {
           await sock.sendMessage(senderId, { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true });
        }
        await sock.sendPresenceUpdate('paused', senderId);`;

const newBlock = `        // Indicate typing
        await sock.sendPresenceUpdate('composing', senderId);
        
        const replyText = await generateAIResponse(promptText, audioData);
        
        if (audioMessage) {
           // User sent audio, so we ONLY reply with audio
           await sock.sendPresenceUpdate('recording', senderId);
           const audioBuffer = await generateAIAudio(replyText);
           if (audioBuffer) {
              await sock.sendMessage(senderId, { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
           } else {
              // Fallback if audio generation fails
              await sock.sendMessage(senderId, { text: replyText }, { quoted: msg });
           }
        } else {
           // User sent text, so we ONLY reply with text
           await sock.sendMessage(senderId, { text: replyText }, { quoted: msg });
        }
        
        await sock.sendPresenceUpdate('paused', senderId);`;

if (content.includes("await sock.sendMessage(senderId, { text: replyText }, { quoted: msg });")) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(file, content);
  console.log("Upsert block patched successfully!");
} else {
  console.log("Could not find block to replace.");
}
