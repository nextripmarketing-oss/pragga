import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BrainCircuit, Save, DatabaseBackup } from 'lucide-react';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (context: string) => void;
  initialContext: string;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ isOpen, onClose, onSave, initialContext }) => {
  const [contextText, setContextText] = useState(initialContext);

  useEffect(() => {
    setContextText(initialContext);
  }, [initialContext, isOpen]);

  const handleSave = () => {
    onSave(contextText);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-black/95 border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.35)] flex flex-col overflow-hidden text-green-400"
        >
          {/* Header */}
          <div className="bg-green-950/80 border-b border-green-500/40 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500 text-black font-bold">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wider text-green-300 uppercase">
                  PRAGNA // NEURAL KNOWLEDGE BASE
                </h3>
                <p className="text-[10px] text-green-600">INJECT CUSTOM RULES & COMPANY CONTEXT</p>
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
            <div className="flex flex-col gap-1 text-[10px] text-green-600">
              <p>Enter any custom instructions, rules, or information you want Pragna to know (e.g., NexTrip Travels details, specific workflows, or how she should reply). This will be directly injected into her core neural prompt.</p>
            </div>
            
            <textarea 
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              className="w-full h-64 bg-black/90 border border-green-500/50 p-3 text-xs text-green-300 placeholder:text-green-800 focus:outline-none focus:border-green-400 focus:shadow-[0_0_12px_rgba(34,197,94,0.3)] font-mono resize-none"
              placeholder="Example: NexTrip Travels is a premier travel agency in Bangladesh. When answering WhatsApp messages, always be professional but maintain the rogue AI persona. NexTrip's main office is in Dhaka..."
            />

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-green-500/40 hover:bg-green-900/60 text-green-400 text-xs font-bold uppercase transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(34,197,94,0.5)]"
              >
                <Save className="w-3.5 h-3.5" />
                SYNC TO BRAIN
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
