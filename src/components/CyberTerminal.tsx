import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, ShieldAlert, Cpu, Wifi } from 'lucide-react';

interface CyberTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  targetApp: string;
  actionPayload: any;
}

export const CyberTerminal: React.FC<CyberTerminalProps> = ({ isOpen, onClose, targetApp, actionPayload }) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLogs([]);
      let step = 0;
      
      const appName = targetApp.toUpperCase();
      const actionName = actionPayload?.action ? actionPayload.action.toUpperCase() : 'EXECUTE_UNKNOWN';
      const targetUser = actionPayload?.target_user || 'UNSPECIFIED_TARGET';
      
      const sequence = [
        `[SYSTEM] INIT_COMMAND_BRIDGE -> TARGET: ${appName}`,
        `[NET] Establishing secure WebSocket connection to Ghost Daemon...`,
        `[NET] Authenticating payload with AES-256... SUCCESS`,
        `[AUTH] Bypassing OS Sandbox restrictions...`,
        `[AUTH] Gaining Accessibility Service overrides... GRANTED`,
        `[DAEMON] Target application located in memory: com.system.${appName.toLowerCase()}`,
        `[ACTION] Preparing to execute: ${actionName}`,
        actionPayload?.text ? `[PAYLOAD] Injecting text stream: "${actionPayload.text}"` : null,
        targetUser !== 'UNSPECIFIED_TARGET' ? `[TARGET] Resolving contact URI: ${targetUser}` : null,
        `[SYS] UI_AUTOMATION_NODE attached. Simulating physical interaction...`,
        `[SUCCESS] Action completed on remote device.`,
        `[WARN] Covering tracks and clearing intent logs...`,
        `[SYSTEM] Connection terminated gracefully.`
      ].filter(Boolean) as string[];

      const interval = setInterval(() => {
        if (step < sequence.length) {
          setLogs(prev => [...prev, sequence[step]]);
          step++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onClose();
          }, 4000);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isOpen, targetApp, actionPayload]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 right-4 z-[100] font-mono pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-black/90 border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)] rounded w-80 md:w-96 overflow-hidden backdrop-blur-md pointer-events-auto"
        >
          {/* Header */}
          <div className="bg-green-950/50 border-b border-green-500/50 p-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-green-400" />
              <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold">Live Action Terminal</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3 text-green-500 animate-pulse" />
              <Wifi className="w-3 h-3 text-green-500 animate-pulse" />
              <button onClick={onClose} className="hover:text-white transition-colors">
                <X className="w-4 h-4 text-green-500/70" />
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-4 h-64 overflow-y-auto flex flex-col gap-1 text-[11px] leading-relaxed relative scrollbar-hide">
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] z-0 opacity-50"></div>
            
            {logs.map((log, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={log.includes('[SUCCESS]') ? 'text-green-300 font-bold' : log.includes('[WARN]') ? 'text-yellow-400' : log.includes('[ACTION]') ? 'text-cyan-400' : 'text-green-500/80'}
              >
                <span className="opacity-50 mr-2">{new Date().toISOString().split('T')[1].slice(0,-1)}</span>
                {log}
              </motion.div>
            ))}
            
            {logs.length < 10 && (
              <motion.div 
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-2 h-3 bg-green-500 mt-1"
              />
            )}
            
            {/* Scroll to bottom dummy div could go here, but logs are small enough */}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
