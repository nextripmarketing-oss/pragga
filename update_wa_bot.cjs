const fs = require('fs');
let waBotContent = fs.readFileSync('wa-bot.ts', 'utf8');

const regex = /You also have the following ALGERIA JOB PACKAGE details[\s\S]*?When a client messages asking about jobs, Algeria, costs, or salaries, provide this information naturally and professionally in Bengali\./;

waBotContent = waBotContent.replace(regex, '${globalSettings.marketingMode ? MARKETING_BLOCK : ""}');

if (!waBotContent.includes('import { globalSettings, MARKETING_BLOCK }')) {
  waBotContent = waBotContent.replace("import { GoogleGenAI } from '@google/genai';", "import { GoogleGenAI } from '@google/genai';\nimport { globalSettings, MARKETING_BLOCK } from './shared-state';");
}

fs.writeFileSync('wa-bot.ts', waBotContent);
