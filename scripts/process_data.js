const fs = require('fs');
const path = require('path');

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/main/';

const parseCSV = (text) => {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            // Handle CRLF
            if (char === '\r' && text[i + 1] === '\n') {
                i++;
            }
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    // Push last row if exists
    if (currentRow.length > 0 || currentField) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }
    return rows;
};

const processData = (subject) => {
    const isMaths = subject === 'maths';
    const inputFile = isMaths ? 'data/maths.csv' : 'data/english_comprehension.csv';
    const outputFile = isMaths ? 'data/maths.js' : 'data/english.js';

    if (!fs.existsSync(path.join(__dirname, `../${inputFile}`))) {
        console.log(`Skipping ${subject}: Input file not found.`);
        return;
    }

    const rawData = fs.readFileSync(path.join(__dirname, `../${inputFile}`), 'utf8');
    const allRows = parseCSV(rawData);

    // Skip header
    const questions = [];

    for (let i = 1; i < allRows.length; i++) {
        const fields = allRows[i];
        if (fields.length < 5) continue;

        let qObj = {};

        if (isMaths) {
            // Maths: Question, Image, OpA, OpB, OpC, OpD, OpE, Answer, Difficulty, Topic, Type, Ref
            // Ensure enough fields for maths
            if (fields.length < 8) continue;
            const [question, imageUrl, opA, opB, opC, opD, opE, answer, diff, topic, type, ref] = fields;

            // ... (Maths logic same as before)
            let difficultyIndex = parseInt(diff, 10);
            let prefix = "";
            if (ref) {
                const parts = ref.split('_');
                if (parts.length > 1) {
                    prefix = ref.substring(0, 5);
                }
            }
            let finalImage = null;
            if (imageUrl && imageUrl.length > 4) finalImage = `${GITHUB_BASE_URL_MATHS}${imageUrl.toLowerCase()}`;

            qObj = {
                id: ref || `m_${i}`,
                question: question.replace(/^"|"$/g, ''),
                image: finalImage,
                options: [opA, opB, opC, opD, opE].filter(o => o),
                correctAnswer: answer,
                topic: topic || "General",
                difficultyIndex: isNaN(difficultyIndex) ? 1 : difficultyIndex,
                prefix: prefix
            };

        } else {
            // English: Ref, Question, OpA, OpB, OpC, OpD, OpE, Answer, PassageFile
            const [ref, question, opA, opB, opC, opD, opE, answer, passageFile] = fields;

            let passageText = null;
            if (passageFile && passageFile.trim()) {
                const txtPath = path.join(__dirname, `../data/${passageFile.trim()}`);
                if (fs.existsSync(txtPath)) {
                    passageText = fs.readFileSync(txtPath, 'utf8');
                }
            }

            qObj = {
                id: ref || `e_${i}`,
                question: question.replace(/^"|"$/g, ''),
                options: [opA, opB, opC, opD, opE].filter(o => o),
                correctAnswer: answer,
                topic: "Comprehension",
                passage: passageText,
                difficultyIndex: 1, // Default for now
                prefix: ref ? ref.split('Q')[0] : "GEN" // e.g. T1
            };
        }

        questions.push(qObj);
    }

    const varName = isMaths ? 'MATHS_QUIZ' : 'ENGLISH_QUIZ';
    // Use specific base URL depending on subject? ideally passed in but keeping simple
    const outputContent = `// Auto-generated
export const ${varName} = ${JSON.stringify(questions, null, 2)};
`;

    fs.writeFileSync(path.join(__dirname, `../${outputFile}`), outputContent);
    console.log(`Processed ${subject}: ${questions.length} questions.`);
};

// Run for both
const GITHUB_BASE_URL_MATHS = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/main/';
processData('maths');
processData('english');
