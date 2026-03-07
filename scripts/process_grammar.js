const fs = require('fs');
const path = require('path');

const GITHUB_CSV_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-english/main/Questions%20-%20Grammar.csv';

// CSV Parser
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim() && l.includes(','));
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

async function run() {
    console.log(`Downloading latest Grammar question list from GitHub...`);
    let rawData;
    try {
        const response = await fetch(GITHUB_CSV_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        rawData = await response.text();
    } catch (e) {
        console.error("Failed to fetch Grammar CSV:", e);
        // Fallback to local if fetch fails
        rawData = fs.readFileSync(path.join(__dirname, 'grammar_raw.csv'), 'utf8');
    }

    const rows = parseCSV(rawData);
    const passages = {};

    rows.forEach(row => {
        // PassageID, LineNum, PartA, PartB, PartC, PartD, CorrectAnswer, Explanation
        if (row.length < 7) return;

        const rawId = row[0];
        if (!rawId) return;

        // Strip suffixes like _Fix, _Rev, _v2, etc., so they overwrite the original question
        const baseId = rawId.replace(/_(Fix|Rev|v2|Corr).*$/i, '');
        const lineNum = row[1];

        // PartA to PartD
        let parts = [row[2], row[3], row[4], row[5]];

        // Speech Marks Heuristic
        // If the passage contains a trailing single quote, ensure an opening one exists.
        // E.g. part ends with ' or '! or ',
        const containsClosingQuote = parts.some(p => {
            const trimmed = p.trim();
            // Don't flag contractions as closing quotes
            if (trimmed.endsWith("n't") || trimmed.endsWith("s'")) return false;
            return trimmed.match(/['][.,!?]*$/);
        });

        if (containsClosingQuote) {
            // Check if first part actually starts with a single quote or has a quote inside
            if (!parts[0].trim().match(/^['"]/)) {
                parts[0] = "'" + parts[0];
            }
        }

        const correctRaw = row[6].trim().toUpperCase();
        const correctAnswer = correctRaw === 'N' ? 'E' : correctRaw;

        // Add "No Error" to the options
        const options = [...parts, "No Error"];

        if (!passages[baseId]) {
            passages[baseId] = {
                id: baseId,
                lines: {},
                questions: {}
            };
        }

        const lineText = parts.join(' ');
        // Overwrite the line to keep the latest fix
        passages[baseId].lines[lineNum] = `(${lineNum}) ${lineText}`;

        // Overwrite the question to keep the latest fix
        passages[baseId].questions[lineNum] = {
            id: `${baseId}_${lineNum}`,
            lineNum: parseInt(lineNum),
            question: `Line ${lineNum}: Find the error`,
            options: options,
            correctAnswer: correctAnswer,
            explanation: row[7] || ""
        };
    });

    const finalQuestions = [];

    Object.values(passages).forEach(p => {
        const sortedLineNums = Object.keys(p.lines).sort((a, b) => parseInt(a) - parseInt(b));
        const fullText = sortedLineNums.map(n => p.lines[n]).join('\n\n');

        const sortedQuestionNums = Object.keys(p.questions).sort((a, b) => parseInt(a) - parseInt(b));
        sortedQuestionNums.forEach(qn => {
            const q = p.questions[qn];
            finalQuestions.push({
                id: q.id,
                passage: fullText,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation
            });
        });
    });

    const fileContent = `export const GRAMMAR_QUIZ = ${JSON.stringify(finalQuestions, null, 2)};`;
    const destPath = path.join(__dirname, '../data/grammar.js');
    fs.writeFileSync(destPath, fileContent);
    console.log(`Generated ${finalQuestions.length} questions from ${Object.keys(passages).length} passages.`);
    console.log(`Written to ${destPath}`);
}

run();
