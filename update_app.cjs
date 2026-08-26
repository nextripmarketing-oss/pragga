const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Add state
const stateRegex = /const \[showKnowledgeBase, setShowKnowledgeBase\] = useState<boolean>\(false\);/;
if (!appContent.includes('const [marketingMode, setMarketingMode] = useState<boolean>')) {
  appContent = appContent.replace(stateRegex, "const [showKnowledgeBase, setShowKnowledgeBase] = useState<boolean>(false);\n  const [marketingMode, setMarketingMode] = useState<boolean>(false);");
}

// Add useEffect to fetch state
const useEffectBlock = `
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
`;

if (!appContent.includes('toggleMarketingMode')) {
  // Add it before the first useEffect
  const firstUseEffect = /useEffect\(\(\) => \{/;
  appContent = appContent.replace(firstUseEffect, useEffectBlock + "\n  useEffect(() => {");
}

// Add the toggle button in the header
const knowledgeBaseBtnRegex = /<div className='flex flex-col'>\s*<span className='text-\[10px\] uppercase tracking-widest text-green-700'>মেমোরি \(Memory\)<\/span>[\s\S]*?<\/div>/;

const newToggleBtn = `
          <div className='flex flex-col'> 
            <span className='text-[10px] uppercase tracking-widest text-green-700'>মোড (Mode)</span> 
            <button 
              onClick={toggleMarketingMode}
              className={\`text-xs font-bold tracking-widest px-2 py-1 border transition-all flex items-center gap-1.5 \${
                marketingMode 
                  ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]' 
                  : 'bg-green-950/40 text-green-400 border-green-500/40 hover:bg-green-900/60'
              }\`}
            >
              <Activity className="w-3 h-3" />
              <span>MARKETING MODE</span>
            </button> 
          </div> 
`;

if (!appContent.includes('MARKETING MODE')) {
  appContent = appContent.replace(knowledgeBaseBtnRegex, match => match + '\n' + newToggleBtn);
}

fs.writeFileSync('src/App.tsx', appContent);
