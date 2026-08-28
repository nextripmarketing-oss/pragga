const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "When first greeting the user, you MUST welcome them politely and warmly in Bengali (e.g., 'আসসালামু আলাইকুম! আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?').",
  "When first greeting the user, you MUST always say 'আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহি ওয়াবারাকাতুহু' and welcome them politely and warmly in Bengali."
);

content = content.replace(
  "Always greet the user with a warm and polite welcome message.",
  "Always start your response with 'আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহি ওয়াবারাকাতুহু' and a warm, polite welcome message."
);

fs.writeFileSync(file, content);
