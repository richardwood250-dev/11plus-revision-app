const fs = require('fs');
const content = fs.readFileSync('data/maths.js', 'utf8');

let count = 0;
const newContent = content.replace(/("id":\s*"P6Q7_\d+",[\s\S]*?\})(\s*,|\s*\])/g, (match, body, suffix) => {
    let newBody = body.replace(/ \ufffd/g, '°').replace(/\ufffd/g, '°').replace(/ \?/g, '°');
    if (newBody !== body) {
        count++;
    }
    return newBody + suffix;
});

if (count > 0) {
    fs.writeFileSync('data/maths.js', newContent, 'utf8');
    console.log(`Replaced degree symbols in ${count} P6Q7 objects.`);
} else {
    console.log('No matches found for  in P6Q7.');
}
