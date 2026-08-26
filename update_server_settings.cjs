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
