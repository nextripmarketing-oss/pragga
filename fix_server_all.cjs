const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

// Imports
if (!content.includes('setVoiceRules')) {
  content = content.replace(
    'import { globalSettings, setMarketingMode, MARKETING_BLOCK } from "./shared-state";',
    'import { globalSettings, setMarketingMode, setVoiceRules, MARKETING_BLOCK } from "./shared-state";'
  );
}

// Endpoints
const insertionPoint = content.indexOf('app.get("/api/health"');
const newEndpoints = `
  app.get("/api/settings/marketing-instructions", (req, res) => {
    res.json({ instructions: globalSettings.marketingInstructions });
  });

  app.post("/api/settings/marketing-instructions", express.json(), (req, res) => {
    const { instructions } = req.body;
    if (typeof instructions === 'string') {
      globalSettings.marketingInstructions = instructions;
      res.json({ success: true, instructions: globalSettings.marketingInstructions });
    } else {
      res.status(400).json({ error: "Invalid string value" });
    }
  });

  app.get("/api/settings/voice-rules", (req, res) => {
    res.json({ rules: globalSettings.voiceRules });
  });

  app.post("/api/settings/voice-rules", express.json(), (req, res) => {
    const { rules } = req.body;
    if (Array.isArray(rules)) {
      setVoiceRules(rules);
      res.json({ success: true, rules: globalSettings.voiceRules });
    } else {
      res.status(400).json({ error: "Invalid rules format" });
    }
  });

`;

if (!content.includes('marketing-instructions')) {
  content = content.slice(0, insertionPoint) + newEndpoints + content.slice(insertionPoint);
}

fs.writeFileSync(file, content);
