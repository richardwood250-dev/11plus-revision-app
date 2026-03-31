const fs = require('fs');
const quiz = require('./temp_verbal');

const m3l = quiz.M3L.questions;

function expand(text) {
    let q = text.replace("Fill in the blank: ", "").replace("Find the missing letters: ", "").trim();
    if (q === "Question") return "Find the missing letters.";

    let words = q.split(/\s+/);

    if (words.length <= 2 && words.length > 0) {
        let lowerQ = q;
        let first = words[0].toLowerCase();

        // Capitalization
        if (!['I', 'Italian', 'English', 'Pacific', 'Egypt', 'African', 'Mars', 'August', 'October', 'December', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday', "Don't", "Let's"].includes(words[0])) {
            lowerQ = first + " " + words.slice(1).join(" ");
        }

        if (['go', 'walk', 'sit', 'drink', 'eat', 'look', 'take', 'make', 'do', 'play', 'boil', 'suck', 'swallow', 'wrap', 'stick', 'keep'].includes(first)) {
            return "Please " + lowerQ;
        } else if (['don\'t', 'please', 'let\'s'].includes(first)) {
            return "Now " + lowerQ;
        } else if (['my', 'the', 'a', 'an', 'this', 'that', 'his', 'her', 'our', 'their'].includes(first)) {
            return "Look at " + lowerQ;
        } else if (['very'].includes(first)) {
            return "It is " + lowerQ;
        } else if (['what', 'where', 'when', 'why', 'how'].includes(first)) {
            return "Tell me " + lowerQ;
        } else if (['at', 'in', 'on', 'under'].includes(first)) {
            return "It is " + lowerQ;
        } else {
            return "Look at the " + lowerQ;
        }
    }
    return q;
}

let changed = 0;
quiz.M3L.questions = m3l.map(q => {
    const oldQ = q.question;
    const newQ = expand(oldQ);
    if (oldQ !== newQ) changed++;
    q.question = newQ;
    return q;
});

const fileContent = "export const VERBAL_QUIZ = " + JSON.stringify(quiz) + ";\n";
fs.writeFileSync('data/verbal.js', fileContent);

console.log(`Updated ${changed} questions in data/verbal.js`);
