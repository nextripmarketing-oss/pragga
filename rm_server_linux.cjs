const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/- When asked to run bash or linux commands, use the `execute_bash` tool\./g, "");

content = content.replace(/\{\s*name: "execute_bash",[\s\S]*?required: \["command"\],\s*\},\s*\},/g, "");

content = content.replace(/  app\.post\("\/api\/execute-bash", express\.json\(\), async \(req, res\) => \{[\s\S]*?res\.json\(\{ error: e\.message \}\);\n    \}\n  \}\);/g, "");

fs.writeFileSync(file, content);
