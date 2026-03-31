const fs = require('fs');
const path = require('path');
const data = require('./data/verbal_temp.cjs');

console.log("Loading dictionary...");
const dictionaryText = fs.readFileSync('words.txt', 'utf8');
const wordsSet = new Set(dictionaryText.split(/\r?\n/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0));

console.log(`Loaded ${wordsSet.size} words.`);

const questions = data["Move_a_letter"] ? data["Move_a_letter"].questions : [];
console.log(`Checking ${questions.length} Move a letter questions...`);

const letterIndexMap = {
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4,
    'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14,
    'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
    'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};

function checkQuestion(q) {
    // e.g. "BEARD & RIVE"
    const parts = q.question.split('&').map(s => s.trim());
    if (parts.length !== 2) {
        console.error(`Invalid structure for: ${q.id} -> ${q.question}`);
        return null;
    }

    const word1 = parts[0];
    const word2 = parts[1];

    let validMoves = [];

    // A "move" means taking a letter from word1 and inserting it into word2
    // We check each option in q.options
    for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
        const letterToMove = q.options[optIdx];

        // Check if letterToMove is in word1
        const idxInWord1 = word1.indexOf(letterToMove);
        if (idxInWord1 === -1) {
            continue; // Not a valid letter to take from word1
        }

        // Construct new word1
        const newWord1 = word1.slice(0, idxInWord1) + word1.slice(idxInWord1 + 1);

        // Check if newWord1 is valid
        if (!wordsSet.has(newWord1)) {
            continue; // Taking this letter makes word1 invalid
        }

        // Check if letterToMove can be inserted anywhere in word2 to make a valid word
        let word2ValidList = [];
        for (let i = 0; i <= word2.length; i++) {
            const newWord2Candidate = word2.slice(0, i) + letterToMove + word2.slice(i);
            if (wordsSet.has(newWord2Candidate)) {
                word2ValidList.push(newWord2Candidate);
            }
        }

        if (word2ValidList.length > 0) {
            const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C...
            validMoves.push({
                optionIdx: optIdx,
                optionLetter: optionLetter,
                letter: letterToMove,
                newWord1: newWord1,
                newWord2Options: word2ValidList
            });
        }
    }

    return validMoves;
}

let multipleOrZeroCorrect = [];

for (const q of questions) {
    const validMoves = checkQuestion(q);
    if (!validMoves) continue;

    if (validMoves.length !== 1) {
        multipleOrZeroCorrect.push({
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswerWas: q.correctAnswer,
            validMovesFound: validMoves
        });
    }
}

console.log(`Found ${multipleOrZeroCorrect.length} questions with 0 or >1 correct answers.`);
fs.writeFileSync('multiple_correct.json', JSON.stringify(multipleOrZeroCorrect, null, 2));

const q186_info = multipleOrZeroCorrect.find(m => m.id === 'Move_a_letter_186');
if (q186_info) {
    console.log("Question 186 issue info:", JSON.stringify(q186_info, null, 2));
} else {
    // Maybe it wasn't caught as multiple? let's run just 186
    const q186 = questions.find(q => q.id === 'Move_a_letter_186');
    console.log("Q186 passed perfectly? Valid moves:", JSON.stringify(checkQuestion(q186), null, 2));
}

