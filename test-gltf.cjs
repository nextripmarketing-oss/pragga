const fs = require('fs');
const buffer = fs.readFileSync('public/models/rpm.glb');
console.log('length:', buffer.length);
console.log('magic:', buffer.slice(0, 4).toString());
console.log('version:', buffer.readUInt32LE(4));
console.log('length:', buffer.readUInt32LE(8));
console.log('chunk0 length:', buffer.readUInt32LE(12));
console.log('chunk0 type:', buffer.slice(16, 20).toString());
