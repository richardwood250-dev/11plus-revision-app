const fs = require('fs');
const quiz = require('./temp_verbal');
const wordsList = JSON.parse(fs.readFileSync('words.json', 'utf8'));

// Convert array to a Set for O(1) lookups
const dict = new Set(wordsList);

const questions = quiz.Missing_letter.questions;
let invalidCount = 0;

for (const q of questions) {
    const text = q.question; // e.g. "THRO [ ? ] AR"
    const match = text.match(/([A-Z]+)\s*\[\s*\?\s*\]\s*([A-Z]+)/i);
    if (!match) {
        console.log(`Failed to parse question: ${text}`);
        continue;
    }
    const left = match[1].toLowerCase();
    const right = match[2].toLowerCase();

    // Map A->0, B->1, etc.
    const letters = "ABCDE";
    const answerIndex = letters.indexOf(q.correctAnswer);
    const assignedLetter = q.options[answerIndex].toLowerCase();

    const word1 = left + assignedLetter;
    const word2 = assignedLetter + right;

    // Check if the assigned letter makes valid words
    if (!dict.has(word1) || !dict.has(word2)) {
        console.log(`\nInvalid: [${q.id}] ${q.question}`);
        console.log(`  Target letter from ${q.correctAnswer}: '${assignedLetter.toUpperCase()}' forms: ${word1.toUpperCase()}, ${word2.toUpperCase()} (Valid? ${dict.has(word1)}, ${dict.has(word2)})`);

        // Find if ANY option works
        let validOptions = [];
        for (let i = 0; i < q.options.length; i++) {
            const optLetter = q.options[i].toLowerCase();
            const w1 = left + optLetter;
            const w2 = optLetter + right;
            if (dict.has(w1) && dict.has(w2)) {
                validOptions.push(`${letters[i]} (${optLetter.toUpperCase()})`);
            }
        }

        // Find if ANY letter A-Z works
        let allValidLetters = [];
        for (let charCode = 97; charCode <= 122; charCode++) {
            const l = String.fromCharCode(charCode);
            const w1 = left + l;
            const w2 = l + right;
            if (dict.has(w1) && dict.has(w2)) {
                allValidLetters.push(l.toUpperCase());
            }
        }

        console.log(`  Working options from choices: ${validOptions.join(', ') || 'None'}`);
        console.log(`  All working letters: ${allValidLetters.join(', ') || 'None'}`);
        invalidCount++;
    }
}

console.log(`\nTotal invalid: ${invalidCount} out of ${questions.length}`);
