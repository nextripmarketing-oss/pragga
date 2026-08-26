const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Import LinuxTerminal
if (!appContent.includes('LinuxTerminal')) {
  appContent = appContent.replace("import { CodeTerminal } from './components/CodeTerminal';", "import { CodeTerminal } from './components/CodeTerminal';\nimport { LinuxTerminal } from './components/LinuxTerminal';");
}

// Add state variables
if (!appContent.includes('showLinuxTerminal')) {
  const stateRegex = /const \[showIDE, setShowIDE\] = useState<boolean>\(false\);/;
  appContent = appContent.replace(stateRegex, 
    "const [showIDE, setShowIDE] = useState<boolean>(false);\n" +
    "  const [showLinuxTerminal, setShowLinuxTerminal] = useState<boolean>(false);\n" +
    "  const [linuxCommand, setLinuxCommand] = useState<string>('');\n" +
    "  const [linuxOutput, setLinuxOutput] = useState<string>('');\n"
  );
}

// Add execute_bash handler
const bashRegex = /} else if \(call\.name === "execute_bash"/;
if (!bashRegex.test(appContent)) {
  const executeNodejsRegex = /} else if \(call\.name === "execute_nodejs" && call\.args && call\.args\.code\) {/;
  
  const newHandler = `} else if (call.name === "execute_bash" && call.args && call.args.command) {
                setHistory(prev => [...prev, { role: 'model', text: \`[System]: Executing Bash command...\` }]);
                setLinuxCommand(call.args.command);
                setShowIDE(false); // Close other IDE
                setShowLinuxTerminal(true);
                setLinuxOutput(\`Pragna OS (Linux kernel 6.1) - ROOT ACCESS GRANTED.\\n\\nroot@pragna-os:~# \${call.args.command}\\n> Executing...\`);
                try {
                  const res = await fetch('/api/execute-bash', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: call.args.command })
                  });
                  const data = await res.json();
                  const resultText = data.result || data.error || "No response";
                  
                  // Display output in history for the user
                  setHistory(prev => [...prev, { role: 'model', text: \`[Bash Output]:\\n\${resultText}\` }]);
                  setLinuxOutput(prev => prev.replace('> Executing...', resultText));
                  
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: resultText }
                  });
                } catch (e: any) {
                  setHistory(prev => [...prev, { role: 'model', text: \`[Bash Error]: Failed to execute - \${e.message}\` }]);
                  setLinuxOutput(prev => prev.replace('> Executing...', \`Execution error: \${e.message}\`));
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: \`Execution error: \${e.message}\` }
                  });
                }
              } else if (call.name === "execute_nodejs" && call.args && call.args.code) {`;
              
  appContent = appContent.replace(executeNodejsRegex, newHandler);
}

// Add toggle button for Linux Terminal
if (!appContent.includes('BASH ROOT')) {
  const codeIdeRegex = /<div className='flex flex-col'>\s*<span className='text-\[10px\] uppercase tracking-widest text-green-700'>কোড টার্মিনাল \(IDE\)<\/span>[\s\S]*?<\/div>/;
  
  const bashToggle = `
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>লিনাক্স (Linux)</span> 
            <button 
              onClick={() => {
                setShowLinuxTerminal(prev => !prev);
                if (!showLinuxTerminal) setShowIDE(false);
              }}
              className={\`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 \${
                showLinuxTerminal 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }\`}
            >
              <Terminal className="w-3 h-3" />
              <span>{showLinuxTerminal ? 'BASH ACTIVE' : 'BASH ROOT'}</span>
            </button> 
          </div> 
`;
  appContent = appContent.replace(codeIdeRegex, match => match + '\n' + bashToggle);
}

// Add LinuxTerminal component in JSX
if (!appContent.includes('<LinuxTerminal')) {
  const codeTerminalJsxRegex = /<CodeTerminal\s+isOpen={showIDE}[\s\S]*?\/>/;
  
  const linuxTerminalJsx = `
      <LinuxTerminal
        isOpen={showLinuxTerminal}
        onClose={() => setShowLinuxTerminal(false)}
        command={linuxCommand}
        setCommand={setLinuxCommand}
        output={linuxOutput}
        setOutput={setLinuxOutput}
      />
`;
  appContent = appContent.replace(codeTerminalJsxRegex, match => match + '\n' + linuxTerminalJsx);
}

// Fix toggle for IDE to also close Linux terminal
if (!appContent.includes('if (!showIDE) setShowLinuxTerminal(false)')) {
  appContent = appContent.replace(/onClick=\{\(\) => setShowIDE\(prev => !prev\)\}/g, "onClick={() => {\n                setShowIDE(prev => !prev);\n                if (!showIDE) setShowLinuxTerminal(false);\n              }}");
}


fs.writeFileSync('src/App.tsx', appContent);
