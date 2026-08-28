const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// Remove import
content = content.replace("import { LinuxTerminal } from './components/LinuxTerminal';\n", "");

// Remove states
content = content.replace("  const [showLinuxTerminal, setShowLinuxTerminal] = useState<boolean>(false);\n  const [linuxCommand, setLinuxCommand] = useState<string>('');\n  const [linuxOutput, setLinuxOutput] = useState<string>('');\n", "");

// Remove handleToolCall part where it opens LinuxTerminal
// Actually, let's just find the linux block in handleToolCall and neutralize it.
// It seems there's a tool call to Linux. Let's see what the tool is called.
