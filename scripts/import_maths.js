const fs = require('fs');
const path = require('path');
// const csv = require('csv-parse/sync'); // Removed dependency

const CSV_FILE_PATH = path.join(__dirname, '../data/maths_import.csv');
const TARGET_JS_FILE_PATH = path.join(__dirname, '../data/maths.js');

function parseCSV() {
    return parseCSV_custom();
    // Redirect to custom parser

}

function transformRecord(record) {
    // Map CSV fields to JS object fields
    // CSV headers based on inspection: Question,Image,Option A,Option B,Option C,Option D,Option E,Correct,Difficulty,Topic,Type,Ref

    const options = [
        record['Option A'],
        record['Option B'],
        record['Option C'],
        record['Option D'],
        record['Option E']
    ].filter(opt => opt && opt.trim() !== ''); // Filter out empty options if any

    const ref = record['Ref'];
    const prefix = ref ? ref.split('_')[0] + '_' : '';

    return {
        id: record['Ref'],
        question: record['Question'],
        image: record['Image'] && record['Image'].trim() !== ''
            ? (record['Image'].startsWith('http') ? record['Image'] : `https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/main/${record['Image']}`)
            : null,
        options: options,
        correctAnswer: record['Correct'],
        topic: record['Topic'],
        difficultyIndex: parseInt(record['Difficulty'], 10) || 1, // Default to 1 if parsing fails
        prefix: prefix
    };
}

function updateJsFile(newQuestions) {
    console.log(`Reading target JS file from ${TARGET_JS_FILE_PATH}...`);
    let jsContent = fs.readFileSync(TARGET_JS_FILE_PATH, 'utf8');

    // Find the end of the array
    const arrayEndIndex = jsContent.lastIndexOf('];');
    if (arrayEndIndex === -1) {
        throw new Error('Could not find the end of the MATHS_QUIZ array in the JS file.');
    }

    // Prepare the new content to insert
    // We'll insert a comma if the item before ] is not a comma (basic check, might not be perfect but JS allows trailing commas)
    // Actually, safest is to append to the list.

    const newQuestionsString = newQuestions.map(q => JSON.stringify(q, null, 2)).join(',\n  ');

    // Check if we need a preceding comma. 
    // If the array is empty `[]`, we don't need a comma. 
    // If it has content, we do.
    // Given the file size, we assume it has content.

    const insertion = `,\n  ${newQuestionsString}\n`;

    const newContent = jsContent.slice(0, arrayEndIndex) + insertion + jsContent.slice(arrayEndIndex);

    console.log(`Writing updated content to ${TARGET_JS_FILE_PATH}...`);
    fs.writeFileSync(TARGET_JS_FILE_PATH, newContent, 'utf8');
    console.log('Done.');
}

function main() {
    try {
        // We need csv-parse library. If not present, we should probably install it or write a simple parser.
        // Since I cannot easily install packages without user permission/workflow, 
        // AND `csv-parse` might not be in the project, `csv-parse/sync` usage above assumes it is there.
        // Let's check package.json first? 
        // Actually, for simplicity and robustness in this environment without installing new deps if possible,
        // I will write a simple CSV parser since the requirement said "CSV data". 
        // However, the CSV has quoted multiline fields which is tricky for regex.
        // I'll try to use a simple parser if no deps are allowed, but better to check if I can use what's available.
        // Let's assume for now I should write a robust-enough parser or use what's there.
        // WAIT: The user environment likely doesn't have `csv-parse` installed unless I add it.
        // I will rewrite this script to include a basic CSV parser that handles quoted fields to avoid dependency issues.

        const rawImport = parseCSV_custom();
        const newQuestions = rawImport.map(transformRecord);
        if (newQuestions.length > 0) {
            updateJsFile(newQuestions);
        } else {
            console.log('No questions to add.');
        }

    } catch (error) {
        console.error('Error importing maths questions:', error);
        process.exit(1);
    }
}

// Custom CSV Parser to avoid external dependencies
function parseCSV_custom() {
    console.log(`Reading CSV from ${CSV_FILE_PATH}...`);
    const text = fs.readFileSync(CSV_FILE_PATH, 'utf8');

    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    // Normalize line endings
    const chars = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const nextChar = chars[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    currentField += '"';
                    i++; // Skip next quote
                } else {
                    // End of quoted field
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\n') {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }

    // Add last field/row if any
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    // Extract headers
    const headers = rows[0];
    const data = rows.slice(1).filter(r => r.length === headers.length); // Filter invalid rows

    return data.map(row => {
        const obj = {};
        headers.forEach((h, index) => {
            obj[h] = row[index];
        });
        return obj;
    });
}

main();
