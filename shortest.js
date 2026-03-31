const fs = require('fs');
const qs = require('./m3l_questions.json');
const q = qs.find(q => q.question.split(' ').length <= 2);
console.log(q);
const twoWord = qs.filter(q => q.question.trim().split(/\s+/).length <= 2);
console.log(twoWord);
// Print all questions to see if there are any that look like 2 words
console.log("Printing 100 shortest questions by character length:");
qs.sort((a, b) => a.question.length - b.question.length);
console.log(qs.slice(0, 100).map(q => q.question));
