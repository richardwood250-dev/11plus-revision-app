const fs = require('fs');
const path = require('path');

const verbalPath = path.join(__dirname, '../data/verbal.js');
let jsContent = fs.readFileSync(verbalPath, 'utf8');

// Extract JSON
const startIndex = jsContent.indexOf('{');
const endIndex = jsContent.lastIndexOf('}');
const jsonString = jsContent.substring(startIndex, endIndex + 1);

const VERBAL_QUIZ = JSON.parse(jsonString);

let fixedCount = 0;

if (VERBAL_QUIZ.Move_a_letter && VERBAL_QUIZ.Move_a_letter.questions) {
    VERBAL_QUIZ.Move_a_letter.questions.forEach(q => {
        const literalCorrectLetter = q.correctAnswer;
        // e.g., "E"
        // Find the index of this letter in the options array
        const optionIndex = q.options.indexOf(literalCorrectLetter);

        if (optionIndex !== -1) {
            // Map index to A, B, C, D, E
            const newCorrectAnswer = String.fromCharCode(65 + optionIndex);
            if (q.correctAnswer !== newCorrectAnswer) {
                q.correctAnswer = newCorrectAnswer;
                fixedCount++;
            }
        } else {
            console.log(`Warning: Correct letter ${literalCorrectLetter} not found in options for question ${q.id}`);
        }
    });
}

if (fixedCount > 0) {
    console.log(`Fixed ${fixedCount} Move a letter questions. Saving...`);
    const newJsonString = JSON.stringify(VERBAL_QUIZ, null, 2);
    // Maintain the export wrapper
    const newJsContent = `export const VERBAL_QUIZ = ${newJsonString};\n`;
    fs.writeFileSync(verbalPath, newJsContent, 'utf8');
    console.log('Saved successfully!');
} else {
    console.log('No questions needed fixing.');
}
