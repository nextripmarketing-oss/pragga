const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('voiceRules')) {
  content = content.replace(
    'import { globalSettings, setMarketingMode, MARKETING_BLOCK } from "./shared-state";',
    'import { globalSettings, setMarketingMode, setVoiceRules, MARKETING_BLOCK } from "./shared-state";'
  );

  const insertionPoint = content.indexOf('app.get("/api/settings/marketing-instructions"');
  const newEndpoints = `
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

  content = content.slice(0, insertionPoint) + newEndpoints + content.slice(insertionPoint);
  fs.writeFileSync(file, content);
}
