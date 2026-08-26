const fs = require('fs');
const buffer = fs.readFileSync('public/models/girl.glb');
const jsonLength = buffer.readUInt32LE(12);
const jsonString = buffer.toString('utf8', 20, 20 + jsonLength);
const gltf = JSON.parse(jsonString);
let morphs = new Set();
if (gltf.meshes) {
  gltf.meshes.forEach(m => {
    if (m.primitives) {
      m.primitives.forEach(p => {
        if (p.targets) {
           if (m.extras && m.extras.targetNames) {
             m.extras.targetNames.forEach(name => morphs.add(name));
           }
        }
      });
    }
  });
}
console.log(Array.from(morphs));
