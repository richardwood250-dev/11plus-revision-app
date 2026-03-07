const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../data/verbal_csvs/Questions - M3L.csv');
const jsPath = path.join(__dirname, '../data/verbal.js');

// 1. Read and parse CSV safely
const csvContent = fs.readFileSync(csvPath, 'utf8');

function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentVal += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentVal.trim());
            currentVal = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentVal.trim());
            if (currentRow.length > 0 || currentVal !== '') rows.push(currentRow);
            currentRow = [];
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
    }
    return rows;
}

const lines = parseCSV(csvContent);
const questions = [];

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i];
    if (cols.length < 8) continue;

    const id = cols[0];
    const qText = cols[1];
    const options = [cols[2], cols[3], cols[4], cols[5], cols[6]].filter(o => o && o.trim() !== '');
    let correctVal = cols[7];

    let finalCorrectLetter = 'A';
    if (correctVal.length === 1 && "ABCDE".includes(correctVal)) {
        finalCorrectLetter = correctVal;
    } else {
        finalCorrectLetter = correctVal;
    }

    questions.push({
        id: id,
        question: qText,
        key: null,
        options: options,
        correctAnswer: finalCorrectLetter
    });
}

// 2. Read js file, strip BOM
let jsContent = fs.readFileSync(jsPath, 'utf8');
if (jsContent.charCodeAt(0) === 0xFEFF) jsContent = jsContent.slice(1);

// 3. Replace M3L segment
const safeJson = JSON.stringify(questions);
const pattern = /"M3L":\{"title":"M3L","questions":\[(.*?)\]\}/s;

if (pattern.test(jsContent)) {
    const replacement = `"M3L":{"title":"M3L","questions":${safeJson}}`;
    jsContent = jsContent.replace(pattern, replacement);
    fs.writeFileSync(jsPath, jsContent, 'utf8');
    console.log('Successfully re-injected M3L data safely!');
} else {
    console.log('Could not find existing M3L chunk in verbal.js to replace. Checking if it matches without the s flag.');
}
