const fs = require('fs');
let fileContent = fs.readFileSync('data/maths.js', 'utf8');
const code = fileContent.replace('export const MATHS_QUIZ =', 'module.exports =');
fs.writeFileSync('tmp_maths.js', code);

const maths = require('./tmp_maths.js');
let fixedCount = 0;

for (let q of maths) {
    if (q.image && !q.image.startsWith('http')) {
        q.image = `https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/main/${q.image}`;
        fixedCount++;
    }
}

console.log(`Fixed ${fixedCount} image URLs.`);

const newFileContent = "export const MATHS_QUIZ = " + JSON.stringify(maths, null, 2) + ";\n";
fs.writeFileSync('data/maths.js', newFileContent);
fs.unlinkSync('tmp_maths.js');
