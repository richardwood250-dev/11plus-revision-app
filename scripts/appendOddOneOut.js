const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-nonverbal/refs/heads/main/NVR%20-%20odd%20one%20out%204-3%20-%20Sheet1.csv';
const FILE_PATH = './data/nonverbal.js';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-nonverbal/main/';

const content = fs.readFileSync(FILE_PATH, 'utf-8');
const startIdx = content.indexOf('{');
const endIdx = content.lastIndexOf('}');
const jsonStr = content.substring(startIdx, endIdx + 1);
const data = JSON.parse(jsonStr);

function parseCSVRow(str) {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '"') {
            inQuote = !inQuote;
        } else if (str[i] === ',' && !inQuote) {
            result.push(cur);
            cur = '';
        } else {
            cur += str[i];
        }
    }
    result.push(cur);
    return result.map(s => s.trim());
}

https.get(url, (res) => {
    let csv = '';
    res.on('data', chunk => csv += chunk);
    res.on('end', () => {
        const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
        let added = 0;
        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVRow(lines[i]);
            const id = cols[0];
            const image = cols[1];
            const answer = cols[2];
            const explanation = cols.length > 3 ? cols[3] : '';

            if (!id || !image || !answer) continue;

            if (!data['Odd One Out']) {
                data['Odd One Out'] = { title: "Odd One Out", questions: [] };
            }

            const exists = data['Odd One Out'].questions.find(q => q.id === id);
            if (exists) {
                console.log(`Question ${id} already exists`);
                continue;
            }

            data['Odd One Out'].questions.push({
                id: id,
                question: 'Which figure is the odd one out?',
                image: IMAGE_BASE_URL + encodeURIComponent(image),
                options: ['A', 'B', 'C', 'D', 'E'],
                correctAnswer: answer,
                explanation: explanation
            });
            added++;
        }

        fs.writeFileSync(FILE_PATH, 'export const nonverbal = ' + JSON.stringify(data, null, 2) + ';\n');
        console.log(`Appended ${added} questions successfully!`);
    });
}).on('error', (e) => {
    console.error(e);
});
