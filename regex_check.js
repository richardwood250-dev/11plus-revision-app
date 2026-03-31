const quiz = require('./temp_verbal');

let found = 0;
for (const [key, category] of Object.entries(quiz)) {
    for (const q of category.questions) {
        if (q.question) {
            if (/^[a-zA-Z]+ [a-zA-Z]+[?.!]?$/.test(q.question.trim())) {
                console.log(`[${key}] ${q.question}`);
                found++;
            }
        }
    }
}
console.log(`Total found: ${found}`);
