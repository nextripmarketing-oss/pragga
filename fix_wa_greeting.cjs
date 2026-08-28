const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "Always start with a warm welcome if it's a new conversation.",
  "You MUST always start your response with 'আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহি ওয়াবারাকাতুহু' and a warm welcome."
);

fs.writeFileSync(file, content);
