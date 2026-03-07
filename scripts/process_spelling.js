const fs = require('fs');
const path = require('path');

const GITHUB_CSV_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-english/main/Questions%20-%20Spelling.csv';

// CSV Parser
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim() && l.includes(','));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
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

async function run() {
    console.log(`Downloading latest Spelling question list from GitHub...`);
    let rawData;
    try {
        const response = await fetch(GITHUB_CSV_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        rawData = await response.text();
    } catch (e) {
        console.error("Failed to fetch Spelling CSV:", e);
        rawData = fs.readFileSync(path.join(__dirname, 'spelling_raw.csv'), 'utf8');
    }

    const rows = parseCSV(rawData);
    const finalQuestions = [];

    const SET_SIZE = 12;
    let currentSetQuestions = [];
    let setIndex = 1;

    let correctionsMade = 0;

    rows.forEach((row, index) => {
        if (row.length < 6) return;

        const qId = row[0];
        const parts = [row[1], row[2], row[3], row[4]];
        let correctRaw = row[5].trim().toUpperCase();
        let correctAnswer = correctRaw === 'N' ? 'E' : correctRaw;
        const explanation = row.length > 6 ? row[6] : "";

        // Dynamic Correct Answer Resolution
        if (correctAnswer !== 'E') {
            let misspelledWord = null;
            const match1 = explanation.match(/Error:\s*'([^']+)'/i);
            const match2 = explanation.match(/'([^']+)'\s+should\s+be/i);

            if (match1) misspelledWord = match1[1];
            else if (match2) misspelledWord = match2[1];

            if (misspelledWord) {
                const letters = ['A', 'B', 'C', 'D'];
                const correctIdx = parts.findIndex(p => p && p.includes(misspelledWord));
                if (correctIdx !== -1) {
                    const dynamicAnswer = letters[correctIdx];
                    if (dynamicAnswer !== correctAnswer) {
                        correctAnswer = dynamicAnswer;
                        correctionsMade++;
                    }
                }
            }
        }

        const fullSentence = parts.join(' ');
        const options = [...parts, "No Error"];

        currentSetQuestions.push({
            id: qId,
            sentence: fullSentence,
            options: options,
            correctAnswer: correctAnswer,
            explanation: explanation
        });

        if (currentSetQuestions.length === SET_SIZE || index === rows.length - 1) {
            const passageText = currentSetQuestions.map((q, i) => `(${i + 1}) ${q.sentence}`).join('\n\n');

            currentSetQuestions.forEach((q, i) => {
                finalQuestions.push({
                    id: q.id,
                    passage: passageText,
                    question: `Question ${i + 1}: Find the error`,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                });
            });

            currentSetQuestions = [];
            setIndex++;
        }
    });

    const fileContent = `export const SPELLING_QUIZ = ${JSON.stringify(finalQuestions, null, 2)};`;
    const destPath = path.join(__dirname, '../data/spelling.js');
    fs.writeFileSync(destPath, fileContent);
    console.log(`Generated ${finalQuestions.length} questions in ${setIndex - 1} sets.`);
    console.log(`Dynamically corrected ${correctionsMade} incorrect answer labels from the CSV.`);
}

run();
