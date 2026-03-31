const fs = require('fs');
const content = fs.readFileSync('data/verbal.js', 'utf8');

const regex = /\{"id":"Missing_letter_(\d+)","question":"([A-Z]+) \[ \? \] ([A-Z]+)","key":null,"options":\[([^\]]+)\],"correctAnswer":"([A-E])"\}/g;
let match;
let broken = [];

const validAnswers = ['A', 'B', 'C', 'D', 'E'];

while ((match = regex.exec(content)) !== null) {
    const id = parseInt(match[1]);
    const word1 = match[2];
    const word2 = match[3];
    const optsStr = match[4];
    const opts = optsStr.split(',').map(s => s.replace(/"/g, ''));
    const ansIdx = validAnswers.indexOf(match[5]);
    const letter = opts[ansIdx];

    // We can't automatically verify if word1+letter and letter+word2 are real words.
    // But we can check if they look obviously broken.
    // For example, if letter is one of the generic distractors like E,A,L,P,K
    broken.push({ id, word1, word2, letter, opts, ansRaw: match[5] });
}

// Just dump all of them so I can see which ones are broken
console.log(JSON.stringify(broken, null, 2));
