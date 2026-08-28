const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

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
