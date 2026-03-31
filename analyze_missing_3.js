const fs = require('fs');
const content = fs.readFileSync('data/verbal.js', 'utf8');

const regex = /\{"id":"Missing_letter_(1|2|160|161|168)","question":"[^"]+","key":null,"options":\[[^\]]+\],"correctAnswer":"[^"]+"\}/g;
let match;
while ((match = regex.exec(content)) !== null) {
    console.log(match[0]);
}
