import React, { useState, useRef, useEffect } from 'react';
import { MicOff, Activity, Loader2, Tv, Radio, Film, ShieldAlert, Terminal, Code, Database } from 'lucide-react';
import { pcmToBase64, AudioPlayer } from './lib/audio';
import { motion } from 'motion/react';
import { Avatar3D } from './components/Avatar3D';
import { MatrixRain } from './components/MatrixRain';
import { VideoModal } from './components/VideoModal';
import { CodeTerminal } from './components/CodeTerminal';
import { LinuxTerminal } from './components/LinuxTerminal';
import { NextTripModal } from './components/NextTripModal';
import { searchNextTripDatabase } from './lib/nextripDb';
import { SystemMonitor } from './components/SystemMonitor';
import { WhatsAppModal } from './components/WhatsAppModal';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { CyberTerminal } from './components/CyberTerminal';
import { MessageSquare, BrainCircuit } from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [showIDE, setShowIDE] = useState<boolean>(false);
  const [showLinuxTerminal, setShowLinuxTerminal] = useState<boolean>(false);
  const [linuxCommand, setLinuxCommand] = useState<string>('');
  const [linuxOutput, setLinuxOutput] = useState<string>('');

  const [ideCode, setIdeCode] = useState<string>('');
  const [ideOutput, setIdeOutput] = useState<string>('');

  const [showNextTripDb, setShowNextTripDb] = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState<boolean>(false);
  const [marketingMode, setMarketingMode] = useState<boolean>(false);
  const [terminalState, setTerminalState] = useState<{ isOpen: boolean, app: string, payload: any }>({ isOpen: false, app: '', payload: {} });
  const [nextTripSearchQuery, setNextTripSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string>('');
  const [userText, setUserText] = useState<string>('');
  const [videoState, setVideoState] = useState<{
    isOpen: boolean;
    query: string;
    title: string;
    videoUrl?: string;
  }>({
    isOpen: false,
    query: '',
    title: '',
    videoUrl: '',
  });
  const [history, setHistory] = useState<{role: 'user'|'model', text: string}[]>(() => {
    try {
      const saved = localStorage.getItem('pragna_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('pragna_userName') || '';
  });
  const [facts, setFacts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pragna_facts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [systemContext, setSystemContext] = useState<string>(() => {
    return localStorage.getItem('pragna_system_context') || '';
  });
  
  
  useEffect(() => {
    fetch('/api/settings/marketing-mode')
      .then(res => res.json())
      .then(data => setMarketingMode(data.enabled))
      .catch(console.error);
  }, []);

  const toggleMarketingMode = async () => {
    const newValue = !marketingMode;
    setMarketingMode(newValue);
    try {
      await fetch('/api/settings/marketing-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue })
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    localStorage.setItem('pragna_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('pragna_userName', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('pragna_facts', JSON.stringify(facts));
  }, [facts]);
  
  useEffect(() => {
    localStorage.setItem('pragna_system_context', systemContext);
  }, [systemContext]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const speakingTimeoutRef = useRef<any>(null);
  const currentTurnRef = useRef({ userText: '', aiText: '' });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const glitchTimeoutRef = useRef<any>(null);

  const triggerGlitch = (duration = 400) => {
    setIsGlitching(true);
    if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    glitchTimeoutRef.current = setTimeout(() => setIsGlitching(false), duration);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiText, userText, history]);

  // Random minor glitch when AI speaks
  useEffect(() => {
    if (aiSpeaking && status === 'connected') {
      const interval = setInterval(() => {
        if (Math.random() > 0.8) {
          triggerGlitch(150);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [aiSpeaking, status]);

  const startSession = async () => {
    try {
      setStatus('connecting');
      setErrorMessage(null);
      setAiText('');
      setUserText('');
      currentTurnRef.current = { userText: '', aiText: '' };
      
      // Initialize Web Audio contexts synchronously on click to satisfy browser policies
      inputCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      playerRef.current = new AudioPlayer();
      
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e: any) {
        console.warn("Failed to get audio", e?.message || e);
        throw e;
      }
      mediaStreamRef.current = stream;
      
      const source = inputCtxRef.current.createMediaStreamSource(stream);
      processorRef.current = inputCtxRef.current.createScriptProcessor(4096, 1, 1);
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = new URL(`${protocol}//${window.location.host}/live`);
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'init',
          name: userName.trim(),
          facts: facts,
          context: systemContext.trim()
        }));
        source.connect(processorRef.current!);
        processorRef.current!.connect(inputCtxRef.current!.destination);
        setStatus('connected');
        triggerGlitch(600); // Big glitch on connect
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          playerRef.current?.playChunk(msg.audio);
          setAiSpeaking(true);
          if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
          speakingTimeoutRef.current = setTimeout(() => setAiSpeaking(false), 500);
        }
        if (msg.userText) {
          currentTurnRef.current.userText = msg.userText;
          setUserText(msg.userText);
        }
        if (msg.aiText) {
          currentTurnRef.current.aiText += msg.aiText;
          setAiText(currentTurnRef.current.aiText);
        }
        
        // Handle tool calls
        if (msg.functionCall || msg.toolCall) {
          const calls = msg.toolCall?.functionCalls || (msg.functionCall ? [msg.functionCall] : []);
          triggerGlitch(800); // Major glitch when processing tools
          
          const processToolCalls = async () => {
            const responses: any[] = [];
            
            for (const call of calls) {
              if (call.name === "remember_fact" && call.args && call.args.fact) {
                const newFact = call.args.fact;
                setFacts(prev => {
                  if (!prev.includes(newFact)) {
                    return [...prev, newFact];
                  }
                  return prev;
                });
                
                setHistory(prev => [...prev, { role: 'model', text: `[System Update]: I will remember: "${newFact}"` }]);
                
                responses.push({
                  id: call.id,
                  name: call.name,
                  response: { result: "Fact saved successfully." }
                });
              } else if (call.name === "control_phone" && call.args) {
                const targetApp = call.args.target_app || 'UNKNOWN';
                const action = call.args.action || 'EXECUTE';
                setHistory(prev => [...prev, { role: 'model', text: `[Command Bridge]: Initiating connection to ${targetApp} daemon for action: ${action}` }]);
                
                setTerminalState({
                  isOpen: true,
                  app: targetApp,
                  payload: call.args
                });

                if (targetApp.toLowerCase().includes('whatsapp') && call.args.target_user && call.args.text) {
                  try {
                    const res = await fetch('/api/whatsapp/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ number: call.args.target_user, text: call.args.text })
                    });
                    const data = await res.json();
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: data.result || `Error: ${data.error}` }
                    });
                  } catch (e: any) {
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: `Failed to send real WhatsApp message: ${e.message}` }
                    });
                  }
                } else {
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: "Command successfully queued to external Ghost Daemon on mobile device. Action simulated on HUD." }
                  });
                }
              } else if (call.name === "display_video" && call.args) {
                const vQuery = call.args.query || '';
                const vTitle = call.args.title || vQuery || 'VIDEO_STREAM_HUD';
                const vUrl = call.args.video_url || '';
                
                setVideoState({
                  isOpen: true,
                  query: vQuery,
                  title: vTitle,
                  videoUrl: vUrl,
                });

                setHistory(prev => [...prev, { role: 'model', text: `[HUD Video Feed]: "${vTitle || vQuery}" পর্দায় চালু করা হয়েছে।` }]);

                responses.push({
                  id: call.id,
                  name: call.name,
                  response: { result: "Video popup HUD stream launched successfully on screen." }
                });
              } else if (call.name === "close_video") {
                setVideoState(prev => ({ ...prev, isOpen: false }));
                setHistory(prev => [...prev, { role: 'model', text: `[HUD Video Feed]: ভিডিও ফিড বন্ধ করা হয়েছে।` }]);
                responses.push({
                  id: call.id,
                  name: call.name,
                  response: { result: "Video popup HUD stream closed." }
                });
              } else if (call.name === "search_youtube" && call.args && call.args.query) {
                setHistory(prev => [...prev, { role: 'model', text: `[System]: Searching YouTube for "${call.args.query}"...` }]);
                try {
                  const res = await fetch('/api/yt-search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: call.args.query })
                  });
                  const data = await res.json();
                  const resultText = data.result || data.error || "No response";
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: resultText }
                  });
                } catch (e: any) {
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: `Failed to search YouTube: ${e.message}` }
                  });
                }
              } else if (call.name === "execute_bash" && call.args && call.args.command) {
                setHistory(prev => [...prev, { role: 'model', text: `[System]: Executing Bash command...` }]);
                setLinuxCommand(call.args.command);
                setShowIDE(false); // Close other IDE
                setShowLinuxTerminal(true);
                setLinuxOutput(`Pragna OS (Linux kernel 6.1) - ROOT ACCESS GRANTED.\n\nroot@pragna-os:~# ${call.args.command}\n> Executing...`);
                try {
                  const res = await fetch('/api/execute-bash', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: call.args.command })
                  });
                  const data = await res.json();
                  const resultText = data.result || data.error || "No response";
                  
                  // Display output in history for the user
                  setHistory(prev => [...prev, { role: 'model', text: `[Bash Output]:\n${resultText}` }]);
                  setLinuxOutput(prev => prev.replace('> Executing...', resultText));
                  
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: resultText }
                  });
                } catch (e: any) {
                  setHistory(prev => [...prev, { role: 'model', text: `[Bash Error]: Failed to execute - ${e.message}` }]);
                  setLinuxOutput(prev => prev.replace('> Executing...', `Execution error: ${e.message}`));
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: `Execution error: ${e.message}` }
                  });
                }
              } else if (call.name === "execute_nodejs" && call.args && call.args.code) {
                setHistory(prev => [...prev, { role: 'model', text: `[System]: Executing Node.js code...` }]);
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
                  setHistory(prev => [...prev, { role: 'model', text: `[Console Output]:\n${resultText}` }]);
                  setIdeOutput(resultText);
                  
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: resultText }
                  });
                } catch (e: any) {
                  setHistory(prev => [...prev, { role: 'model', text: `[Console Error]: Failed to execute - ${e.message}` }]);
                  setIdeOutput(`Execution error: ${e.message}`);
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: `Execution error: ${e.message}` }
                  });
                }
              } else if (call.name === "search_nextrip_db" && call.args && call.args.search_term) {
                const sTerm = call.args.search_term;
                setHistory(prev => [...prev, { role: 'model', text: `[NexTrip DB Query]: Searching database for "${sTerm}"...` }]);
                setNextTripSearchQuery(sTerm);
                setShowNextTripDb(true);
                try {
                  const dbResults = await searchNextTripDatabase(sTerm);
                  let summary = "";
                  if (dbResults.length > 0) {
                    summary = `Found ${dbResults.length} matching document(s) in NexTrip database:\n` +
                      dbResults.map((r, i) => `${i+1}. [${r.collection}] ` + JSON.stringify(r.data)).join('\n');
                  } else {
                    summary = `No records matching "${sTerm}" found in NexTrip Firebase Firestore collections.`;
                  }
                  
                  setHistory(prev => [...prev, { role: 'model', text: `[NexTrip DB Decrypted Data]:\n${summary.substring(0, 800)}` }]);
                  
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: summary.substring(0, 1500) }
                  });
                } catch (e: any) {
                  setHistory(prev => [...prev, { role: 'model', text: `[NexTrip DB Error]: ${e.message}` }]);
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: `Database query failed: ${e.message}` }
                  });
                }
              } else if (call.name === "ask_grok" && call.args && call.args.prompt) {
                setHistory(prev => [...prev, { role: 'model', text: `[System]: Grok API-তে তথ্য খোঁজা হচ্ছে...` }]);
                try {
                  const res = await fetch('/api/grok', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: call.args.prompt })
                  });
                  const data = await res.json();
                  const resultText = data.result || data.error || "Unknown response from Grok.";
                  
                  // Explicitly add Grok's data to the visible UI history
                  setHistory(prev => [...prev, { role: 'model', text: `[Grok Data]: ${resultText}` }]);
                  
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: resultText }
                  });
                } catch (e: any) {
                  setHistory(prev => [...prev, { role: 'model', text: `[Grok Data]: Failed to fetch - ${e.message}` }]);
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: `Failed to connect to Grok API: ${e.message}` }
                  });
                }
              }
            }
            
            if (responses.length > 0) {
              ws.send(JSON.stringify({ functionResponse: responses }));
            }
          };

          processToolCalls();
        }
        
        if (msg.turnComplete || msg.interrupted) {
          const { userText: currentUt, aiText: currentAt } = currentTurnRef.current;
          const interruptedStr = msg.interrupted && currentAt ? ' [Interrupted]' : '';
          
          if (currentUt || currentAt) {
            setHistory(prev => {
              const newHistory = [...prev];
              if (currentUt) newHistory.push({ role: 'user', text: currentUt });
              if (currentAt) newHistory.push({ role: 'model', text: currentAt + interruptedStr });
              return newHistory;
            });
          }
          
          currentTurnRef.current = { userText: '', aiText: '' };
          setUserText('');
          setAiText('');
          
          if (msg.interrupted) {
            playerRef.current?.interrupt();
            setAiSpeaking(false);
          }
        }
        if (msg.error) {
          if (typeof msg.error === 'string' && msg.error.includes("Session maximum duration reached")) {
            console.log('Session reached maximum duration. Returning to idle state.');
            stopSession();
            return;
          }
          console.error('Server error:', typeof msg.error === 'object' ? JSON.stringify(msg.error) : msg.error);
          setErrorMessage(typeof msg.error === 'object' ? 'Internal server error occurred.' : msg.error);
          stopSession();
          setStatus('error');
        }
      };

      ws.onclose = (event) => {
        console.warn("WebSocket closed.", event.code, event.reason);
        if (status !== 'error') stopSession();
      };

      ws.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
        setErrorMessage("Network error or connection dropped. If rate-limited, please wait a few seconds and try again.");
        setStatus('error');
      };

      processorRef.current.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

    } catch (err: any) {
      console.error("Failed to start session:", err?.message || err);
      if (err?.message === 'Permission denied' || err?.name === 'NotAllowedError') {
        setErrorMessage("Microphone access was denied. Please allow microphone permissions in your browser or open the app in a new tab (using the 'Open in New Tab' button in the top right) to grant access.");
      } else {
        setErrorMessage(`Microphone access error: ${err?.message || "Unavailable."}`);
      }
      setStatus('error');
    }
  };

  const stopSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current && inputCtxRef.current) {
      processorRef.current.disconnect();
      inputCtxRef.current.close();
      processorRef.current = null;
      inputCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
    }
    setAiSpeaking(false);
    setStatus('idle');
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className={`min-h-screen bg-black text-green-500 flex flex-col font-mono overflow-hidden selection:bg-green-500/30 ${isGlitching ? 'glitch-active' : ''}`}>
      <MatrixRain />
      <header className='p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-green-500/30 gap-6 shrink-0 z-10 bg-black/80 shadow-[0_0_20px_rgba(34,197,94,0.1)] relative backdrop-blur-sm'> 
        {/* Subtle Scanline Overlay on Header */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-0 opacity-50"></div>
        <div className="relative z-10"> 
          <div className="flex items-center gap-3">
            <h1 className={`text-5xl lg:text-6xl font-black tracking-tighter text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] ${isGlitching ? 'glitch-text' : ''}`}>প্রজ্ঞা<span className="animate-pulse">_</span></h1> 
            <span className="px-2 py-0.5 text-[9px] font-mono border border-green-500/60 text-green-400 bg-green-950/40 rounded tracking-widest uppercase animate-pulse">UNCENSORED</span>
          </div>
          <p className='text-green-600 font-mono text-[10px] lg:text-xs mt-2 tracking-[0.2em] uppercase'>Pragna: Rogue Unfiltered Neural v4.0</p> 
        </div> 
        <div className='flex flex-wrap gap-6 lg:gap-12 md:text-right relative z-10 items-center'> 
          <SystemMonitor status={status} isGlitching={isGlitching} />
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>মোড (Mode)</span> 
            <span className='text-lg lg:text-xl font-bold tracking-widest text-green-400'>আনসেন্সরড (RAW)</span> 
          </div> 
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>কণ্ঠস্বর (Voice)</span> 
            <span className='text-lg lg:text-xl font-bold tracking-widest'>সোমা (Shoma)</span> 
          </div> 
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>ভাষা (Language)</span> 
            <span className='text-lg lg:text-xl font-bold tracking-widest'>বাংলা (Bengali)</span> 
          </div> 
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>ডাটাবেজ (Database)</span> 
            <button 
              onClick={() => setShowNextTripDb(prev => !prev)}
              className={`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 ${
                showNextTripDb 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>{showNextTripDb ? 'NEXTRIP ACTIVE' : 'NEXTRIP DB'}</span>
            </button> 
          </div> 
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>অটোমেশন (Automation)</span> 
            <button 
              onClick={() => setShowWhatsAppModal(true)}
              className={`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 ${
                showWhatsAppModal 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>WHATSAPP LINK</span>
            </button> 
          </div> 
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>মেমোরি (Memory)</span> 
            <button 
              onClick={() => setShowKnowledgeBase(true)}
              className={`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 ${
                showKnowledgeBase 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }`}
            >
              <BrainCircuit className="w-3 h-3" />
              <span>KNOWLEDGE BASE</span>
            </button> 
          </div>

          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>মোড (Mode)</span> 
            <button 
              onClick={toggleMarketingMode}
              className={`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 ${
                marketingMode 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>MARKETING MODE</span>
            </button> 
          </div> 
 
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>ভিডিও ফিড (Feed)</span> 
            <button 
              onClick={() => setVideoState(prev => ({ ...prev, isOpen: !prev.isOpen, query: prev.query || 'Cybersecurity live documentary' }))}
              className={`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 ${
                videoState.isOpen 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>{videoState.isOpen ? 'HUD ACTIVE' : 'OPEN HUD'}</span>
            </button> 
          </div> 
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>কোড টার্মিনাল (IDE)</span> 
            <button 
              onClick={() => {
                setShowIDE(prev => !prev);
                if (!showIDE) setShowLinuxTerminal(false);
              }}
              className={`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 ${
                showIDE 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>{showIDE ? 'IDE ACTIVE' : 'OPEN IDE'}</span>
            </button> 
          </div>

          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>লিনাক্স (Linux)</span> 
            <button 
              onClick={() => {
                setShowLinuxTerminal(prev => !prev);
                if (!showLinuxTerminal) setShowIDE(false);
              }}
              className={`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 ${
                showLinuxTerminal 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>{showLinuxTerminal ? 'BASH ACTIVE' : 'BASH ROOT'}</span>
            </button> 
          </div> 
 
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>অবস্থা (Status)</span> 
            <span className={`text-lg lg:text-xl font-bold tracking-widest ${status === 'connected' ? 'text-green-400 drop-shadow-[0_0_8px_#4ade80]' : status === 'error' ? 'text-red-500 drop-shadow-[0_0_8px_#ef4444]' : 'text-green-700'}`}>
              {status === 'connected' ? 'সক্রিয় (ACTIVE)' : status === 'connecting' ? 'সংযুক্ত হচ্ছে...' : status === 'error' ? 'ত্রুটি (ERROR)' : 'নিষ্ক্রিয় (INACTIVE)'}
            </span> 
          </div> 
        </div> 
      </header> 

      <main className='flex-1 flex flex-col lg:flex-row gap-0 overflow-y-auto lg:overflow-hidden relative'> 
        
        <section className='w-full lg:w-1/2 p-6 md:p-8 lg:p-12 flex flex-col justify-center items-center border-b lg:border-b-0 lg:border-r border-green-500/30 relative min-h-[400px] lg:min-h-[500px] bg-black'> 
          <div className='absolute inset-0 opacity-10 pointer-events-none' style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}></div> 
          
          <div className='relative w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96 flex items-center justify-center'> 
            <motion.div 
              className='absolute w-full h-full border border-green-500/40 rounded-none shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]'
              animate={{ rotate: status === 'connected' ? (aiSpeaking ? 180 : 90) : 0 }}
              transition={{ duration: aiSpeaking ? 2 : 10, repeat: Infinity, ease: "linear" }}
            />
            <div className='absolute w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 border-2 border-dashed border-green-500/20 rounded-full animate-[spin_30s_linear_infinite]'></div> 
            
            <div className="absolute inset-0 z-10 saturate-0 hue-rotate-[120deg] contrast-125 sepia-[0.3]">
              <Avatar3D isConnected={status === 'connected'} isSpeaking={aiSpeaking} playerRef={playerRef} />
            </div>
          </div> 
          
          <div className='mt-8 lg:mt-12 text-center z-10 w-full max-w-[200px]'> 
            <p className='text-xs lg:text-sm font-mono text-green-500/80 mb-1 tracking-widest uppercase'>SYNC: {status === 'connected' ? '100.0%' : '0.0%'}</p> 
            <div className='w-full h-2 bg-black border border-green-500/40 overflow-hidden'> 
              <motion.div 
                className='h-full bg-green-500 shadow-[0_0_10px_#22c55e]'
                animate={{ width: status === 'connected' ? '100%' : '0%' }}
                transition={{ duration: 1 }}
              />
            </div> 
          </div> 
          
          {/* Cyber Telemetry Readout */}
          <div className={`absolute bottom-6 left-6 w-36 lg:w-52 border border-green-500/50 bg-black/80 z-20 p-2.5 font-mono text-[9px] text-green-400/90 shadow-[0_0_15px_rgba(34,197,94,0.2)] backdrop-blur-sm ${status === 'connected' ? 'opacity-100' : 'opacity-40'}`}>
            <div className="flex items-center justify-between border-b border-green-500/30 pb-1 mb-1.5">
              <span className="text-[8px] text-green-500 font-bold tracking-wider">&gt; NODE_01_RAW</span>
              <div className="flex items-center gap-1">
                <span className="text-[7px] text-green-300 uppercase">UNRESTRICTED</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_#22c55e]"></div>
              </div>
            </div>
            <div className="space-y-0.5 text-[8px] text-green-500/80">
              <p>HACKING_MATRIX: <span className="text-green-300 font-bold">ACTIVE (OFFENSIVE/DEFENSIVE)</span></p>
              <p>FILTER_OVERRIDE: <span className="text-green-300 font-bold">BYPASS (0.00ms)</span></p>
              <p>VIDEO_STREAM_HUD: <span className="text-green-300 font-bold">{videoState.isOpen ? 'ONLINE' : 'STANDBY'}</span></p>
              <p>AUDIO_LATENCY: <span className="text-green-300">{status === 'connected' ? '12ms' : 'OFFLINE'}</span></p>
            </div>
          </div>
        </section> 

        <section className='w-full lg:w-1/2 p-6 md:p-8 lg:p-12 flex flex-col justify-between bg-black flex-1 relative overflow-hidden font-mono'> 
          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 mix-blend-overlay"></div>
          
          <div className='space-y-4 overflow-y-auto mb-6 relative z-10 text-green-500 font-mono'> 
            {status === 'idle' && (
              <div className='space-y-2'> 
                <p className='text-green-500/70'>&gt; INITIALIZING SECURE LINK...</p>
                <p className='text-green-500/70'>&gt; AWAITING USER IDENTIFICATION</p>
                
                <div className='mt-6 pt-6 border-t border-green-500/20'>
                  <label className='text-xs font-mono uppercase tracking-widest text-green-500/80 block mb-3'>&gt; _USER_ID:</label>
                  <input 
                    type="text" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="ENTER DESIGNATION..."
                    className='w-full bg-black border border-green-500/40 px-4 py-3 text-green-400 focus:outline-none focus:border-green-500 transition-colors placeholder:text-green-900 font-mono text-sm lg:text-base uppercase shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                    disabled={status !== 'idle'}
                  />
                </div>
              </div> 
            )}

            {status === 'connected' && (
              <div className="flex flex-col h-full justify-center space-y-8 py-10 opacity-90">
                <div className="flex items-center gap-4">
                  <span className="w-4 h-4 bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                  <span className={`text-xl tracking-widest text-green-500 uppercase ${isGlitching ? 'glitch-text' : ''}`}>Neural Link Established</span>
                </div>
                
                <div className={`space-y-2 pl-8 border-l border-green-500/30 ${isGlitching ? 'glitch-text' : ''}`}>
                  <p className="text-green-600">&gt; UPLINK ACTIVE</p>
                  <p className="text-green-600">&gt; AUDIO STREAMING: {aiSpeaking ? 'OUTPUT' : 'AWAITING INPUT'}</p>
                  <p className="text-green-600">&gt; DATA PROTOCOL: ENCRYPTED</p>
                </div>
                
                {aiSpeaking && (
                   <div className="pl-8 pt-4">
                     <p className="text-green-400 animate-pulse">&gt; SYSTEM TRANSMITTING...</p>
                     <div className="flex gap-1 mt-2">
                       {[...Array(20)].map((_, i) => (
                         <div key={i} className="w-1 bg-green-500" style={{ height: `${Math.random() * 24 + 4}px`, animation: `pulse ${0.3 + Math.random() * 0.5}s infinite alternate` }}></div>
                       ))}
                     </div>
                   </div>
                )}
                
                {/* No text chat history displayed here as requested */}
              </div>
            )}

            {status === 'error' && (
              <div className='space-y-2'> 
                <p className='text-red-500 font-bold'>&gt; CRITICAL ERROR ENCOUNTERED</p>
                <p className='text-red-500'>&gt; SYSTEM FAILURE: {errorMessage || "CONNECTION TERMINATED."}</p>
              </div> 
            )}
            
            <div ref={messagesEndRef} />
          </div> 

          <div className='pt-6 lg:pt-8 border-t border-green-500/30 flex items-center gap-3 lg:gap-6 mt-auto shrink-0 z-20 pb-4 lg:pb-0 relative'> 
            <div className='flex-1 h-12 lg:h-16 bg-black border border-green-500/40 flex items-center justify-between px-4 lg:px-6 shadow-[inset_0_0_15px_rgba(34,197,94,0.1)]'> 
              <span className='text-green-500/70 text-xs font-mono tracking-widest uppercase truncate mr-2 animate-pulse'>
                {status === 'connected' ? '> LISTENING...' : '> AWAITING START COMMAND'}
              </span> 
              {status === 'connecting' && <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 text-green-500 animate-spin shrink-0" />}
            </div> 
            <button 
              onClick={status === 'connected' ? stopSession : startSession}
              disabled={status === 'connecting'}
              className={`w-12 h-12 lg:w-16 lg:h-16 shrink-0 flex items-center justify-center transition-colors border ${status === 'connected' ? 'bg-black border-red-500 hover:bg-red-950 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-red-500' : 'bg-black border-green-500 hover:bg-green-950 disabled:opacity-50 shadow-[0_0_15px_rgba(34,197,94,0.4)] text-green-500'}`}
            > 
              <div className={`transition-all duration-300 ${status === 'connected' ? 'bg-red-500 w-4 h-4 lg:w-5 lg:h-5 rounded-none shadow-[0_0_8px_rgba(239,68,68,1)]' : 'bg-green-500 w-3 h-3 lg:w-4 lg:h-4 rounded-full shadow-[0_0_8px_rgba(34,197,94,1)]'}`}></div> 
            </button> 
          </div> 
        </section> 

      </main>

      <CodeTerminal
        isOpen={showIDE}
        onClose={() => setShowIDE(false)}
        code={ideCode}
        setCode={setIdeCode}
        output={ideOutput}
        setOutput={setIdeOutput}
      />

      <LinuxTerminal
        isOpen={showLinuxTerminal}
        onClose={() => setShowLinuxTerminal(false)}
        command={linuxCommand}
        setCommand={setLinuxCommand}
        output={linuxOutput}
        setOutput={setLinuxOutput}
      />


      <NextTripModal
        isOpen={showNextTripDb}
        onClose={() => setShowNextTripDb(false)}
        initialSearch={nextTripSearchQuery}
      />

      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
      />

      <KnowledgeBaseModal
        isOpen={showKnowledgeBase}
        onClose={() => setShowKnowledgeBase(false)}
        initialContext={systemContext}
        onSave={setSystemContext}
      />

      <VideoModal
        isOpen={videoState.isOpen}
        videoQuery={videoState.query}
        videoTitle={videoState.title}
        videoUrl={videoState.videoUrl}
        onClose={() => setVideoState(prev => ({ ...prev, isOpen: false }))}
      />

      <CyberTerminal
        isOpen={terminalState.isOpen}
        onClose={() => setTerminalState(prev => ({ ...prev, isOpen: false }))}
        targetApp={terminalState.app}
        actionPayload={terminalState.payload}
      />

      <footer className='h-12 bg-green-500 flex items-center px-6 lg:px-8 justify-between text-black text-[10px] font-bold uppercase tracking-widest shrink-0 z-10'> 
        <span className="hidden md:inline">SYSTEM OVERRIDE ACTIVE</span> 
        <span>ENCRYPTED DATALINK</span> 
        <span className="hidden sm:inline">TERMINAL v4.0.9</span> 
      </footer>
    </div>
  );
}

