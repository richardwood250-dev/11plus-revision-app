const fs = require('fs');

let content = fs.readFileSync('data/nonverbal.js', 'utf8');
content = content.replace(/export const nonverbal = /, 'module.exports = ');
fs.writeFileSync('nonverbal_temp.cjs', content);

const nonverbal = require('./nonverbal_temp.cjs');

let allStems = new Map();
let duplicates = [];
let totalQuestions = 0;

for (const [quizName, quizData] of Object.entries(nonverbal)) {
    if (!quizData.questions) continue;

    for (const q of quizData.questions) {
        totalQuestions++;
        // Some questions might have multiple images or different structure?
        // Let's handle string images
        if (typeof q.image === 'string') {
            let url = q.image;
            let filename = url.split('/').pop();
            // Optional: trim query params if any
            filename = filename.split('?')[0];
            let stem = filename.split('.')[0];

            // Optionally convert to lowercase to catch case-insensitive matches
            let stemLower = stem.toLowerCase();

            if (allStems.has(stemLower)) {
                duplicates.push({ stem, q1: allStems.get(stemLower), q2: { id: q.id, quiz: quizName } });
            } else {
                allStems.set(stemLower, { id: q.id, quiz: quizName, stem });
            }
        } else if (Array.isArray(q.image)) {
            // Unlikely based on preview but just in case
            for (const url of q.image) {
                let filename = url.split('/').pop().split('?')[0];
                let stem = filename.split('.')[0];
                let stemLower = stem.toLowerCase();
                if (allStems.has(stemLower)) {
                    duplicates.push({ stem, q1: allStems.get(stemLower), q2: { id: q.id, quiz: quizName } });
                } else {
                    allStems.set(stemLower, { id: q.id, quiz: quizName, stem });
                }
            }
        }
    }
}

console.log(`Checked ${totalQuestions} questions.`);
console.log(`Found ${duplicates.length} duplicate stems.`);
if (duplicates.length > 0) {
    fs.writeFileSync('nvr_duplicates.json', JSON.stringify(duplicates, null, 2));
    console.log(`Wrote duplicates to nvr_duplicates.json.\n`);
    // print out first 5 duplicates
    console.log("First 5 duplicates: ", JSON.stringify(duplicates.slice(0, 5), null, 2));
}
