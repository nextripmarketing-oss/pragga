const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

// Add import
if (!serverContent.includes('import { globalSettings, setMarketingMode }')) {
  serverContent = serverContent.replace('import { startWhatsAppBot', 'import { globalSettings, setMarketingMode } from "./shared-state";\nimport { startWhatsAppBot');
}

// Add API endpoints
if (!serverContent.includes('/api/settings/marketing-mode')) {
  const endpoints = `
  app.get("/api/settings/marketing-mode", (req, res) => {
    res.json({ enabled: globalSettings.marketingMode });
  });

  app.post("/api/settings/marketing-mode", express.json(), (req, res) => {
    const { enabled } = req.body;
    if (typeof enabled === 'boolean') {
      setMarketingMode(enabled);
      res.json({ success: true, enabled: globalSettings.marketingMode });
    } else {
      res.status(400).json({ error: "Invalid boolean value" });
    }
  });
`;
  serverContent = serverContent.replace('app.get("/api/health"', endpoints + '\n  app.get("/api/health"');
}

// Modify the prompt to conditionally include marketing
// The marketing block starts at `### CORPORATE KNOWLEDGE (NEXTRIP TRAVELS):` and ends at `Always invite the client to visit the office for official processing.`
// Let's replace the whole string with a dynamic evaluation.

fs.writeFileSync('server.ts', serverContent);
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

// Insert GET /api/settings/marketing-instructions and POST /api/settings/marketing-instructions
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

`;

if (!content.includes('app.get("/api/settings/marketing-instructions"')) {
    content = content.slice(0, insertionPoint) + newEndpoints + content.slice(insertionPoint);
    fs.writeFileSync(file, content);
}
