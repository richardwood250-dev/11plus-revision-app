const fs = require('fs');
let content = fs.readFileSync('data/verbal.js', 'utf8');
content = content.replace('export const VERBAL_QUIZ =', 'module.exports =');
fs.writeFileSync('temp_verbal.js', content);
const quiz = require('./temp_verbal');
const keys = Object.keys(quiz);
console.log("Keys:", keys);
const missingKey = keys.find(k => k.toLowerCase().includes('missing') || k.toLowerCase().includes('letter') || k.toLowerCase().includes('m3l') || k.toLowerCase().includes('move'));
console.log("Missing key:", missingKey);
if (missingKey) {
    const q = quiz[missingKey].questions;
    console.log(`Found ${q.length} questions.`);
    console.log("Sample:", q[0].question);
}
