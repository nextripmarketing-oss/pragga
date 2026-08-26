const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(/\{\s*\{\s*name: "execute_bash"/, '{\n                  name: "execute_bash"');

fs.writeFileSync('server.ts', serverContent);
