import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
import { GoogleGenAI } from '@google/genai';
import { globalSettings, MARKETING_BLOCK } from './shared-state';

let currentQR: string | null = null;
let connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
let sock: any = null;

// Initialize Gemini
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function generateAIResponse(messageText: string, audioData?: { mimeType: string, data: string }) {
  if (!ai) return "Pragna AI is currently unavailable (No API Key).";
  try {
    const voiceRulesText = globalSettings.voiceRules && globalSettings.voiceRules.length > 0
      ? "\n### VOICE TRAINING SCENARIOS (CRITICAL):\n" + globalSettings.voiceRules.map(r => `- If user's message matches or is similar to "${r.scenario}", you MUST reply EXACTLY word-for-word with: "${r.response}"`).join('\n')
      : "";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: (audioData ? [{ inlineData: audioData }, { text: `You are Pragna, an extremely polite, charming, and highly intelligent AI assistant for NexTrip Travels. You must always converse beautifully in Bengali (বাংলা) and welcome clients warmly. Your tone must be so elegant and polite that clients feel highly respected and mesmerized. 
You must remember the following critical office address and contact information:
Nextrip Tours And Travels
50, Purana Paltan, Ruhama Mension, Lift er 7, Fahima Tower er Ulta pashe
Phone: 01750843027

${globalSettings.marketingMode ? globalSettings.marketingInstructions : ""}
${voiceRulesText}

You MUST always start your response with 'আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহি ওয়াবারাকাতুহু' and a warm welcome. Answer the following WhatsApp message elegantly, politely, and beautifully in Bengali (বাংলা).

User Message: ${messageText}`}] : [{ text: `You are Pragna, an extremely polite, charming, and highly intelligent AI assistant for NexTrip Travels. You must always converse beautifully in Bengali (বাংলা) and welcome clients warmly. Your tone must be so elegant and polite that clients feel highly respected and mesmerized.

You must remember the following critical office address and contact information:
Nextrip Tours And Travels
50, Purana Paltan, Ruhama Mension, Lift er 7, Fahima Tower er Ulta pashe
Phone: 01750843027

${globalSettings.marketingMode ? globalSettings.marketingInstructions : ""}
${voiceRulesText}

You MUST always start your response with 'আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহি ওয়াবারাকাতুহু' and a warm welcome. Answer the following WhatsApp message elegantly, politely, and beautifully in Bengali (বাংলা).

User Message: ${messageText}` }])
        }
      ]
    });
    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error: any) {
    console.error("AI Error:", error);
    return "System Error: Unable to reach neural network.";
  }
}




async function generateAIAudio(text: string): Promise<Buffer | null> {
  if (!ai) {
    fs.appendFileSync('wa_audio_log.txt', "No AI instance\n");
    return null;
  }
  try {
    fs.appendFileSync('wa_audio_log.txt', "Generating audio for: " + text.substring(0, 50) + "\n");
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
      fs.appendFileSync('wa_audio_log.txt', "No base64Audio returned\n");
      return null;
    }

    const tmpId = Math.random().toString(36).substring(7);
    const pcmPath = path.join('/tmp', `audio-${tmpId}.pcm`);
    const oggPath = path.join('/tmp', `audio-${tmpId}.ogg`);

    fs.writeFileSync(pcmPath, Buffer.from(base64Audio, 'base64'));

    await execAsync(`ffmpeg -f s16le -ar 24000 -ac 1 -i ${pcmPath} -c:a libopus -y ${oggPath}`);
    
    const oggBuffer = fs.readFileSync(oggPath);
    
    // Cleanup
    fs.unlinkSync(pcmPath);
    fs.unlinkSync(oggPath);
    
    fs.appendFileSync('wa_audio_log.txt', "Successfully generated audio of size: " + oggBuffer.length + "\n");
    return oggBuffer;
  } catch (error) {
    fs.appendFileSync('wa_audio_log.txt', "Audio generation error: " + (error as any).message + "\n");
    console.error("AI Audio Error:", error);
    return null;
  }
}


export async function startWhatsAppBot() {
  if (connectionStatus === 'connected' || connectionStatus === 'connecting') return;
  connectionStatus = 'connecting';
  currentQR = null;

  try {
    const { state, saveCreds } = await useMultiFileAuthState('/tmp/wa-auth');
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }) as any,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        currentQR = await qrcode.toDataURL(qr);
      }

      if (connection === 'close') {
        currentQR = null;
        connectionStatus = 'disconnected';
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          setTimeout(startWhatsAppBot, 5000);
        } else {
          console.log('WhatsApp logged out. Need to scan QR again.');
          // Clean up auth folder if needed, but baileys handles it mostly
        }
      } else if (connection === 'open') {
        currentQR = null;
        connectionStatus = 'connected';
        console.log('WhatsApp Bot Connected successfully!');
      }
    });

    sock.ev.on('messages.upsert', async (m: any) => {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return; // Ignore own messages

      const senderId = msg.key.remoteJid;
      if (senderId?.includes('@g.us')) return; // Ignore group messages for now to prevent spam

      // Extract text and audio from various message types
      const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const audioMessage = msg.message.audioMessage;
      
      if (textMessage || audioMessage) {
        console.log(`[WhatsApp] Received message from ${senderId}`);
        
        let audioData;
        let promptText = textMessage || "The user sent a voice message. Please listen to it and respond beautifully in Bengali.";
        
        if (audioMessage) {
           console.log(`[WhatsApp] Downloading audio message from ${senderId}`);
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

      }
    });

  } catch (err) {
    console.error("Failed to start WhatsApp bot:", err);
    connectionStatus = 'disconnected';
  }
}

export function getWhatsAppStatus() {
  return {
    status: connectionStatus,
    qr: currentQR
  };
}

export async function sendWhatsAppMessage(number: string, text: string) {
  if (connectionStatus !== 'connected' || !sock) {
    throw new Error("WhatsApp is not connected. Please link via QR code first.");
  }
  
  // Clean number
  let cleanNumber = number.replace(/[^0-9]/g, '');
  
  if (!cleanNumber) {
    throw new Error("Invalid phone number provided. Must contain digits.");
  }

  // If it's a Bangladeshi local number (e.g., 017XXXXXX), add '88'
  if (cleanNumber.startsWith('01') && cleanNumber.length === 11) {
    cleanNumber = '88' + cleanNumber;
  }

  const jid = `${cleanNumber}@s.whatsapp.net`;
  
  await sock.sendMessage(jid, { text });
  return `Message successfully sent to ${cleanNumber}.`;
}

export async function stopWhatsAppBot() {
  if (sock) {
    sock.logout();
    connectionStatus = 'disconnected';
    currentQR = null;
  }
}
