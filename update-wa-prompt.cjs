const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('voiceRulesText')) {
  const replacement = `
const voiceRulesText = globalSettings.voiceRules && globalSettings.voiceRules.length > 0
  ? "\\n### VOICE TRAINING SCENARIOS (CRITICAL):\\n" + globalSettings.voiceRules.map(r => \`- If user's message matches or is similar to "\${r.scenario}", you MUST reply EXACTLY word-for-word with: "\${r.response}"\`).join('\\n')
  : "";

      contents: [
        {
          role: 'user',
          parts: [{ text: \`You are Pragna, a highly intelligent and slightly sarcastic AI assistant for NexTrip Travels. 
You must remember the following critical office address and contact information:
Nextrip Tours And Travels
50, Purana Paltan, Ruhama Mension, Lift er 7, Fahima Tower er Ulta pashe
Phone: 01750843027

\${globalSettings.marketingMode ? globalSettings.marketingInstructions : ""}
\${voiceRulesText}

Answer the following WhatsApp message concisely and helpfully in Bengali or English based on the input.

User Message: \${messageText}\`}]
        }
`;

  content = content.replace(/contents: \[\s*\{\s*role: 'user',\s*parts: \[\{ text: `You are Pragna, a highly intelligent and slightly sarcastic AI assistant for NexTrip Travels\. \s*You must remember the following critical office address and contact information:\s*Nextrip Tours And Travels\s*50, Purana Paltan, Ruhama Mension, Lift er 7, Fahima Tower er Ulta pashe\s*Phone: 01750843027\s*\$\{globalSettings\.marketingMode \? globalSettings\.marketingInstructions : ""\}\s*Answer the following WhatsApp message concisely and helpfully in Bengali or English based on the input\.\s*User Message: \$\{messageText\}`\}\]\s*\}\s*\]/m, replacement);
  fs.writeFileSync(file, content);
}
