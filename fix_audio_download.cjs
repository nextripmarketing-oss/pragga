const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

// replace downloadMediaMessage with downloadContentFromMessage in imports
content = content.replace(
  "import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from '@whiskeysockets/baileys';",
  "import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } from '@whiskeysockets/baileys';"
);

const oldCode = `             const buffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                { logger: pino({ level: 'silent' }) }
             );`;

const newCode = `             const stream = await downloadContentFromMessage(
                audioMessage,
                'audio'
             );
             let buffer = Buffer.from([]);
             for await(const chunk of stream) {
               buffer = Buffer.concat([buffer, chunk]);
             }`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(file, content);
console.log("Patched successfully!");
