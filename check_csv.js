const fs = require('fs');
const csv = fs.readFileSync('data/verbal_csvs/Questions - M3L.csv', 'utf8');
const lines = csv.split(/\r?\n/);
let twoWordLines = lines.filter(line => {
    let q = line.split(',')[0];
    return q && q.trim().split(/\s+/).length <= 2;
});
console.log("CSV Lines count:", lines.length);
console.log("CSV 2-word questions length:", twoWordLines.length);
console.log("Sample 2-word:", twoWordLines.slice(0, 10));
