const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { MarketingModal }')) {
    content = content.replace("import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';", "import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';\nimport { MarketingModal } from './components/MarketingModal';");
}

if (!content.includes('const [showMarketingModal')) {
    content = content.replace("const [showKnowledgeBase, setShowKnowledgeBase] = useState<boolean>(false);", "const [showKnowledgeBase, setShowKnowledgeBase] = useState<boolean>(false);\n  const [showMarketingModal, setShowMarketingModal] = useState<boolean>(false);");
}

const buttonHtml = `
            <button 
              onClick={() => setShowMarketingModal(true)}
              className={\`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 mt-1 \${
                showMarketingModal 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }\`}
            >
              <Target className="w-3 h-3" />
              <span>MARKETING RULES</span>
            </button>
`;

if (!content.includes('MARKETING RULES')) {
    content = content.replace("<span>WHATSAPP LINK</span>\n            </button>", "<span>WHATSAPP LINK</span>\n            </button>\n" + buttonHtml);
}

if (!content.includes('Target')) {
    content = content.replace("import { MessageSquare, BrainCircuit } from 'lucide-react';", "import { MessageSquare, BrainCircuit, Target } from 'lucide-react';");
}

const modalHtml = `
      <MarketingModal
        isOpen={showMarketingModal}
        onClose={() => setShowMarketingModal(false)}
      />
`;

if (!content.includes('<MarketingModal')) {
    content = content.replace("<WhatsAppModal\n        isOpen={showWhatsAppModal}\n        onClose={() => setShowWhatsAppModal(false)}\n      />", "<WhatsAppModal\n        isOpen={showWhatsAppModal}\n        onClose={() => setShowWhatsAppModal(false)}\n      />\n" + modalHtml);
}

fs.writeFileSync(file, content);
