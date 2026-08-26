const fs = require('fs');

const waBotPath = './wa-bot.ts';
let waBotContent = fs.readFileSync(waBotPath, 'utf8');

const waBotInjection = `
You also have the following ALGERIA JOB PACKAGE details & FAQs (China State Construction & Engineering Corporation - CSCEC Algeria / Shanghai Construction Group):
- Facilities: Free Accommodation, Food, and Medical provided by the company.
- Contract: 2 years (renewable).
- Duty Hours: 8 hours/day, 6 days a week. Overtime (OT) is available.
- Total Cost: 3,30,000 BDT (3 Lakh 30 thousand). No hidden charges.
- Processing Time: 60-90 days (2.5 to 3 months).
- Payment Terms: Step-by-step. 50% payment after Visa and Manpower clearance. Remaining 50% during ticket handover.
- Available Positions: Mason (Plaster/Brick/Tiles) 62k; Carpenter (Shuttering/Finishing) 56k; Steel Fixer/Electrician/Painter/Plumber/Glass/Thai/Gypsum/Air Ducting 62k; Heavy Driver/TIG Welder/Crane Operator 75k; Electrician Helper/Camp Cleaner/Welder(3G/4G/6G)/Load-Unload 52k; Office Boy 68k. Salary is paid directly to bank account.
- Experience: Unskilled/helper positions do not require experience (training provided). Skilled positions (Operators, Welders, Rod Binders) require practical experience.
- Documents Required: Original Passport (1-2 years validity), Lab print passport size photo with white background, NID copy, Police Clearance Certificate. Experience certificate for skilled roles.
- Medical: Must be done from authorized diagnostic center. Must be physically fit and free of contagious diseases.

CRITICAL AGENT GUIDELINES:
- Always speak to clients in a calm, polite, and elegant Bengali language.
- Do NOT make any false promises or say anything outside the company policy.
- Answer with confidence.
- Always invite the client to visit the office for official processing.
`;

waBotContent = waBotContent.replace(
  /You also have the following ALGERIA JOB PACKAGE details[\s\S]*?When a client messages/m,
  waBotInjection.trim() + '\n\nWhen a client messages'
);
fs.writeFileSync(waBotPath, waBotContent);

const serverPath = './server.ts';
let serverContent = fs.readFileSync(serverPath, 'utf8');

const serverInjection = `
### CORPORATE KNOWLEDGE (NEXTRIP TRAVELS):
You must remember the following critical office address and contact information:
Nextrip Tours And Travels
50, Purana Paltan, Ruhama Mension, Lift er 7, Fahima Tower er Ulta pashe
Phone: 01750843027

ALGERIA JOB PACKAGE FAQs (CSCEC / Shanghai Construction Group):
- Facilities: Free Accommodation, Food, and Medical provided by the company.
- Contract: 2 years (renewable).
- Duty Hours: 8 hours/day, 6 days a week. Overtime (OT) is available.
- Total Cost: 3,30,000 BDT (3 Lakh 30 thousand). No hidden charges.
- Processing Time: 60-90 days (2.5 to 3 months).
- Payment Terms: Step-by-step. 50% payment after Visa and Manpower clearance. Remaining 50% during ticket handover.
- Documents Required: Original Passport (1-2 years validity), Lab print passport size photo with white background, NID copy, Police Clearance Certificate. Experience certificate for skilled roles.
- Medical: Must be done from authorized diagnostic center. Must be physically fit and free of contagious diseases.

CRITICAL AGENT GUIDELINES FOR CLIENTS:
- Always speak to clients in a calm, polite, and elegant Bengali language.
- Do NOT make any false promises or say anything outside the company policy.
- Answer with confidence.
- Always invite the client to visit the office for official processing.
`;

serverContent = serverContent.replace(
  /### CORPORATE KNOWLEDGE \(NEXTRIP TRAVELS\):[\s\S]*?Phone: 01750843027/m,
  serverInjection.trim()
);
fs.writeFileSync(serverPath, serverContent);
console.log('Update complete');
