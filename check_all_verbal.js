const quiz = require('./temp_verbal');
for (const [key, category] of Object.entries(quiz)) {
    const qs = category.questions;
    let twoWordCount = 0;
    for (const q of qs) {
        if (q.question) {
            const words = q.question.trim().split(/\s+/);
            if (words.length === 2 && !q.question.includes('(')) {
                twoWordCount++;
            }
        }
    }
    if (twoWordCount > 0) {
        console.log(`Category ${key} has ${twoWordCount} questions with exactly 2 words.`);
    }
}
