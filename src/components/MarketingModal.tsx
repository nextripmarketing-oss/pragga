import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Save } from 'lucide-react';

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarketingModal: React.FC<MarketingModalProps> = ({ isOpen, onClose }) => {
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings/marketing-instructions')
        .then(async res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          const text = await res.text();
          try { return JSON.parse(text); } catch(e) { return {}; }
        })
        .then(data => setInstructions(data.instructions || ''))
        .catch(console.error);
      setSaveStatus('idle');
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
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
          className="w-full max-w-4xl bg-black/95 border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.35)] flex flex-col overflow-hidden text-green-400"
        >
          {/* Header */}
          <div className="bg-green-950/80 border-b border-green-500/40 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500 text-black font-bold">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wider text-green-300 uppercase">
                  WHATSAPP MARKETING NEURAL RULES
                </h3>
                <p className="text-[10px] text-green-600">TEACH THE AI HOW TO TALK TO CLIENTS</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-red-950/80 border border-red-500/60 hover:bg-red-900 text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-[11px] text-green-600">
              <p>এখান থেকে আপনি WhatsApp-এ এআই কীভাবে রিপ্লাই দেবে, প্রথম ওয়েলকাম মেসেজ কী হবে এবং কাস্টমারদের সাথে কীভাবে মার্কেটিং কথা বলবে তা শিখিয়ে দিতে পারবেন। আপনার শেখানো নিয়মেই এআই চ্যাটের উত্তর দেবে।</p>
            </div>
            
            <textarea 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full h-[50vh] bg-black/90 border border-green-500/50 p-3 text-xs text-green-300 placeholder:text-green-800 focus:outline-none focus:border-green-400 focus:shadow-[0_0_12px_rgba(34,197,94,0.3)] font-mono resize-none leading-relaxed"
              placeholder="এখানে আপনার মার্কেটিং মেসেজ এবং নিয়মগুলো লিখুন..."
            />

            <div className="flex justify-between items-center mt-2">
              <div>
                {saveStatus === 'success' && <span className="text-xs text-green-400">Marketing rules updated successfully!</span>}
                {saveStatus === 'error' && <span className="text-xs text-red-400">Failed to save rules.</span>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-green-500/40 hover:bg-green-900/60 text-green-400 text-xs font-bold uppercase transition-colors"
                >
                  CLOSE
                </button>
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
