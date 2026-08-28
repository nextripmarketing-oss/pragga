const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `      // Extract text from various message types
      const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
      
      if (textMessage) {
        console.log(\`[WhatsApp] Received: \${textMessage} from \${senderId}\`);
        
        // Indicate typing
        await sock.sendPresenceUpdate('composing', senderId);
        
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

      }`;

const newBlock = `      // Extract text and audio from various message types
      const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const audioMessage = msg.message.audioMessage;
      
      if (textMessage || audioMessage) {
        console.log(\`[WhatsApp] Received message from \${senderId}\`);
        
        let audioData;
        let promptText = textMessage || "The user sent a voice message. Please listen to it and respond beautifully in Bengali.";
        
        if (audioMessage) {
           console.log(\`[WhatsApp] Downloading audio message from \${senderId}\`);
           try {
             const buffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                { logger: pino({ level: 'silent' }) }
             );
             audioData = {
               mimeType: audioMessage.mimetype || 'audio/ogg',
               data: buffer.toString('base64')
             };
           } catch (err) {
             console.error("Error downloading audio message:", err);
             promptText += " (Note: The system failed to download the audio message, politely inform the user that you couldn't hear it.)";
           }
        }
        
        // Indicate typing
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
        await sock.sendPresenceUpdate('paused', senderId);

      }`;

if (content.includes("const textMessage = msg.message.conversation")) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(file, content);
  console.log("Patched successfully!");
} else {
  console.log("Could not find block to replace.");
}
