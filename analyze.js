const fs = require('fs');
const qs = require('./m3l_questions.json');

const lengthCounts = {};
qs.forEach(q => {
    const words = q.question.trim().split(/\s+/);
    const len = words.length;
    lengthCounts[len] = (lengthCounts[len] || 0) + 1;
});

console.log("Word count distribution:", lengthCounts);

// Let's print some of the short ones (2, 3 words)
const shortQs = qs.filter(q => q.question.trim().split(/\s+/).length <= 3);
console.log(`\nFound ${shortQs.length} questions with <= 3 words.`);
console.log(JSON.stringify(shortQs.slice(0, 20), null, 2));
