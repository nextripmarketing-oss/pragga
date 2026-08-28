const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove import
content = content.replace(/import \{ LinuxTerminal \} from '\.\/components\/LinuxTerminal';\n/g, "");

// 2. Remove state
content = content.replace(/  const \[showLinuxTerminal, setShowLinuxTerminal\] = useState<boolean>\(false\);\n  const \[linuxCommand, setLinuxCommand\] = useState<string>\(''\);\n  const \[linuxOutput, setLinuxOutput\] = useState<string>\(''\);\n/g, "");

// 3. Remove from UI
content = content.replace(/<div className='flex flex-col'>\s*<span className='text-\[10px\] uppercase tracking-widest text-green-700'>লিনাক্স \(Linux\)<\/span>\s*<button\s*onClick=\{[\s\S]*?BASH ROOT'\}<\/span>\s*<\/button>\s*<\/div>/g, "");

content = content.replace(/                if \(!showIDE\) setShowLinuxTerminal\(false\);\n/g, "");
content = content.replace(/                setShowLinuxTerminal\(true\);\n/g, "");
content = content.replace(/                if \(!showLinuxTerminal\) setShowIDE\(false\);\n/g, "");

// 4. Remove component render
content = content.replace(/      <LinuxTerminal[\s\S]*?setOutput=\{setLinuxOutput\}\n      \/>\n/g, "");

// 5. Remove execute_bash block
content = content.replace(/\} else if \(call\.name === "execute_bash"[\s\S]*?response: \{ result: \`Execution error: \$\{e\.message\}\` \}\n                  \}\);\n                \}/g, "");


fs.writeFileSync(file, content);
