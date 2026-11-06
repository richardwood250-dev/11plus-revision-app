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
    console.log(`Reading Grammar question list from local grammar_raw.csv...`);
    const rawData = fs.readFileSync(path.join(__dirname, 'grammar_raw.csv'), 'utf8');

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

        const correctRaw = row[6].trim().toUpperCase();
        const correctAnswer = correctRaw === 'N' ? 'E' : correctRaw;
        const targetIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }[correctAnswer];

        // Speech Marks & Dialogue Punctuation Heuristic
        // Find closing quote in parts (ends with ' optionally followed by punctuation or punct followed by ')
        const closingQuoteIndex = parts.findIndex(p => {
            const trimmed = p.trim();
            // Don't flag contractions (e.g. don't, can't) as closing speech quotes
            if (trimmed.endsWith("n't")) return false;
            return /['"][.,!?]*$/.test(trimmed);
        });

        if (closingQuoteIndex !== -1) {
            // Restore opening single quote on Part A if missing
            // (Exception: Story_81_RainyWalk line 7 where quote is only in Part D)
            if (!parts[0].trim().match(/^['"]/)) {
                if (!(baseId === 'Story_81_RainyWalk' && lineNum === '7')) {
                    parts[0] = "'" + parts[0];
                }
            }

            // Check if the explanation is specifically testing missing punctuation at the closing speech quote
            const closingLetter = ['A', 'B', 'C', 'D'][closingQuoteIndex];
            const partMatch = (row[7] || "").match(/Part\s+([A-D])/i);
            const targetsDifferentPart = partMatch && partMatch[1].toUpperCase() !== closingLetter;

            const closingWord = parts[closingQuoteIndex].replace(/['"][.,!?]*$/, '').split(/\s+/).pop().replace(/[^a-zA-Z]/g, '').toLowerCase();
            const wordRegex = new RegExp(`\\b${closingWord}\\b`, 'i');
            const isExplTestingClosingPunct = !targetsDifferentPart &&
                /missing (comma|punctuation|question mark|exclamation mark)/i.test(row[7] || "") && 
                (wordRegex.test(row[7] || "") || /speech/i.test(row[7] || ""));

            // If the question is NOT specifically testing the closing speech punctuation:
            if (!isExplTestingClosingPunct) {
                const closingPart = parts[closingQuoteIndex].trim();
                const hasPunctBeforeQuote = /[.,!?]['"]$/.test(closingPart);
                const hasPunctAfterQuote = /['"][.,!?]$/.test(closingPart);
                if (!hasPunctBeforeQuote && !hasPunctAfterQuote && closingPart.endsWith("'")) {
                    parts[closingQuoteIndex] = parts[closingQuoteIndex].replace(/['"]$/, ",'");
                }
            }
        }

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
