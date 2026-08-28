const googleTTS = require('google-tts-api');
googleTTS.getAudioBase64('হ্যালো, আমি প্রজ্ঞা। আপনি কেমন আছেন?', { lang: 'bn', slow: false }).then(base64 => console.log(base64.substring(0, 50))).catch(console.error);
