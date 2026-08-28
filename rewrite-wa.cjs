const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

// The block to replace: from 'async function generateAIResponse(messageText: string) {'
// to '    return "System Error: Unable to reach neural network.";\n  }\n}'
const newFunc = `async function generateAIResponse(messageText: string) {
  if (!ai) return "Pragna AI is currently unavailable (No API Key).";
  try {
    const voiceRulesText = globalSettings.voiceRules && globalSettings.voiceRules.length > 0
      ? "\\n### VOICE TRAINING SCENARIOS (CRITICAL):\\n" + globalSettings.voiceRules.map(r => \`- If user's message matches or is similar to "\${r.scenario}", you MUST reply EXACTLY word-for-word with: "\${r.response}"\`).join('\\n')
      : "";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
      ]
    });
    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error: any) {
    console.error("AI Error:", error);
    return "System Error: Unable to reach neural network.";
  }
}
`;

content = content.replace(/async function generateAIResponse\(messageText: string\) \{[\s\S]*?System Error: Unable to reach neural network\.";\n  \}\n\}/, newFunc);

fs.writeFileSync(file, content);
