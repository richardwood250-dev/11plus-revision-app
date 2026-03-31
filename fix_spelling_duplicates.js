const fs = require('fs');

const inputFile = 'data/spelling.js';
const outputFile = 'data/spelling.js';

let content = fs.readFileSync(inputFile, 'utf8');
let dataStr = content.replace('export const SPELLING_QUIZ = ', '').replace(/;$/, '');
let data = JSON.parse(dataStr);

// Group by passage
let groups = {};
for (let q of data) {
    if (!groups[q.passage]) {
        groups[q.passage] = [];
    }
    groups[q.passage].push(q);
}

let newData = [];

for (let passage in groups) {
    let group = groups[passage];
    let originalLines = passage.split('\n\n');
    let toRemoveIndices = []; // 0-based indexing for lines to remove

    // Determine which lines to remove
    let validGroup = [];
    for (let q of group) {
        if (q.explanation && q.explanation.includes('Error needed')) {
            // Find what sentence number this is based on its question string
            let match = q.question.match(/Question (\d+):/);
            if (match) {
                let sentenceNumber = parseInt(match[1]);
                toRemoveIndices.push(sentenceNumber - 1);
            }
        } else {
            validGroup.push(q);
        }
    }

    if (toRemoveIndices.length > 0) {
        // Rebuild passage
        let currentLine = 1;
        let newLines = [];
        let indexMap = {}; // Maps old 1-based index to new 1-based index
        for (let i = 0; i < originalLines.length; i++) {
            if (!toRemoveIndices.includes(i)) {
                // Keep this line, replace its prefix (X) with (currentLine)
                let cleanedLine = originalLines[i].replace(/^\(\d+\)\s/, `(${currentLine}) `);
                newLines.push(cleanedLine);
                indexMap[i + 1] = currentLine;
                currentLine++;
            }
        }
        let newPassage = newLines.join('\n\n');

        // Update questions in validGroup
        for (let q of validGroup) {
            let match = q.question.match(/Question (\d+):/);
            if (match) {
                let oldNum = parseInt(match[1]);
                let newNum = indexMap[oldNum];
                if (newNum !== undefined) {
                    q.question = q.question.replace(`Question ${oldNum}:`, `Question ${newNum}:`);
                }
            }
            q.passage = newPassage;
        }
    }
    
    // add to newData
    newData.push(...validGroup);
}

let newContent = 'export const SPELLING_QUIZ = ' + JSON.stringify(newData, null, 2) + ';\n';
fs.writeFileSync(outputFile, newContent);
console.log(`Original size: ${data.length}, New size: ${newData.length}`);
