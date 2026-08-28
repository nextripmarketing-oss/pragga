const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

// 1. Update imports
content = content.replace(
  "import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';",
  "import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from '@whiskeysockets/baileys';"
);

// 2. Modify generateAIResponse to accept audioData
content = content.replace(
  "async function generateAIResponse(messageText: string) {",
  "async function generateAIResponse(messageText: string, audioData?: { mimeType: string, data: string }) {"
);

// 3. Update the contents array in generateContent to include audio if present
content = content.replace(
  "parts: [{ text: `You are Pragna, an extremely polite",
  "parts: (audioData ? [{ inlineData: audioData }, { text: `You are Pragna, an extremely polite"
);
content = content.replace(
  "User Message: ${messageText}`}]",
  "User Message: ${messageText}`}] : [{ text: `You are Pragna, an extremely polite, charming, and highly intelligent AI assistant for NexTrip Travels. You must always converse beautifully in Bengali (বাংলা) and welcome clients warmly. Your tone must be so elegant and polite that clients feel highly respected and mesmerized.\n\nYou must remember the following critical office address and contact information:\nNextrip Tours And Travels\n50, Purana Paltan, Ruhama Mension, Lift er 7, Fahima Tower er Ulta pashe\nPhone: 01750843027\n\n${globalSettings.marketingMode ? globalSettings.marketingInstructions : \"\"}\n${voiceRulesText}\n\nYou MUST always start your response with 'আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহি ওয়াবারাকাতুহু' and a warm welcome. Answer the following WhatsApp message elegantly, politely, and beautifully in Bengali (বাংলা).\n\nUser Message: ${messageText}` }])"
);

fs.writeFileSync(file, content);
