const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'vr_compound_raw.csv');
const rawData = fs.readFileSync(csvPath, 'utf8');

// CSV Parser
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const row = [];
        let inQuotes = false;
        let currentValue = '';

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                if (j + 1 < line.length && line[j + 1] === '"') {
                    currentValue += '"';
                    j++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        row.push(currentValue);
        rows.push(row);
    }
    return rows;
}

const rows = parseCSV(rawData);
const finalQuestions = [];

rows.forEach((row, index) => {
    // Question,OptionA,OptionB,OptionC,OptionD,OptionE,Correct Answer,Difficulty
    if (row.length < 8) return;

    const questionText = row[0]; // e.g., "PASS [ ? ] HOLE"
    const options = [row[1], row[2], row[3], row[4], row[5]];
    const correctAnswerText = row[6].trim();

    // Find index of correct answer
    const correctIndex = options.findIndex(opt => opt.trim() === correctAnswerText);
    const correctLetter = ['A', 'B', 'C', 'D', 'E'][correctIndex];

    if (!correctLetter) {
        console.warn(`Could not find correct answer '${correctAnswerText}' in options for question: ${questionText}`);
        return;
    }

    finalQuestions.push({
        id: `VR_Compound_${index + 1}`,
        question: questionText,
        options: options,
        correctAnswer: correctLetter,
        difficulty: row[7] || "Level 1"
    });
});

const fileContent = `export const VR_COMPOUND_QUIZ = ${JSON.stringify(finalQuestions, null, 2)};`;

fs.writeFileSync(path.join(__dirname, '../data/vr_compound.js'), fileContent);
console.log(`Generated ${finalQuestions.length} questions.`);
