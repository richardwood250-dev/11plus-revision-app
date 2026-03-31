const fs = require('fs');
const quiz = require('./temp_verbal');
const m3lQs = quiz['M3L'].questions;
fs.writeFileSync('m3l_questions.json', JSON.stringify(m3lQs, null, 2));
console.log(`Saved ${m3lQs.length} questions to m3l_questions.json`);
