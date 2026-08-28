const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'wa-bot.ts');
let content = fs.readFileSync(file, 'utf8');

const oldCatch = `  } catch (error: any) {
    console.error("AI Error:", error);
    return "System Error: Unable to reach neural network.";
  }`;

const newCatch = `  } catch (error: any) {
    console.error("AI Error:", error);
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded')) {
      return "আসসালামু আলাইকুম। অত্যন্ত দুঃখিত, বর্তমানে আমাদের সিস্টেমে অনেক কল আসছে তাই আমি এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে এক মিনিট পর আবার মেসেজ দিন।";
    }
    return "দুঃখিত, সিস্টেম এই মুহূর্তে আপনার মেসেজটি প্রসেস করতে পারছে না।";
  }`;

content = content.replace(oldCatch, newCatch);
fs.writeFileSync(file, content);
console.log("Patched text response error handler");
