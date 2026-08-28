const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

const oldErrorBlock = `  } catch (error: any) {
    console.error("AI Error:", error);
    return "System Error: Unable to reach neural network.";
  }`;

const newErrorBlock = `  } catch (error: any) {
    console.error("AI Error:", error);
    if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('Quota')) {
      return "আসসালামু আলাইকুম। দুঃখিত, এই মুহূর্তে আমাদের সার্ভারে অনেক বেশি চাপ রয়েছে। অনুগ্রহ করে একটু পর আবার মেসেজ দিন।";
    }
    return "দুঃখিত, একটি কারিগরি ত্রুটি হয়েছে। দয়া করে কিছুক্ষণ পর আবার মেসেজ করুন।";
  }`;

if (content.includes('return "System Error: Unable to reach neural network.";')) {
  content = content.replace(
    /\} catch \(error: any\) \{\s*console\.error\("AI Error:", error\);\s*return "System Error: Unable to reach neural network\.";\s*\}/g,
    newErrorBlock
  );
  fs.writeFileSync(file, content);
  console.log("AI Error handler patched.");
} else {
  console.log("Could not find exact AI Error block, attempting generic replace...");
  content = content.replace('return "System Error: Unable to reach neural network.";', 'return "আসসালামু আলাইকুম। দুঃখিত, এই মুহূর্তে আমাদের সার্ভারে অনেক বেশি চাপ রয়েছে। অনুগ্রহ করে একটু পর আবার মেসেজ দিন। (Rate Limit Exceeded)";');
  fs.writeFileSync(file, content);
}
