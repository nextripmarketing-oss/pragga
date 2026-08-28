const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "      const voiceRulesText",
  ");\n\n      const voiceRulesText"
); // Wait, this is error prone. Let me use string replacements carefully.

// Let's just rewrite the function
content = content.replace(/async function generateAIResponse[\s\S]*?try {[\s\S]*?const response = await ai\.models\.generateContent\(\{[\s\S]*?model: 'gemini-2\.5-flash',[\s\S]*?const voiceRulesText[\s\S]*?contents: \[[\s\S]*?role: 'user',[\s\S]*?parts: \[\{ text: \`You are Pragna[\s\S]*?User Message: \$\{messageText\}\`\}\][\s\S]*?\}\][\s\S]*?\}\);/m, 
\`async function generateAIResponse(messageText: string) {
  if (!ai) return "Pragna AI is currently unavailable (No API Key).";
  try {
    const voiceRulesText = globalSettings.voiceRules && globalSettings.voiceRules.length > 0
      ? "\\n### VOICE TRAINING SCENARIOS (CRITICAL):\\n" + globalSettings.voiceRules.map(r => \\\`- If user's message matches or is similar to "\${r.scenario}", you MUST reply EXACTLY word-for-word with: "\${r.response}"\\\`).join('\\n')
      : "";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: \\\`You are Pragna, a highly intelligent and slightly sarcastic AI assistant for NexTrip Travels. 
You must remember the following critical office address and contact information:
Nextrip Tours And Travels
50, Purana Paltan, Ruhama Mension, Lift er 7, Fahima Tower er Ulta pashe
Phone: 01750843027

\${globalSettings.marketingMode ? globalSettings.marketingInstructions : ""}
\${voiceRulesText}

Answer the following WhatsApp message concisely and helpfully in Bengali or English based on the input.

User Message: \${messageText}\\\`}]
        }
      ]
    });\`
);

fs.writeFileSync(file, content);
