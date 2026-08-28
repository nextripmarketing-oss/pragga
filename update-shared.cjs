const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'shared-state.ts');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('voiceRules')) {
  content = content.replace('marketingInstructions: MARKETING_BLOCK', 'marketingInstructions: MARKETING_BLOCK,\n  voiceRules: [] as {id: string, scenario: string, response: string}[]');
  
  content += `\n\nexport function setVoiceRules(rules: {id: string, scenario: string, response: string}[]) {\n  globalSettings.voiceRules = rules;\n}\n`;
  fs.writeFileSync(file, content);
}
