const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../data/maths.csv');
const rawData = fs.readFileSync(csvPath, 'utf8');
const lines = rawData.split('\n');

function parseCSVLine(line) {
    const chars = line.split('');
    const fields = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    fields.push(currentField.trim());
    return fields;
}

function fieldsToCSVLine(fields) {
    return fields.map(field => {
        if (field.includes(',')) {
            return `"${field}"`;
        }
        return field;
    }).join(',');
}

function calculateDistance(instruction) {
    const matches = instruction.match(/FORWARD (\d+)/g);
    if (!matches) return 0;

    let total = 0;
    matches.forEach(m => {
        const val = parseInt(m.split(' ')[1], 10);
        if (!isNaN(val)) total += val;
    });
    return total;
}

function boostDistance(instruction, targetMin) {
    let currentDist = calculateDistance(instruction);
    if (currentDist > targetMin) return instruction;

    // Aim for target + 1
    const diff = targetMin - currentDist + 1;

    // Find the last FORWARD X
    const lastMatch = instruction.match(/FORWARD (\d+)(?![^]*FORWARD)/);
    if (lastMatch) {
        const oldVal = parseInt(lastMatch[1], 10);
        const newVal = oldVal + diff;

        const lastIndex = instruction.lastIndexOf(`FORWARD ${oldVal}`);
        if (lastIndex !== -1) {
            return instruction.substring(0, lastIndex) +
                `FORWARD ${newVal}` +
                instruction.substring(lastIndex + `FORWARD ${oldVal}`.length);
        }
    }
    return instruction;
}


let modifyCount = 0;
const newLines = lines.map((line) => {
    if (!line.trim()) return line;

    const fields = parseCSVLine(line);

    const ref = fields[fields.length - 1];
    if (!ref || !ref.startsWith('P2Q36')) return line;

    // Maths structure: 0:Q, 1:Img, 2:A, 3:B, 4:C, 5:D, 6:E, 7:Ans
    if (fields.length < 8) return line;

    const correctText = fields[7];
    const correctDist = calculateDistance(correctText);

    const optionIndices = [2, 3, 4, 5, 6];
    let modified = false;
    let keepCorrectOne = false;

    optionIndices.forEach(idx => {
        // If exact match to answer text
        if (fields[idx] === correctText) {
            if (!keepCorrectOne) {
                // Keep the first one we find as the "True Correct Answer"
                keepCorrectOne = true;
                return;
            }
            // If we found another one, it's a duplicate distractor. Treat it as target for boosting.
        }

        const currentDist = calculateDistance(fields[idx]);

        // Boost if <= correctDist
        if (currentDist <= correctDist) {
            const newText = boostDistance(fields[idx], correctDist);
            if (newText !== fields[idx]) {
                fields[idx] = newText;
                modified = true;
            }
        }
    });

    if (modified) {
        modifyCount++;
        return fieldsToCSVLine(fields);
    }

    return line;
});

fs.writeFileSync(csvPath, newLines.join('\n'));
console.log(`Modified ${modifyCount} lines in maths.csv.`);
