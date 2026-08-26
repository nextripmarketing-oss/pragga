import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive } from 'lucide-react';

interface SystemMonitorProps {
  status: 'idle' | 'connecting' | 'connected' | 'error';
  isGlitching?: boolean;
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({ status, isGlitching }) => {
  const [cpu, setCpu] = useState(12);
  const [mem, setMem] = useState(1400);

  useEffect(() => {
    const interval = setInterval(() => {
      let targetCpu = 12;
      let targetMem = 1400;

      if (isGlitching) {
        targetCpu = 95 + Math.random() * 4;
        targetMem = 7800 + Math.random() * 400;
      } else if (status === 'connected') {
        targetCpu = 30 + Math.random() * 60; // Fluctuates heavily when active
        targetMem = 4800 + Math.random() * 1200;
      } else if (status === 'connecting') {
        targetCpu = 40 + Math.random() * 20;
        targetMem = 2500 + Math.random() * 500;
      } else if (status === 'error') {
        targetCpu = 2 + Math.random() * 5;
        targetMem = 1200 + Math.random() * 100;
      } else {
        // Idle
        targetCpu = 8 + Math.random() * 15;
        targetMem = 1300 + Math.random() * 200;
      }

      setCpu(prev => {
        const diff = targetCpu - prev;
        return prev + (diff * 0.4);
      });
      
      setMem(prev => {
        const diff = targetMem - prev;
        return prev + (diff * 0.4);
      });

    }, 400);

    return () => clearInterval(interval);
  }, [status, isGlitching]);

  return (
    <div className="flex flex-col min-w-[120px] font-mono select-none">
      <span className="text-[10px] uppercase tracking-widest text-green-700 flex items-center gap-1">
        <Activity className="w-2.5 h-2.5" />
        Neural Load
      </span>
      <div className="flex flex-col gap-0.5 mt-0.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-600 flex items-center gap-1"><Cpu className="w-2.5 h-2.5"/> CPU</span>
          <span className={`font-bold ${cpu > 85 ? 'text-red-500' : cpu > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
            {cpu.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-1 bg-green-950">
          <div 
            className={`h-full transition-all duration-300 ${cpu > 85 ? 'bg-red-500' : cpu > 60 ? 'bg-yellow-400' : 'bg-green-500'}`} 
            style={{ width: `${Math.min(100, Math.max(0, cpu))}%` }} 
          />
        </div>
        
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-green-600 flex items-center gap-1"><HardDrive className="w-2.5 h-2.5"/> MEM</span>
          <span className={`font-bold ${mem > 7000 ? 'text-red-500' : mem > 5000 ? 'text-yellow-400' : 'text-green-400'}`}>
            {(mem / 1024).toFixed(2)}GB
          </span>
        </div>
        <div className="w-full h-1 bg-green-950">
          <div 
            className={`h-full transition-all duration-300 ${mem > 7000 ? 'bg-red-500' : mem > 5000 ? 'bg-yellow-400' : 'bg-green-500'}`} 
            style={{ width: `${Math.min(100, Math.max(0, (mem / 8192) * 100))}%` }} 
          />
        </div>
      </div>
    </div>
  );
};
