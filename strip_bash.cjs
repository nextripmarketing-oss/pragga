const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /\} else if \(call\.name === "execute_bash"[\s\S]*?response: \{ error: e\.message \}\n\s+\}\);\n\s+\}/g;
content = content.replace(regex, "");

fs.writeFileSync(file, content);
