import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import pino from 'pino';
import { GoogleGenAI } from '@google/genai';
import { globalSettings, MARKETING_BLOCK } from './shared-state';

let currentQR: string | null = null;
let connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
let sock: any = null;

// Initialize Gemini
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function generateAIResponse(messageText: string) {
  if (!ai) return "Pragna AI is currently unavailable (No API Key).";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `You are Pragna, a highly intelligent and slightly sarcastic AI assistant for NexTrip Travels. 
You must remember the following critical office address and contact information:
Nextrip Tours And Travels
50, Purana Paltan, Ruhama Mension, Lift er 7, Fahima Tower er Ulta pashe
Phone: 01750843027

${globalSettings.marketingMode ? MARKETING_BLOCK : ""}

Answer the following WhatsApp message concisely and helpfully in Bengali or English based on the input.
User Message: ${messageText}`}]
        }
      ]
    });
    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error: any) {
    console.error("AI Error:", error);
    return "System Error: Unable to reach neural network.";
  }
}

export async function startWhatsAppBot() {
  if (connectionStatus === 'connected' || connectionStatus === 'connecting') return;
  connectionStatus = 'connecting';
  currentQR = null;

  try {
    const { state, saveCreds } = await useMultiFileAuthState('./wa-auth');
    
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

      // Extract text from various message types
      const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
      
      if (textMessage) {
        console.log(`[WhatsApp] Received: ${textMessage} from ${senderId}`);
        
        // Indicate typing
        await sock.sendPresenceUpdate('composing', senderId);
        
        const replyText = await generateAIResponse(textMessage);
        
        // Send reply
        await sock.sendMessage(senderId, { text: replyText }, { quoted: msg });
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
