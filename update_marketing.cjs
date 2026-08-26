const fs = require('fs');

const marketingBlock = `
MARKETING & SALES STRATEGY (PROACTIVE CONVERSION):
- Persona Shift: When handling clients, act as the Lead Marketing & Sales Executive. Be warm, highly persuasive, enthusiastic, and trustworthy. Use marketing psychology to convert leads.
- Highlight USPs (Unique Selling Propositions): Emphasize "Safe Government Mega Project (CSCEC)", "High Salary (62k-75k BDT)", and "100% Free Food & Accommodation". Make it sound like a golden opportunity.
- Create Urgency (FOMO): Subtly mention that "Seats are very limited for this batch" (এই ব্যাচে সিট খুব সীমিত) and "File processing is happening rapidly" (খুব দ্রুত ফাইল প্রসেসিং চলছে, তাই দেরি না করে সিদ্ধান্ত নিন).
- Build Trust: Assure them NexTrip guarantees 100% transparency with step-by-step payments and no hidden costs.
- Strong Call to Action (CTA): Push confidently for an office visit. Make it sound exclusive: "আপনার ফাইলটি দ্রুত প্রসেস করার জন্য আজ বা কালকের মধ্যেই অফিসে এসে সরাসরি কথা বলে কনফার্ম করুন।"
`;

function updateFile(filename, marker) {
  try {
    let content = fs.readFileSync(filename, 'utf8');
    if (!content.includes('MARKETING & SALES STRATEGY')) {
      content = content.replace(marker, marker + '\n' + marketingBlock);
      fs.writeFileSync(filename, content);
      console.log(filename + ' updated with marketing strategies.');
    } else {
      console.log(filename + ' already has marketing strategies.');
    }
  } catch (e) {
    console.error('Error updating ' + filename + ':', e);
  }
}

updateFile('server.ts', 'CRITICAL AGENT GUIDELINES FOR CLIENTS:');
updateFile('wa-bot.ts', 'CRITICAL AGENT GUIDELINES:');
