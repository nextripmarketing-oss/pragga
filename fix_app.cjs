const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Find the execute_nodejs block exactly
const startIdx = appContent.indexOf('} else if (call.name === "execute_nodejs"');
if (startIdx !== -1) {
  // We need to find the end of this block. The next block is `} else if (call.name === "search_nextrip_db"`
  const endIdx = appContent.indexOf('} else if (call.name === "search_nextrip_db"');
  if (endIdx !== -1) {
    const newBlock = `} else if (call.name === "execute_nodejs" && call.args && call.args.code) {
                setHistory(prev => [...prev, { role: 'model', text: \`[System]: Executing Node.js code...\` }]);
                setIdeCode(call.args.code);
                setShowIDE(true);
                setIdeOutput("Executing...");
                try {
                  const res = await fetch('/api/execute-nodejs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: call.args.code })
                  });
                  const data = await res.json();
                  const resultText = data.result || data.error || "No response";
                  
                  // Display output in history for the user
                  setHistory(prev => [...prev, { role: 'model', text: \`[Console Output]:\\n\${resultText}\` }]);
                  setIdeOutput(resultText);
                  
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: resultText }
                  });
                } catch (e: any) {
                  setHistory(prev => [...prev, { role: 'model', text: \`[Console Error]: Failed to execute - \${e.message}\` }]);
                  setIdeOutput(\`Execution error: \${e.message}\`);
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: \`Execution error: \${e.message}\` }
                  });
                }
              `;
    
    appContent = appContent.substring(0, startIdx) + newBlock + appContent.substring(endIdx);
    fs.writeFileSync('src/App.tsx', appContent);
  }
}
