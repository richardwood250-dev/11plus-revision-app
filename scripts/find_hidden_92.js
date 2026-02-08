const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync(path.join(__dirname, '../data/verbal.js'), 'utf8');

// Extract valid JS object string
const start = fileContent.indexOf('{');
const end = fileContent.lastIndexOf('}');

if (start === -1 || end === -1) {
    throw new Error("Could not find object start/end");
}

const jsContent = fileContent.substring(start, end + 1);

// Evaluate the object literal
const data = eval('(' + jsContent + ')');

// Search for the ID in all topics
let found = null;

for (const topic in data) {
    const questions = data[topic].questions;
    if (questions) {
        const q = questions.find(q => q.id === 'Hidden_word_92');
        if (q) {
            found = q;
            break;
        }
    }
}

if (found) {
    console.log("Found Question Content:");
    console.log(JSON.stringify(found, null, 2));
} else {
    console.log("Question Hidden_word_92 not found.");
}
