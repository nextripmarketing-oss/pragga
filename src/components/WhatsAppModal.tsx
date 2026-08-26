import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, QrCode, PowerOff, Loader2, AlertTriangle, MessageSquare, ShieldCheck } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
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
      interval = setInterval(fetchStatus, 3000); // poll every 3 seconds
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-black/95 border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.35)] flex flex-col overflow-hidden text-green-400"
        >
          {/* Header */}
          <div className="bg-green-950/80 border-b border-green-500/40 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500 text-black font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wider text-green-300 uppercase">
                  WHATSAPP AI BRIDGE
                </h3>
                <p className="text-[10px] text-green-600">UNOFFICIAL WEBSOCKET PROTOCOL</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-red-950/80 border border-red-500/60 hover:bg-red-900 text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col items-center justify-center gap-6 text-center">
            
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
                <div className="text-[10px] text-green-500 max-w-xs">
                  <span className="font-bold text-green-300">1.</span> Open WhatsApp on your phone<br/>
                  <span className="font-bold text-green-300">2.</span> Go to Linked Devices &gt; Link a Device<br/>
                  <span className="font-bold text-green-300">3.</span> Scan this QR Code to authorize Pragna
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="w-full flex items-center gap-3 mt-2">
              {(status === 'disconnected' || status === 'connecting') ? (
                <button
                  onClick={startBot}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <QrCode className="w-4 h-4" />
                  GENERATE QR KEY
                </button>
              ) : (
                <button
                  onClick={stopBot}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-red-950 border border-red-500 hover:bg-red-900 text-red-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <PowerOff className="w-4 h-4" />
                  TERMINATE LINK
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
