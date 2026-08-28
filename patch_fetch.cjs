const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/WhatsAppModal.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `const data = await res.json();`,
  `if (!res.ok) throw new Error("HTTP error " + res.status);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON: " + text);
      }`
);

content = content.replace(
  `interval = setInterval(fetchStatus, 3000);`,
  `interval = setInterval(fetchStatus, 10000);`
);

content = content.replace(
  /\.then\(res => res\.json\(\)\)/g,
  `.then(async res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch(e) {
            return {};
          }
        })`
);

fs.writeFileSync(file, content);
console.log("WhatsAppModal patched.");
