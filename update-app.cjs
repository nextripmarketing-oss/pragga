const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { VoiceTrainingModal }')) {
  content = content.replace(
    "import { MarketingModal } from './components/MarketingModal';",
    "import { MarketingModal } from './components/MarketingModal';\nimport { VoiceTrainingModal } from './components/VoiceTrainingModal';"
  );
}

if (!content.includes('const [showVoiceModal')) {
  content = content.replace(
    "const [showMarketingModal, setShowMarketingModal] = useState<boolean>(false);",
    "const [showMarketingModal, setShowMarketingModal] = useState<boolean>(false);\n  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);"
  );
}

if (!content.includes('VOICE TRAINING')) {
  const voiceBtn = `
            <button 
              onClick={() => setShowVoiceModal(true)}
              className={\`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 mt-1 \${
                showVoiceModal 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }\`}
            >
              <Mic className="w-3 h-3" />
              <span>VOICE TRAINING</span>
            </button>
`;
  content = content.replace("<span>MARKETING RULES</span>\n            </button>", "<span>MARKETING RULES</span>\n            </button>\n" + voiceBtn);
}

if (!content.includes('Mic, Target')) {
  content = content.replace("import { MessageSquare, BrainCircuit, Target } from 'lucide-react';", "import { MessageSquare, BrainCircuit, Target, Mic } from 'lucide-react';");
}

if (!content.includes('<VoiceTrainingModal')) {
  const voiceModal = `
      <VoiceTrainingModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
`;
  content = content.replace(
    '<MarketingModal\n        isOpen={showMarketingModal}\n        onClose={() => setShowMarketingModal(false)}\n      />',
    '<MarketingModal\n        isOpen={showMarketingModal}\n        onClose={() => setShowMarketingModal(false)}\n      />\n' + voiceModal
  );
}

fs.writeFileSync(file, content);
