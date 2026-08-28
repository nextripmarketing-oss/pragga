const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

// just inject startWhatsAppBot before listen
content = content.replace(
  '  server.listen(PORT, "0.0.0.0", () => {',
  '  startWhatsAppBot().catch(console.error);\n  server.listen(PORT, "0.0.0.0", () => {'
);

fs.writeFileSync(file, content);
