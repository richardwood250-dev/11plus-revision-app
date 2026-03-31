const fs = require('fs');

let fileContent = fs.readFileSync('data/maths.js', 'utf8');
const code = fileContent.replace('export const MATHS_QUIZ =', 'module.exports =');
fs.writeFileSync('tmp_maths_disable.js', code);

const maths = require('./tmp_maths_disable.js');
const initialLength = maths.length;

// Filter out all questions that start with P5Q15_
const newMaths = maths.filter(q => !q.id.startsWith('P5Q15_'));

console.log(`Starting question count: ${initialLength}`);
console.log(`Remaining question count: ${newMaths.length}`);
console.log(`Removed ${initialLength - newMaths.length} questions.`);

const newFileContent = "export const MATHS_QUIZ = " + JSON.stringify(newMaths, null, 2) + ";\n";
fs.writeFileSync('data/maths.js', newFileContent);
fs.unlinkSync('tmp_maths_disable.js');
