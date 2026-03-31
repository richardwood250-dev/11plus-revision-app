const fs = require('fs');
const qs = require('./m3l_questions.json');

let prefixCount = 0;
let updatedQs = [];

for (let q of qs) {
    let text = q.question;
    if (text.startsWith("Fill in the blank: ")) {
        text = text.replace("Fill in the blank: ", "");
        prefixCount++;
    } else if (text.startsWith("Find the missing letters: ")) {
        text = text.replace("Find the missing letters: ", "");
        prefixCount++;
    }

    if (text === "Question") {
        text = "Find the missing letters.";
    }

    updatedQs.push({
        ...q,
        question: text
    });
}

console.log(`Removed prefixes from ${prefixCount} questions.`);

// Now check length distribution
let lens = {};
let shortCount = 0;
for (let q of updatedQs) {
    let len = q.question.trim().split(/\s+/).length;
    lens[len] = (lens[len] || 0) + 1;
    if (len <= 2) {
        shortCount++;
        console.log(`Short: ${q.question}`);
    }
}

console.log("New length distribution:", lens);
console.log(`Found ${shortCount} questions that are <= 2 words after stripping prefix.`);
