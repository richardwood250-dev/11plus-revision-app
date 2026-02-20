const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'maths.js');

let content = fs.readFileSync(filePath, 'utf8');

// The file starts with:
// // Auto-generated
// export const MATHS_QUIZ = [

const prefix = "// Auto-generated\nexport const MATHS_QUIZ = ";
let jsonStr = content.replace(prefix, "").trim();
// Remove trailing semicolon if exists
if (jsonStr.endsWith(';')) {
    jsonStr = jsonStr.slice(0, -1);
}

let data;
try {
    data = JSON.parse(jsonStr);
} catch (e) {
    console.error("Failed to parse JSON", e);
    process.exit(1);
}

let fixedCount = 0;

function toPlainString(num) {
    return ('' + +num).replace(/(-?)(\d*)\.?(\d+)e([+-]\d+)/,
        function (a, b, c, d, e) {
            return e < 0
                ? b + '0.' + Array(1 - e - c.length).join('0') + c + d
                : b + c + d + Array(e - d.length + 1).join('0');
        });
}

// Check P3Q27 questions
data.forEach(q => {
    if (q.id && q.id.startsWith('P3Q27_')) {
        let optionsChanged = false;
        q.options = q.options.map(opt => {
            if (typeof opt === 'string' && opt.includes('e-')) {
                // e.g. "4.56e-06 km"
                const parts = opt.split(' ');
                if (parts.length === 2 && !isNaN(Number(parts[0]))) {
                    const newOpt = toPlainString(Number(parts[0])) + " " + parts[1];
                    console.log(`Fixing option: ${opt} -> ${newOpt}`);
                    optionsChanged = true;
                    return newOpt;
                }
            }
            return opt;
        });

        if (typeof q.correctAnswer === 'string' && q.correctAnswer.includes('e-')) {
            const parts = q.correctAnswer.split(' ');
            if (parts.length === 2 && !isNaN(Number(parts[0]))) {
                q.correctAnswer = toPlainString(Number(parts[0])) + " " + parts[1];
                console.log(`Fixing answer: ${q.correctAnswer}`);
                optionsChanged = true;
            }
        }

        // Let's also verify question syntax. If there's any typo or weird characters.
        if (q.question.includes('e-')) {
            console.log(`Found e- in question: ${q.question}`);
        }

        if (optionsChanged) {
            fixedCount++;
        }
    }
});

console.log(`Fixed ${fixedCount} questions.`);

if (fixedCount > 0) {
    const newContent = prefix + JSON.stringify(data, null, 2) + ";\n";
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("maths.js has been updated.");
} else {
    console.log("No questions needed fixing.");
}

