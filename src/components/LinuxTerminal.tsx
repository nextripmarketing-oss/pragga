import React, { useState, useRef, useEffect } from 'react';
import { TerminalSquare, Play, CheckCircle2, AlertCircle, Copy, Check, Trash2, Server } from 'lucide-react';
import { motion } from 'motion/react';

interface LinuxTerminalProps {
  isOpen: boolean;
  onClose?: () => void;
  command?: string;
  setCommand?: (code: string) => void;
  output?: string;
  setOutput?: (output: string) => void;
}

export const LinuxTerminal: React.FC<LinuxTerminalProps> = ({ isOpen, command: externalCommand, setCommand: setExternalCommand, output: externalOutput, setOutput: setExternalOutput, onClose }) => {
  const [internalCommand, setInternalCommand] = useState<string>('ls -la && pwd');
  
  const command = externalCommand !== undefined ? externalCommand : internalCommand;
  const handleSetCommand = (val: string) => { if (setExternalCommand) setExternalCommand(val); else setInternalCommand(val); };

  const [internalOutput, setInternalOutput] = useState<string>('Pragna OS (Linux kernel 6.1) - ROOT ACCESS GRANTED.\nType your bash commands below and click RUN, or ask Pragna in voice.');
  
  const output = externalOutput !== undefined && externalOutput !== '' ? externalOutput : internalOutput;
  const handleSetOutput = (val: string) => { if (setExternalOutput) setExternalOutput(val); else setInternalOutput(val); };

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  if (!isOpen) return null;

  const handleRun = async () => {
    if (!command.trim()) return;
    
    setIsRunning(true);
    setIsSuccess(null);
    handleSetOutput(prev => prev + `\n\nroot@pragna-os:~# ${command}\n> Executing...`);
    
    try {
      const res = await fetch('/api/execute-bash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await res.json();
      
      if (res.ok) {
        handleSetOutput(prev => prev.replace('> Executing...', data.result || 'Success.'));
        setIsSuccess(true);
      } else {
        handleSetOutput(prev => prev.replace('> Executing...', `Bash Error:\n${data.error || 'Unknown runtime error'}`));
        setIsSuccess(false);
      }
    } catch (e: any) {
      handleSetOutput(prev => prev.replace('> Executing...', `Network/Server Error: ${e?.message || e}`));
      setIsSuccess(false);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full border-t border-green-500/40 bg-black/95 text-green-400 font-mono p-4 z-20 flex flex-col gap-3 relative shadow-[0_-10px_30px_rgba(34,197,94,0.15)]">
      <div className="flex items-center justify-between border-b border-green-500/30 pb-2">
        <div className="flex items-center gap-2">
          <TerminalSquare className="w-4 h-4 text-green-400" />
          <span className="text-xs font-bold tracking-widest text-green-300 uppercase">
            ROOT BASH TERMINAL // LINUX_ENVIRONMENT
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
            title="Copy Command"
          >
            {copied ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'COPIED' : 'COPY'}</span>
          </button>
          <button
            onClick={() => handleSetOutput('Pragna OS (Linux kernel 6.1) - ROOT ACCESS GRANTED.')}
            className="px-2 py-1 text-[10px] bg-green-950/60 border border-green-500/40 hover:bg-red-950/80 text-green-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">CLEAR LOGS</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 min-h-[200px] max-h-[300px]">
        {/* Live Execution Output */}
        <div className="relative flex-1 flex flex-col border border-green-500/30 bg-black/90 min-h-0">
          <div className="bg-green-950/40 px-2 py-1 text-[9px] text-green-600 border-b border-green-500/20 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5">
              <span>&gt; BASH_STDOUT // CONSOLE</span>
              {isSuccess === true && <CheckCircle2 className="w-3 h-3 text-green-400" />}
              {isSuccess === false && <AlertCircle className="w-3 h-3 text-red-400" />}
            </span>
            <span className="text-[8px] text-green-700">USER: ROOT</span>
          </div>
          <pre 
            ref={outputRef}
            className="w-full h-full bg-transparent p-3 text-[11px] text-green-400/90 font-mono overflow-y-auto whitespace-pre-wrap selection:bg-green-500/30"
          >
            {output}
          </pre>
        </div>

        {/* Command Input Area */}
        <div className="relative flex flex-col border border-green-500/30 bg-black/90 shrink-0">
          <div className="flex items-center bg-green-950/20 px-2">
            <span className="text-green-500 text-xs mr-2 font-bold select-none">root@pragna:~#</span>
            <input
              type="text"
              value={command}
              onChange={(e) => handleSetCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRun();
              }}
              placeholder="Enter bash command (e.g. ls -la, uname -a, npm install...)"
              className="w-full bg-transparent py-2 text-xs text-green-300 font-mono focus:outline-none selection:bg-green-500/30"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              onClick={handleRun}
              disabled={isRunning || !command.trim()}
              className="ml-2 px-4 py-1 text-xs font-bold bg-green-500 hover:bg-green-400 text-black border border-green-400 flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(34,197,94,0.4)] disabled:opacity-50 shrink-0"
            >
              {isRunning ? <Server className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5 fill-black" />}
              <span className="hidden sm:inline">{isRunning ? 'RUNNING...' : 'EXECUTE'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
