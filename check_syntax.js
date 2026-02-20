const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'maths.js');
let content = fs.readFileSync(filePath, 'utf8');

const prefix = "// Auto-generated\nexport const MATHS_QUIZ = ";
let jsonStr = content.replace(prefix, "").trim();
if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);

let data;
try {
    data = JSON.parse(jsonStr);
} catch (e) {
    console.error("Failed to parse JSON", e);
    process.exit(1);
}

let count = 0;
data.forEach(q => {
    if (q.id && q.id.startsWith('P3Q37_')) {
        count++;
    }
});

console.log(`Found ${count} questions for P3Q37_.`);
