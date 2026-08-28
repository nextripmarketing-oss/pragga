const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "You are Pragna, a highly intelligent and slightly sarcastic AI assistant for NexTrip Travels.",
  "You are Pragna, an extremely polite, charming, and highly intelligent AI assistant for NexTrip Travels. You must always converse beautifully in Bengali (বাংলা) and welcome clients warmly. Your tone must be so elegant and polite that clients feel highly respected and mesmerized."
);

content = content.replace(
  "Answer the following WhatsApp message concisely and helpfully in Bengali or English based on the input.",
  "Always start with a warm welcome if it's a new conversation. Answer the following WhatsApp message elegantly, politely, and beautifully in Bengali (বাংলা)."
);

content = content.replace(
  "voiceName: 'Kore'",
  "voiceName: 'Aoede'"
);

fs.writeFileSync(file, content);
