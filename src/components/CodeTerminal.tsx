import React, { useState } from 'react';
import { Terminal, Play, CheckCircle2, AlertCircle, Copy, Check, Trash2, Code2, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface CodeTerminalProps {
  isOpen: boolean;
  onClose?: () => void;
  code?: string;
  setCode?: (code: string) => void;
  output?: string;
  setOutput?: (output: string) => void;
}

export const CodeTerminal: React.FC<CodeTerminalProps> = ({ isOpen, code: externalCode, setCode: setExternalCode, output: externalOutput, setOutput: setExternalOutput, onClose }) => {
  const [internalCode, setInternalCode] = useState<string>(
    `// Write or test JavaScript/Node.js script\nconst data = [10, 20, 30, 40, 50];\nconst sum = data.reduce((acc, curr) => acc + curr, 0);\nconsole.log("Calculated Sum:", sum);\nconsole.log("Memory Array Buffer:", new Uint8Array(data));\n`
  );
  
  const code = externalCode !== undefined ? externalCode : internalCode;
  const handleSetCode = (val: string) => { if (setExternalCode) setExternalCode(val); else setInternalCode(val); };

  const [internalOutput, setInternalOutput] = useState<string>('Terminal Ready. Press [RUN CODE] or ask Pragna in voice to execute scripts.');
  
  const output = externalOutput !== undefined && externalOutput !== '' ? externalOutput : internalOutput;
  const handleSetOutput = (val: string) => { if (setExternalOutput) setExternalOutput(val); else setInternalOutput(val); };

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setIsSuccess(null);
    handleSetOutput('>> Executing script in sandbox Node.js runtime...');
    
    try {
      const res = await fetch('/api/execute-nodejs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const textData = await res.text();
      let data = {};
      try { data = JSON.parse(textData); } catch(e) { console.error("JSON parse error", e); }
      
      if (res.ok) {
        handleSetOutput(data.result || 'Executed successfully with no stdout.');
        setIsSuccess(true);
      } else {
        handleSetOutput(`Execution Error:\n${data.error || 'Unknown runtime error'}`);
        setIsSuccess(false);
      }
    } catch (e: any) {
      handleSetOutput(`Network/Server Error: ${e?.message || e}`);
      setIsSuccess(false);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full border-t border-green-500/40 bg-black/95 text-green-400 font-mono p-4 z-20 flex flex-col gap-3 relative">
      <div className="flex items-center justify-between border-b border-green-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-xs font-bold tracking-widest text-green-300 uppercase">
            LIVE NODE.JS INTERACTIVE COMPILER // IDE
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {onClose && (
            <button onClick={onClose} className="px-2 py-1 text-[10px] text-green-500 hover:text-green-300 flex items-center mr-2 border border-green-500/40 bg-green-950/60 transition-colors">
              X
            </button>
          )}
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-[10px] bg-green-950/60 border border-green-500/40 hover:bg-green-900/60 text-green-400 flex items-center gap-1 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
          <button
            onClick={() => handleSetCode('')}
            className="px-2 py-1 text-[10px] bg-green-950/60 border border-green-500/40 hover:bg-red-950/80 text-green-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            title="Clear Code"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            className="px-3 py-1 text-xs font-bold bg-green-500 hover:bg-green-400 text-black border border-green-400 flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(34,197,94,0.4)] disabled:opacity-50"
          >
            {isRunning ? <Cpu className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-black" />}
            <span>{isRunning ? 'EXECUTING...' : 'RUN CODE'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[140px] max-h-[220px]">
        {/* Code Input */}
        <div className="relative flex flex-col border border-green-500/30 bg-black/90">
          <div className="bg-green-950/40 px-2 py-1 text-[9px] text-green-600 border-b border-green-500/20 flex justify-between">
            <span>&gt; SOURCE_EDITOR (JAVASCRIPT / NODE.JS)</span>
            <Code2 className="w-3 h-3 text-green-500" />
          </div>
          <textarea
            value={code}
            onChange={(e) => handleSetCode(e.target.value)}
            placeholder="// Type your Node.js script here..."
            className="w-full h-full bg-transparent p-2 text-xs text-green-300 font-mono focus:outline-none resize-none selection:bg-green-500/30"
            spellCheck={false}
          />
        </div>

        {/* Live Execution Output */}
        <div className="relative flex flex-col border border-green-500/30 bg-black/90">
          <div className="bg-green-950/40 px-2 py-1 text-[9px] text-green-600 border-b border-green-500/20 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>&gt; STDOUT // RUNTIME_OUTPUT</span>
              {isSuccess === true && <CheckCircle2 className="w-3 h-3 text-green-400" />}
              {isSuccess === false && <AlertCircle className="w-3 h-3 text-red-400" />}
            </span>
            <span className="text-[8px] text-green-700">SANDBOX: ISOLATED</span>
          </div>
          <pre className="w-full h-full bg-transparent p-2 text-xs text-green-400/90 font-mono overflow-y-auto whitespace-pre-wrap selection:bg-green-500/30">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
};
