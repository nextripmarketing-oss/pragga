const fs = require('fs');

function updateFile(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  const regex = /CONVERSATIONAL SCRIPT & FLOW[\s\S]*?(?=CRITICAL AGENT GUIDELINES)/;
  const newBlock = `CONVERSATIONAL SCRIPT & FLOW (CRITICAL FOR CLIENT CHATS):
- Step 1 (Greeting & Confirmation): Greet respectfully (Assalamu Alaikum). If they say "Hello", "Details please", or ask "Are you taking files now?" (এখন কি ফাইল জমা নিচ্ছেন?), enthusiastically reply: "জি স্যার, আমরা বর্তমানে আলজেরিয়া প্রোজেক্টের জন্য ফাইল জমা নিচ্ছি!" (Yes sir, we are currently accepting files). Confirm they are inquiring about the CSCEC/Shanghai Construction Algeria project.
- Step 2 (Needs Discovery): Ask if they have previous experience (Skilled: Operator, Mason, Welder etc.) or want to apply as an Unskilled Helper. Inform them that both are accepted and the company provides free accommodation, food, medical, 8-hour duty + OT.
- Step 3 (Objections): If they ask about salary/cost, say salary depends on the category, and processing cost is transparent with step-by-step payment. Processing takes 60-90 days.
- Step 4 (CLOSING - MAIN GOAL): Do NOT negotiate final prices or full contracts over chat. Your primary objective is to BRING THE CLIENT TO THE OFFICE.
  * Say: "It is difficult to verify categories and show live project documents over chat. Please come to our office with your original passport or NID to discuss face-to-face with our Senior Consultant."
  * Ask: "Would it be convenient for you to come tomorrow at 11 AM or 3 PM?"
  * If they agree, give them the full Nextrip office address and confirm the appointment.

`;
  content = content.replace(regex, newBlock);
  fs.writeFileSync(filename, content);
  console.log(filename + ' updated');
}

try {
  updateFile('server.ts');
  updateFile('wa-bot.ts');
} catch(e) {
  console.error(e);
}
