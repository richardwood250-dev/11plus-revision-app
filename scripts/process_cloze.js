const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'cloze_raw.csv');
const rawData = fs.readFileSync(csvPath, 'utf8');

// Simple CSV parser that handles quoted fields
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(','); // Assuming simple headers for now, but we know them

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
                    // Double quote escape
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

// Groups
const passages = {};

rows.forEach(row => {
    // Indexes based on: Passage Title,Question ID,Sentence Context,Option A,Option B,Option C,Option D,Option E,Correct Answer
    const title = row[0];
    const qId = row[1];
    const sentence = row[2];
    const opts = [row[3], row[4], row[5], row[6], row[7]];
    const ans = row[8].trim(); // Letter A-E

    if (!passages[title]) {
        passages[title] = {
            title: title,
            sentences: [],
            questions: []
        };
    }

    passages[title].sentences.push(sentence);

    passages[title].questions.push({
        id: title.replace(/\s+/g, '') + '_' + qId,
        qNum: qId,
        options: opts,
        correctAnswer: ans
    });
});

// Construct Output
const finalQuestions = [];

Object.values(passages).forEach(p => {
    // Reconstruct full text
    // The sentences are sequential (1, 2, 3...) based on input order.
    // They seem to be formatted to just flow.
    const fullText = p.sentences.join(' ');

    p.questions.forEach(q => {
        finalQuestions.push({
            id: q.id,
            passage: fullText, // All questions share the same full text
            question: `(${q.qNum}) Choose the missing word:`,
            options: q.options,
            correctAnswer: q.correctAnswer
        });
    });
});

const fileContent = `export const CLOZE_QUIZ = ${JSON.stringify(finalQuestions, null, 2)};`;

fs.writeFileSync(path.join(__dirname, '../data/cloze.js'), fileContent);
console.log(`Generated ${finalQuestions.length} questions from ${Object.keys(passages).length} passages.`);
