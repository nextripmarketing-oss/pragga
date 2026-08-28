const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/WhatsAppModal.tsx');
let content = fs.readFileSync(file, 'utf8');

const oldImports = `import { X, Smartphone, QrCode, PowerOff, Loader2, AlertTriangle, MessageSquare, ShieldCheck, Target, Save } from 'lucide-react';`;
const newImports = `import { X, Smartphone, QrCode, PowerOff, Loader2, AlertTriangle, MessageSquare, ShieldCheck, Target, Save, ToggleLeft, ToggleRight } from 'lucide-react';`;

content = content.replace(oldImports, newImports);

const stateCode = `  const [instructions, setInstructions] = useState('');`;
const newStateCode = `  const [instructions, setInstructions] = useState('');
  const [marketingEnabled, setMarketingEnabled] = useState(false);`;

content = content.replace(stateCode, newStateCode);

const fetchCode = `      // Load Marketing Instructions
      fetch('/api/settings/marketing-instructions')
        .then(res => res.json())
        .then(data => setInstructions(data.instructions || ''))
        .catch(console.error);
      setSaveStatus('idle');`;

const newFetchCode = `      // Load Marketing Instructions
      fetch('/api/settings/marketing-instructions')
        .then(res => res.json())
        .then(data => setInstructions(data.instructions || ''))
        .catch(console.error);
      fetch('/api/settings/marketing-mode')
        .then(res => res.json())
        .then(data => setMarketingEnabled(data.enabled || false))
        .catch(console.error);
      setSaveStatus('idle');`;

content = content.replace(fetchCode, newFetchCode);

const saveCode = `    try {
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
    } catch (err) {`;

const newSaveCode = `    try {
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
    } catch (err) {`;

content = content.replace(saveCode, newSaveCode);

const renderCode = `<div className="flex items-center gap-2 text-green-400 font-bold mb-1 uppercase tracking-wider text-sm">
                <Target className="w-4 h-4" /> Marketing Strategy Training
              </div>`;

const newRenderCode = `<div className="flex items-center justify-between mb-1">
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
              </div>`;

content = content.replace(renderCode, newRenderCode);

fs.writeFileSync(file, content);
console.log("Patched successfully");
