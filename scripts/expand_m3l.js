const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/verbal_csvs/Questions - M3L.csv');
const text = fs.readFileSync(filePath, 'utf8');

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

const rows = parseCSV(text);

function escapeCSV(val) {
    if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
}

const prefixes = [
    "Complete the word:",
    "Find the missing letters:",
    "Solve this puzzle:",
    "Fill in the blank:"
];

let changed = 0;

for (let i = 0; i < rows.length; i++) {
    // skip header maybe?
    // Looking at the csv from previous output: M3L_NEW_632,Last K.,MET,WEE,... 
    // It doesn't seem to have a header row if it starts with M3L_NEW.

    if (rows[i].length > 1) {
        const questionStr = rows[i][1];
        if (questionStr && questionStr !== 'Question' && !questionStr.startsWith('Complete the word:') && !questionStr.startsWith('Find the missing') && !questionStr.startsWith('Solve this puzzle:') && !questionStr.startsWith('Fill in the blank:')) {
            const wordCount = questionStr.split(/\s+/).filter(w => w.length > 0).length;
            if (wordCount < 4) {
                // Select a prefix that makes the sentence 3-7 words.
                const validPrefixes = prefixes.filter(p => {
                    const pWords = p.split(/\s+/).length;
                    const total = pWords + wordCount;
                    return total >= 3 && total <= 7;
                });

                if (validPrefixes.length > 0) {
                    const prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
                    rows[i][1] = `${prefix} ${questionStr}`;
                    changed++;
                }
            }
        }
    }
}

const outputCSV = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
fs.writeFileSync(filePath, outputCSV);

console.log(`Updated ${changed} questions in Questions - M3L.csv`);
