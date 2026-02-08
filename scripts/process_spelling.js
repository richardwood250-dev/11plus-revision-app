const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'spelling_raw.csv');
const rawData = fs.readFileSync(csvPath, 'utf8');

// CSV Parser
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const row = [];
        let inQuotes = false;
        let currentValue = '';

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                if (j + 1 < line.length && line[j + 1] === '"') {
                    currentValue += '"';
                    j++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        row.push(currentValue);
        rows.push(row);
    }
    return rows;
}

const rows = parseCSV(rawData);
const finalQuestions = [];

// Group into sets of 12
const SET_SIZE = 12;
let currentSetQuestions = [];
let setIndex = 1;

rows.forEach((row, index) => {
    // QuestionID, PartA, PartB, PartC, PartD, CorrectAnswer, Explanation
    if (row.length < 6) return;

    const qId = row[0];
    const parts = [row[1], row[2], row[3], row[4]];
    const correctRaw = row[5].trim().toUpperCase();
    const correctAnswer = correctRaw === 'N' ? 'E' : correctRaw;
    const explanation = row[6] || "";

    const fullSentence = parts.join(' ');
    // Options: A, B, C, D, No Error
    const options = [...parts, "No Error"];

    currentSetQuestions.push({
        id: qId,
        sentence: fullSentence,
        options: options,
        correctAnswer: correctAnswer,
        explanation: explanation
    });

    // If set is full or last row
    if (currentSetQuestions.length === SET_SIZE || index === rows.length - 1) {
        // Create Passage Text
        const passageText = currentSetQuestions.map((q, i) => `(${i + 1}) ${q.sentence}`).join('\n\n');

        // Add questions to final list
        currentSetQuestions.forEach((q, i) => {
            finalQuestions.push({
                id: q.id,
                passage: passageText, // All share this set's passage
                question: `Question ${i + 1}: Find the error`,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation
            });
        });

        // Reset
        currentSetQuestions = [];
        setIndex++;
    }
});

const fileContent = `export const SPELLING_QUIZ = ${JSON.stringify(finalQuestions, null, 2)};`;

fs.writeFileSync(path.join(__dirname, '../data/spelling.js'), fileContent);
console.log(`Generated ${finalQuestions.length} questions in ${setIndex - 1} sets.`);
