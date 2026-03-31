const fs = require('fs');
const qs = require('./m3l_questions.json');

function expand(text) {
    let q = text.replace("Fill in the blank: ", "").replace("Find the missing letters: ", "").trim();
    if (q === "Question") return "Find the missing letters.";

    let words = q.split(/\s+/);
    if (words.length <= 3 && words.length > 0) {
        let lowerQ = q;
        let first = words[0].toLowerCase();

        // Don't lower case these
        if (!['I', 'Italian', 'English', 'Pacific', 'Egypt', 'African', 'Mars', 'August', 'October', 'December', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday', "Don't", "Let's"].includes(words[0])) {
            lowerQ = first + " " + words.slice(1).join(" ");
        }

        if (['go', 'walk', 'sit', 'drink', 'eat', 'look', 'take', 'make', 'do', 'play', 'boil', 'suck', 'swallow', 'wrap', 'stick', 'keep', 'wash', 'shut', 'press', 'watch', 'change'].includes(first)) {
            return "We can " + lowerQ;
        } else if (['don\'t', 'please', 'let\'s'].includes(first)) {
            return "Now " + lowerQ;
        } else if (['my', 'the', 'a', 'an', 'this', 'that', 'his', 'her', 'our', 'their'].includes(first)) {
            return "Look at " + lowerQ;
        } else if (['very'].includes(first)) {
            return "It is " + lowerQ;
        } else if (['what', 'where', 'when', 'why', 'how'].includes(first)) {
            return "I see " + lowerQ;
        } else if (['at', 'in', 'on', 'under'].includes(first)) {
            return "It is " + lowerQ;
        } else {
            return "I like the " + lowerQ;
        }
    }
    return q;
}

let count = 0;
for (let q of qs) {
    let e = expand(q.question);
    if (e !== q.question) {
        if (count < 20) console.log(`Old: ${q.question} \nNew: ${e}\n`);
        count++;
    }
}
console.log(`Will update ${count} out of ${qs.length} questions.`);
