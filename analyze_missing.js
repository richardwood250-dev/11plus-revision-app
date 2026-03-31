const fs = require('fs');
const content = fs.readFileSync('data/verbal.js', 'utf8');

// The file format has 'Move a letter' etc. Let's find 'Missing letter' array.
const missingLetterStart = content.indexOf('"Missing letter"');
if (missingLetterStart === -1) {
    console.log("Could not find 'Missing letter'");
    process.exit(1);
}

const objStart = content.lastIndexOf('{', missingLetterStart);
const dbStr = content.substring(objStart, content.indexOf(']}', missingLetterStart) + 2);

try {
    const rawMatch = content.match(/"Missing_letter_\d+","question":"([^"]+)","key":null,"options":\[([^\]]+)\],"correctAnswer":"([A-E])"/g);
    let errorCount = 0;

    console.log("Found " + (rawMatch ? rawMatch.length : 0) + " questions.");

    // We cannot easily know the English dictionary dynamically.
    // However, we observed that for 160-167 the intended answer "B" isn't in the options.
    // Are there any cases where the literal correct letter is NOT in the options?

} catch (e) {
    console.error(e);
}
