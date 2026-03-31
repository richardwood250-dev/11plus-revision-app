const fs = require('fs');
const quiz = require('./temp_verbal');
const wordsList = JSON.parse(fs.readFileSync('words.json', 'utf8'));
const dict = new Set(wordsList);

const questions = quiz.Missing_letter.questions;

// Safe, common word set for 11+ level 
// (or just rely on the dictionary but prefer common second words)
const commonSeconds = ["BAR", "CAR", "EAR", "FAR", "GAR", "JAR", "MAR", "OAR", "PAR", "TAR", "WAR", "OOL", "ALE", "OG"];

const letters = "ABCDE";
let fixed = 0;
let removed = [];

const newQuestions = [];

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
        // Valid, keep it.
        newQuestions.push(q);
        continue;
    }

    // Invalid! Try to fix it.
    let bestLetter = null;
    let fallbackLetter = null;

    for (let charCode = 97; charCode <= 122; charCode++) {
        const l = String.fromCharCode(charCode);
        const w1 = left + l;
        const w2 = l + right;
        if (dict.has(w1) && dict.has(w2)) {
            // Found a valid letter. Is the second word common?
            if (commonSeconds.includes(w2.toUpperCase())) {
                bestLetter = l;
                break;
            }
            if (!fallbackLetter) fallbackLetter = l;
        }
    }

    const chosenLetter = bestLetter || fallbackLetter;

    if (chosenLetter) {
        console.log(`Fixing [${q.id}] ${q.question} with letter ${chosenLetter.toUpperCase()} (${left + chosenLetter}, ${chosenLetter + right})`);

        // Put the chosen letter into the options if it's not there.
        // If we replace the answer index option, it works perfectly.
        const upperChar = chosenLetter.toUpperCase();

        let existingIndex = q.options.indexOf(upperChar);
        if (existingIndex === -1) {
            // Replace the assigned wrong letter with the right one
            q.options[answerIndex] = upperChar;
        } else {
            // It was already in the options, just change the correct answer
            q.correctAnswer = letters[existingIndex];
        }

        newQuestions.push(q);
        fixed++;
    } else {
        console.log(`Removing [${q.id}] ${q.question} (No valid letter found)`);
        removed.push(q.id);
    }
}

console.log(`\nFixed: ${fixed}, Removed: ${removed.length}`);

// We'll update the JSON structure 
quiz.Missing_letter.questions = newQuestions;
const fileContent = "export const VERBAL_QUIZ = " + JSON.stringify(quiz) + ";\n";
fs.writeFileSync('data/verbal.js', fileContent);

// Dump removed to file so we can sync the CSV
fs.writeFileSync('removed_missing_letter.json', JSON.stringify(removed));
