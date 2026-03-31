const fs = require('fs');
const content = fs.readFileSync('data/verbal.js', 'utf8');

const regex = /\{"id":"Missing_letter_(\d+)","question":"([^"]+)","key":null,"options":\[([^\]]+)\],"correctAnswer":"([A-E])"\}/g;

let match;
const broken = [];
const validAnswers = ['A', 'B', 'C', 'D', 'E'];

while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const q = match[2];
    const optsStr = match[3];
    const opts = optsStr.split(',').map(s => s.replace(/"/g, ''));
    const ansIndex = validAnswers.indexOf(match[4]);
    const correctLetterText = opts[ansIndex];

    // Check if the correctLetterText makes sense?
    // Let's just print the first 10 to see.
    if (id <= 5 || (id >= 160 && id <= 165)) {
        console.log(`ID: ${id}, Q: ${q}, AnsIdx: ${ansIndex}, AnsLetter: ${correctLetterText}, Opts: ${opts}`);
    }
}
