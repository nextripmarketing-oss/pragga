const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "    const response = await ai.models.generateContent({\n      model: 'gemini-2.5-flash',\n      \nconst voiceRulesText = globalSettings.voiceRules && globalSettings.voiceRules.length > 0\n  ? \"\\n### VOICE TRAINING SCENARIOS (CRITICAL):\\n\" + globalSettings.voiceRules.map(r => \\`- If user's message matches or is similar to \"\${r.scenario}\", you MUST reply EXACTLY word-for-word with: \"\${r.response}\"\\`).join('\\n')\n  : \"\";\n\n      contents: [",
  "    const voiceRulesText = globalSettings.voiceRules && globalSettings.voiceRules.length > 0\n      ? \"\\n### VOICE TRAINING SCENARIOS (CRITICAL):\\n\" + globalSettings.voiceRules.map(r => \\`- If user's message matches or is similar to \"\${r.scenario}\", you MUST reply EXACTLY word-for-word with: \"\${r.response}\"\\`).join('\\n')\n      : \"\";\n\n    const response = await ai.models.generateContent({\n      model: 'gemini-2.5-flash',\n      contents: ["
);

fs.writeFileSync(file, content);
