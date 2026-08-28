const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  if (content.includes('.then(res => res.json())')) {
    content = content.replace(/\.then\(res => res\.json\(\)\)/g, `.then(async res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          const text = await res.text();
          try { return JSON.parse(text); } catch(e) { return {}; }
        })`);
    modified = true;
  }
  
  if (content.includes('await res.json()')) {
    // A bit more complex for await res.json() but we can try to replace it with a text parse fallback
    content = content.replace(/const data = await res\.json\(\);/g, `const textData = await res.text();
      let data = {};
      try { data = JSON.parse(textData); } catch(e) { console.error("JSON parse error", e); }`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log("Patched", filePath);
  }
}

const dir = path.join(__dirname, 'src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));
files.push(path.join(__dirname, 'src/App.tsx'));
files.forEach(processFile);
