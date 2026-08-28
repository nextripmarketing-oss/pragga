import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, QrCode, PowerOff, Loader2, AlertTriangle, MessageSquare, ShieldCheck, Target, Save, ToggleLeft, ToggleRight } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok) throw new Error("HTTP error " + res.status);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON: " + text);
      }
      setStatus(data.status);
      setQrCode(data.qr);
    } catch (err) {
      console.error("Failed to fetch WA status", err);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen) {
      fetchStatus();
      interval = setInterval(fetchStatus, 10000); // poll every 3 seconds
      
      // Load Marketing Instructions
      fetch('/api/settings/marketing-instructions')
        .then(async res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch(e) {
            return {};
          }
        })
        .then(data => setInstructions(data.instructions || ''))
        .catch(console.error);
      fetch('/api/settings/marketing-mode')
        .then(async res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch(e) {
            return {};
          }
        })
        .then(data => setMarketingEnabled(data.enabled || false))
        .catch(console.error);
      setSaveStatus('idle');
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  const startBot = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/whatsapp/start', { method: 'POST' });
      await fetchStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const stopBot = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/whatsapp/stop', { method: 'POST' });
      await fetchStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await fetch('/api/settings/marketing-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: marketingEnabled }),
      });
      const res = await fetch('/api/settings/marketing-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions }),
      });
      if (res.ok) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-5xl bg-black/95 border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.35)] flex flex-col overflow-hidden text-green-400"
        >
          {/* Header */}
          <div className="bg-green-950/80 border-b border-green-500/40 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500 text-black font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wider text-green-300 uppercase">
                  WHATSAPP AI BRIDGE & MARKETING NEURAL RULES
                </h3>
                <p className="text-[10px] text-green-600">UNOFFICIAL WEBSOCKET PROTOCOL | TEACH THE AI HOW TO TALK TO CLIENTS</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-red-950/80 border border-red-500/60 hover:bg-red-900 text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row h-[70vh]">
            {/* Left side - Connection */}
            <div className="w-full md:w-1/3 p-5 flex flex-col items-center gap-6 text-center border-b md:border-b-0 md:border-r border-green-500/30 overflow-y-auto">
              {/* Warning Banner */}
              <div className="w-full p-3 bg-yellow-950/40 border border-yellow-600/50 flex flex-col gap-1.5 text-left">
                <span className="text-[10px] uppercase font-bold text-yellow-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  RISK WARNING
                </span>
                <p className="text-[10px] text-yellow-600/90 leading-tight">
                  This uses unofficial Web Automation (Baileys). High frequency of automated messages may result in a WhatsApp ban. Use at your own risk. Do not use for spamming.
                </p>
              </div>

              {/* Status Display */}
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-[10px] uppercase text-green-600 tracking-widest">
                  SYSTEM STATUS:
                </span>
                {status === 'disconnected' && (
                  <span className="text-lg font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <PowerOff className="w-5 h-5" /> OFFLINE
                  </span>
                )}
                {status === 'connecting' && (
                  <span className="text-lg font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> INITIALIZING...
                  </span>
                )}
                {status === 'connected' && (
                  <span className="text-lg font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> SECURELY LINKED
                  </span>
                )}
              </div>

              {/* QR Code Area */}
              {status === 'connecting' && qrCode && (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                  </div>
                  <div className="text-[10px] text-green-500 max-w-xs text-left">
                    <span className="font-bold text-green-300">1.</span> Open WhatsApp on your phone<br/>
                    <span className="font-bold text-green-300">2.</span> Go to Linked Devices &gt; Link a Device<br/>
                    <span className="font-bold text-green-300">3.</span> Scan this QR Code to authorize Pragna
                  </div>
                </div>
              )}

              <div className="flex-grow"></div>

              {/* Controls */}
              <div className="w-full flex items-center gap-3 mt-2">
                {(status === 'disconnected' || status === 'connecting') ? (
                  <button
                    onClick={startBot}
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4" />
                    GENERATE QR
                  </button>
                ) : (
                  <button
                    onClick={stopBot}
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-red-950 border border-red-500 hover:bg-red-900 text-red-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <PowerOff className="w-4 h-4" />
                    TERMINATE
                  </button>
                )}
              </div>
            </div>

            {/* Right side - Marketing Rules */}
            <div className="w-full md:w-2/3 p-5 flex flex-col gap-3 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-green-400 font-bold uppercase tracking-wider text-sm">
                  <Target className="w-4 h-4" /> Marketing Strategy Training
                </div>
                <button 
                  onClick={() => setMarketingEnabled(!marketingEnabled)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-400 hover:text-green-300 transition-colors"
                >
                  {marketingEnabled ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6 text-green-700" />}
                  {marketingEnabled ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
              <div className="flex flex-col gap-1 text-xs text-green-600">
                <p>এখানে আপনি নির্দিষ্ট রেসপন্স ফ্লো, কোম্পানির তথ্য এবং কাস্টমারদের সাথে কীভাবে কথা বলতে হবে তা কাস্টমাইজ করতে পারবেন। এটি ডাইনামিকভাবে এআই এজেন্টের ব্রেইনে ইনজেক্ট করা হবে।</p>
              </div>
              
              <textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full flex-grow bg-black/90 border border-green-500/50 p-3 text-xs text-green-300 placeholder:text-green-800 focus:outline-none focus:border-green-400 focus:shadow-[0_0_12px_rgba(34,197,94,0.3)] font-mono resize-none leading-relaxed"
                placeholder="এখানে আপনার মার্কেটিং মেসেজ এবং নিয়মগুলো লিখুন..."
              />
              <div className="flex justify-between items-center mt-2 shrink-0">
                <div>
                  {saveStatus === 'success' && <span className="text-xs text-green-400">Marketing rules updated successfully!</span>}
                  {saveStatus === 'error' && <span className="text-xs text-red-400">Failed to save rules.</span>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-green-500 hover:bg-green-400 disabled:bg-green-800 disabled:text-green-900 text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'SAVING...' : 'SAVE RULES'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
