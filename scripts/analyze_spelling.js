const fs = require('fs');

const data = fs.readFileSync('scripts/spelling_raw.csv', 'utf8');
const lines = data.split('\n').filter(l => l.trim());

// Simple CSV parser
function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    if (currentRow.length > 0 || currentField) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }
    return rows;
}

const rows = parseCSV(data);

let matches = 0;
let totalErrors = 0;
let falseNegatives = 0;

for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 6) continue;

    // row[0]=ID, 1=A, 2=B, 3=C, 4=D, 5=Correct, 6=Expl
    const correctRaw = row[5];
    const exp = row.length > 6 ? row[6] : "";

    if (correctRaw !== 'N' && correctRaw !== 'E') {
        totalErrors++;
        const match = exp.match(/Error:\s*'([^']+)'/i);
        if (match) {
            const word = match[1];
            const parts = [row[1], row[2], row[3], row[4]];
            const letters = ['A', 'B', 'C', 'D'];
            const correctIdx = parts.findIndex(p => p && p.includes(word));
            if (correctIdx !== -1) {
                matches++;
                if (letters[correctIdx] !== correctRaw) {
                    falseNegatives++;
                    // console.log(`Mismatch! CSV says ${correctRaw}, but word "${word}" is in Part ${letters[correctIdx]}`);
                }
            } else {
                console.log('Word not found explicitly:', word, 'in parts:', parts, 'exp:', exp);
            }
        } else {
            console.log('No regex match for explanation:', exp);
        }
    }
}

console.log(`Matched ${matches} out of ${totalErrors} errors.`);
console.log(`Discrepancies found (CSV wrong): ${falseNegatives}`);
