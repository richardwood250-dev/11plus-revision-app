const fs = require('fs');
let content = fs.readFileSync('data/maths.js', 'utf8');
content = content.replace(/\$cm\^2\$/g, 'cm²');
fs.writeFileSync('data/maths.js', content, 'utf8');
console.log('Replaced all $cm^2$ with cm²');
