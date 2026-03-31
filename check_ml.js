const fs = require('fs');
const csv = fs.readFileSync('data/verbal_csvs/Questions - Missing letter.csv', 'utf8');
const lines = csv.split(/\r?\n/);
let questions = lines.slice(1).map(line => {
    // ID,Question,A,B,C,D,E,Correct Answer,Explanation
    let parts = line.split(',');
    return parts[1]; // The question text
}).filter(q => q);
console.log("Missing letter CSV question count:", questions.length);
console.log("Samples:", questions.slice(0, 10));

let shortQs = questions.filter(q => q.trim().split(/\s+/).length <= 3);
console.log("Short questions (<= 3 words):", shortQs.length);
console.log("Samples:", shortQs.slice(0, 5));
