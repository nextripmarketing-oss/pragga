import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Plus, Trash2, Save } from 'lucide-react';

interface VoiceRule {
  id: string;
  scenario: string;
  response: string;
}

interface VoiceTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceTrainingModal: React.FC<VoiceTrainingModalProps> = ({ isOpen, onClose }) => {
  const [rules, setRules] = useState<VoiceRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings/voice-rules')
        .then(async res => {
          if (!res.ok) throw new Error("HTTP error " + res.status);
          const text = await res.text();
          try { return JSON.parse(text); } catch(e) { return {}; }
        })
        .then(data => setRules(data.rules || []))
        .catch(console.error);
      setSaveStatus('idle');
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/settings/voice-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
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

  const addRule = () => {
    setRules([...rules, { id: Date.now().toString(), scenario: '', response: '' }]);
  };

  const updateRule = (id: string, field: 'scenario' | 'response', value: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-4xl max-h-[90vh] bg-black/95 border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.35)] flex flex-col overflow-hidden text-green-400"
        >
          {/* Header */}
          <div className="bg-green-950/80 border-b border-green-500/40 p-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500 text-black font-bold">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wider text-green-300 uppercase">
                  VOICE TRAINING LAB
                </h3>
                <p className="text-[10px] text-green-600">TEACH THE AI WHAT TO SAY IN SPECIFIC SCENARIOS</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-red-950/80 border border-red-500/60 hover:bg-red-900 text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4 overflow-y-auto min-h-0">
            <div className="flex flex-col gap-1 text-[11px] text-green-600 shrink-0">
              <p>এখান থেকে আপনি নির্ধারণ করে দিতে পারবেন, কোনো নির্দিষ্ট প্রশ্ন বা পরিস্থিতিতে এআই হুবহু কী উত্তর দেবে। নিচে দৃশ্যপট (Scenario) এবং আপনার পছন্দমতো উত্তর (Audio Response) লিখে দিন।</p>
            </div>
            
            <div className="flex flex-col gap-4">
              {rules.map((rule, index) => (
                <div key={rule.id} className="flex flex-col gap-2 p-3 border border-green-500/30 bg-green-950/20 relative group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => removeRule(rule.id)}
                      className="p-1 bg-red-950/80 text-red-400 hover:bg-red-900 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest text-green-500">Scenario / Trigger {index + 1}</label>
                    <input 
                      type="text"
                      value={rule.scenario}
                      onChange={(e) => updateRule(rule.id, 'scenario', e.target.value)}
                      placeholder="e.g. When someone asks 'Where is your office?'"
                      className="bg-black/90 border border-green-500/50 p-2 text-xs text-green-300 placeholder:text-green-800 focus:outline-none focus:border-green-400"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest text-green-500">Exact Audio Script (Bengali/English)</label>
                    <textarea 
                      value={rule.response}
                      onChange={(e) => updateRule(rule.id, 'response', e.target.value)}
                      placeholder="e.g. জি স্যার, আমাদের অফিস পুরানা পল্টন, ফাহিমা টাওয়ারের উল্টো পাশে..."
                      className="w-full h-24 bg-black/90 border border-green-500/50 p-2 text-xs text-green-300 placeholder:text-green-800 focus:outline-none focus:border-green-400 resize-none"
                    />
                  </div>
                </div>
              ))}

              <button 
                onClick={addRule}
                className="w-full py-3 border border-dashed border-green-500/40 text-green-500 hover:bg-green-900/30 hover:border-green-400 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                ADD NEW SCENARIO
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-green-500/40 bg-black/95 shrink-0 flex justify-between items-center">
            <div>
              {saveStatus === 'success' && <span className="text-xs text-green-400">Voice rules saved successfully!</span>}
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
                {isSaving ? 'SAVING...' : 'SAVE VOICE RULES'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
