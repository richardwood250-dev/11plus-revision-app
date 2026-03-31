const fs = require('fs');
const qs = require('./m3l_questions.json');
const targetQs = qs.filter(q => {
    const len = q.question.trim().split(/\s+/).length;
    // include those > 6 and < 3 words
    return len > 6 || len < 3;
});
fs.writeFileSync('to_shorten.json', JSON.stringify(targetQs, null, 2));
console.log(`Saved ${targetQs.length} questions to shorten.`);
