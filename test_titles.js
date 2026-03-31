const fs = require('fs');
const d = fs.readFileSync('data/verbal.js', 'utf8');
const rx = /title\":\"(.*?)\"/g;
let match;
const titles = [];
while ((match = rx.exec(d)) !== null) {
    titles.push(match[1]);
}
console.log([...new Set(titles)]);
