const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Add ideCode and ideOutput state to App.tsx
if (!appContent.includes('ideCode')) {
  const stateRegex = /const \[showIDE, setShowIDE\] = useState<boolean>\(false\);/;
  appContent = appContent.replace(stateRegex, 
    "const [showIDE, setShowIDE] = useState<boolean>(false);\n" +
    "  const [ideCode, setIdeCode] = useState<string>('');\n" +
    "  const [ideOutput, setIdeOutput] = useState<string>('');\n"
  );
}

// Modify the execute_nodejs handler to update ideCode and ideOutput and open IDE
const executeNodejsRegex = /} else if \(call\.name === "execute_nodejs" && call\.args && call\.args\.code\) {[\s\S]*?catch \(e: any\) {[\s\S]*?}/;
if (executeNodejsRegex.test(appContent)) {
  const newHandler = `} else if (call.name === "execute_nodejs" && call.args && call.args.code) {
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
                }`;
  appContent = appContent.replace(executeNodejsRegex, newHandler);
}

// Modify CodeTerminal prop passing
const codeTerminalRegex = /<CodeTerminal\s+isOpen={showIDE}\s+onClose={\(\) => setShowIDE\(false\)}\s+\/>/;
if (codeTerminalRegex.test(appContent)) {
  const newCodeTerminal = `<CodeTerminal
        isOpen={showIDE}
        onClose={() => setShowIDE(false)}
        code={ideCode}
        setCode={setIdeCode}
        output={ideOutput}
        setOutput={setIdeOutput}
      />`;
  appContent = appContent.replace(codeTerminalRegex, newCodeTerminal);
}

fs.writeFileSync('src/App.tsx', appContent);

let terminalContent = fs.readFileSync('src/components/CodeTerminal.tsx', 'utf8');

// Update CodeTerminal.tsx interfaces and props
if (!terminalContent.includes('code?: string')) {
  terminalContent = terminalContent.replace(
    /interface CodeTerminalProps {[\s\S]*?}/,
    `interface CodeTerminalProps {
  isOpen: boolean;
  onClose?: () => void;
  code?: string;
  setCode?: (code: string) => void;
  output?: string;
  setOutput?: (output: string) => void;
}`
  );

  terminalContent = terminalContent.replace(
    /export const CodeTerminal: React\.FC<CodeTerminalProps> = \({ isOpen }\) => {/,
    `export const CodeTerminal: React.FC<CodeTerminalProps> = ({ isOpen, code: externalCode, setCode: setExternalCode, output: externalOutput, setOutput: setExternalOutput, onClose }) => {`
  );

  terminalContent = terminalContent.replace(
    /const \[code, setCode\] = useState<string>\([\s\S]*?\);/,
    `const [internalCode, setInternalCode] = useState<string>(
    \`// Write or test JavaScript/Node.js script\\nconst data = [10, 20, 30, 40, 50];\\nconst sum = data.reduce((acc, curr) => acc + curr, 0);\\nconsole.log("Calculated Sum:", sum);\\nconsole.log("Memory Array Buffer:", new Uint8Array(data));\\n\`
  );
  const code = externalCode !== undefined ? externalCode : internalCode;
  const handleSetCode = (val: string) => { if (setExternalCode) setExternalCode(val); else setInternalCode(val); };`
  );

  terminalContent = terminalContent.replace(
    /const \[output, setOutput\] = useState<string>\('Terminal Ready\. Press \[RUN CODE\] or ask Pragna in voice to execute scripts\.'\);/,
    `const [internalOutput, setInternalOutput] = useState<string>('Terminal Ready. Press [RUN CODE] or ask Pragna in voice to execute scripts.');
  const output = externalOutput !== undefined && externalOutput !== '' ? externalOutput : internalOutput;
  const handleSetOutput = (val: string) => { if (setExternalOutput) setExternalOutput(val); else setInternalOutput(val); };`
  );

  // Replace setCode( with handleSetCode( and setOutput( with handleSetOutput(
  terminalContent = terminalContent.replace(/setCode\(/g, 'handleSetCode(');
  terminalContent = terminalContent.replace(/setOutput\(/g, 'handleSetOutput(');
  
  // Close button
  terminalContent = terminalContent.replace(
    /LIVE NODE\.JS INTERACTIVE COMPILER \/\/ IDE\s*<\/span>\s*<\/div>/,
    `LIVE NODE.JS INTERACTIVE COMPILER // IDE
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="absolute top-2 right-4 text-green-500 hover:text-green-300">
            X
          </button>
        )}`
  );

  fs.writeFileSync('src/components/CodeTerminal.tsx', terminalContent);
}
