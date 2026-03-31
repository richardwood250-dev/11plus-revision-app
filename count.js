const fs = require('fs');
const qs = require('./m3l_questions.json');
const twoWordQs = qs.filter(q => q.question.trim().split(/\s+/).length <= 2);
console.log(`Found ${twoWordQs.length} questions with 2 or fewer words.`);
// Print first 20
console.log(JSON.stringify(twoWordQs.slice(0, 20), null, 2));
