const fs = require('fs');
const quiz = require('./temp_verbal');
const wordsList = JSON.parse(fs.readFileSync('words.json', 'utf8'));
const dict = new Set(wordsList);

const questions = quiz.Missing_letter.questions;
const letters = "ABCDE";

const newQuestions = [];
const removedIds = new Set();

for (const q of questions) {
    const text = q.question;
    const match = text.match(/([A-Z]+)\s*\[\s*\?\s*\]\s*([A-Z]+)/i);
    if (!match) {
        newQuestions.push(q);
        continue;
    }
    const left = match[1].toLowerCase();
    const right = match[2].toLowerCase();

    const answerIndex = letters.indexOf(q.correctAnswer);
    let assignedLetter = q.options[answerIndex].toLowerCase();

    const word1 = left + assignedLetter;
    const word2 = assignedLetter + right;

    if (dict.has(word1) && dict.has(word2)) {
        newQuestions.push(q);
    } else {
        removedIds.add(q.id);
    }
}

console.log(`Removing ${removedIds.size} questions from verbal.js`);

quiz.Missing_letter.questions = newQuestions;
const fileContent = "export const VERBAL_QUIZ = " + JSON.stringify(quiz) + ";\n";
fs.writeFileSync('data/verbal.js', fileContent);

// Also remove from CSV
let csv = fs.readFileSync('data/verbal_csvs/Questions - Missing letter.csv', 'utf8');
const lines = csv.split(/\r?\n/);
const newLines = lines.filter(line => {
    let id = line.split(',')[0];
    return !removedIds.has(id);
});

fs.writeFileSync('data/verbal_csvs/Questions - Missing letter.csv', newLines.join('\n'));
console.log(`Removed from CSV. Remaining: ${newLines.length - 1}`);

// Now also let's check one more thing: that we actually removed them
console.log(`Removed IDs: ${Array.from(removedIds).join(', ')}`);
