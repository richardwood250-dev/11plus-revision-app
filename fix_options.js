const fs = require('fs');

let fileContent = fs.readFileSync('data/maths.js', 'utf8');
const code = fileContent.replace('export const MATHS_QUIZ =', 'module.exports =');
fs.writeFileSync('tmp_maths_options.js', code);

const maths = require('./tmp_maths_options.js');
let fixedCount = 0;

for (let q of maths) {
    if (q.options && !q.options.includes(q.correctAnswer)) {
        // Replace the last option with the correct answer
        // Make sure we aren't creating duplicates, though the fact it's missing means it won't be a duplicate anyway
        if (q.options.length > 0) {
            q.options[q.options.length - 1] = q.correctAnswer;

            // Optionally, we could shuffle the array to randomise the position of the corrected answer
            // but for simplicity and safety, just replacing the last one is deterministic.
            fixedCount++;
        }
    }
}

console.log(`Fixed ${fixedCount} questions by adding the missing correctAnswer to the options array.`);

const newFileContent = "export const MATHS_QUIZ = " + JSON.stringify(maths, null, 2) + ";\n";
fs.writeFileSync('data/maths.js', newFileContent);
fs.unlinkSync('tmp_maths_options.js');
