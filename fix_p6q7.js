const fs = require('fs');
const content = fs.readFileSync('data/maths.js', 'utf8');

let count = 0;
const newContent = content.replace(/("id":\s*"P6Q7_\d+",[\s\S]*?"options":\s*\[)([\s\S]*?)(\])/g, (match, prefix, options, suffix) => {
    // Replace the replacement character  with degree symbol °
    // Also handle possible spaces before it.
    let newOptions = options.replace(/ \ufffd/g, '°').replace(/\ufffd/g, '°').replace(/ \?/g, '°');
    if (newOptions !== options) {
        count++;
    }
    return prefix + newOptions + suffix;
});

if (count > 0) {
    fs.writeFileSync('data/maths.js', newContent, 'utf8');
    console.log(`Replaced degree symbols in ${count} P6Q7 questions.`);
} else {
    console.log('No matches found for  in P6Q7.');
}
