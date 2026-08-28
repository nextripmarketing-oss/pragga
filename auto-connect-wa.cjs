const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('startWhatsAppBot().catch(console.error)')) {
  content = content.replace(
    '  server.listen(PORT, "0.0.0.0", () => {',
    '  // Auto-connect WhatsApp if credentials exist\\n  if (fs.existsSync("/tmp/wa-auth")) {\\n    startWhatsAppBot().catch(console.error);\\n  }\\n\\n  server.listen(PORT, "0.0.0.0", () => {'
  );
  
  // also need to import fs if it's not imported in server.ts
  if (!content.includes("import fs from")) {
    content = content.replace('import express', 'import fs from "fs";\\nimport express');
  }
  
  fs.writeFileSync(file, content);
}
