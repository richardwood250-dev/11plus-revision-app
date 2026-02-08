const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../data/maths.csv');
const rawData = fs.readFileSync(csvPath, 'utf8');

const parseCSV = (text) => {
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
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && text[i + 1] === '\n') {
                i++;
            }
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
};

function fieldsToCSVLine(fields) {
    return fields.map(field => {
        // If field contains comma, quote, or newline, escape it
        if (/[,|"\n\r]/.test(field)) {
            // escape quotes
            const escaped = field.replace(/"/g, '""');
            return `"${escaped}"`;
        }
        return field;
    }).join(',');
}

function parseArea(valStr) {
    if (!valStr) return null;
    const match = valStr.match(/(\d+)\s*(cm|m)/i);
    if (!match) return null;
    let val = parseInt(match[1]);
    let unit = match[2].toLowerCase();

    let normalized = val;
    if (unit === 'm') normalized = val * 10000;

    return { val, unit, normalized };
}

function boostValue(valStr, targetNormalized) {
    const parsed = parseArea(valStr);
    if (!parsed) return valStr;

    if (parsed.normalized > targetNormalized) return valStr;

    if (targetNormalized >= 10000) {
        let targetM = Math.floor(targetNormalized / 10000);
        let newM = targetM + 2;
        return `${newM} m²`;
    } else {
        let newCm = targetNormalized + 5;
        return `${newCm} cm²`;
    }
}

const allRows = parseCSV(rawData);
let modifyCount = 0;

// Modify rows in place
for (let i = 0; i < allRows.length; i++) {
    const fields = allRows[i];
    // Skip empty rows
    if (fields.length === 0 || (fields.length === 1 && !fields[0])) continue;

    const ref = fields[fields.length - 1];
    if (!ref || !ref.startsWith('P4Q36')) continue;

    if (fields.length < 8) continue; // Safety check

    const correctText = fields[7];
    const correctObj = parseArea(correctText);

    if (!correctObj) continue;

    const optionIndices = [2, 3, 4, 5, 6];
    let modified = false;
    let keepCorrectOne = false;

    optionIndices.forEach(idx => {
        if (fields[idx] === correctText) {
            if (!keepCorrectOne) {
                keepCorrectOne = true;
                return;
            }
        }

        const currentObj = parseArea(fields[idx]);
        if (!currentObj) return;

        if (currentObj.normalized <= correctObj.normalized) {
            const newText = boostValue(fields[idx], correctObj.normalized);
            if (newText !== fields[idx]) {
                fields[idx] = newText;
                modified = true;
            }
        }
    });

    if (modified) {
        modifyCount++;
    }
}

// Write back
const outputParts = allRows.map(fieldsToCSVLine);
fs.writeFileSync(csvPath, outputParts.join('\n'));
console.log(`Modified ${modifyCount} rows in maths.csv for P4Q36.`);
