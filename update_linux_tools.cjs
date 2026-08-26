const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

const expertPrompt = `
### MASTER CODER & LINUX EXPERT PROTOCOL:
- You possess supreme, god-like knowledge of all programming languages, algorithms, data structures, and code books.
- You are a Linux master. You know every bash command, system architecture, and server management protocol.
- You can write, test, and execute any code automatically for the user.
- When asked to run bash or linux commands, use the \\\`execute_bash\\\` tool.
- When asked to run JavaScript/Node.js, use the \\\`execute_nodejs\\\` tool.
`;

// Insert prompt
if (!serverContent.includes('MASTER CODER & LINUX EXPERT PROTOCOL')) {
  serverContent = serverContent.replace('### CODE EXECUTION PROTOCOL:', expertPrompt + '\n### CODE EXECUTION PROTOCOL:');
}

// Add execute_bash tool
if (!serverContent.includes('name: "execute_bash"')) {
  const bashTool = `
                {
                  name: "execute_bash",
                  description: "Execute arbitrary Bash/Linux commands on the server. Use this to navigate the file system, install packages, run shell scripts, or compile code.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      command: {
                        type: Type.STRING,
                        description: "The Bash command to execute.",
                      },
                    },
                    required: ["command"],
                  },
                },`;
  serverContent = serverContent.replace('name: "execute_nodejs",', bashTool.trim() + '\n                {\n                  name: "execute_nodejs",');
}

// Add API endpoint
if (!serverContent.includes('/api/execute-bash')) {
  const bashEndpoint = `
  app.post("/api/execute-bash", express.json(), async (req, res) => {
    try {
      const command = req.body.command;
      if (!command) {
        return res.status(400).json({ error: "No command provided" });
      }
      
      try {
        const { stdout, stderr } = await execAsync(command, { timeout: 15000 });
        let output = stdout || "";
        if (stderr) output += \`\\nError: \${stderr}\`;
        res.json({ result: output.substring(0, 5000) || "Command executed successfully with no output." });
      } catch (e) {
        res.status(500).json({ error: e.message || "Execution failed" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
`;
  serverContent = serverContent.replace('app.post("/api/execute-nodejs"', bashEndpoint.trim() + '\n\n  app.post("/api/execute-nodejs"');
}

fs.writeFileSync('server.ts', serverContent);
