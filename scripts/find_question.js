const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const targetId = process.argv[2];

if (!targetId) {
    console.log("Usage: node find_question.js <QUESTION_ID>");
    process.exit(1);
}

const files = [
    'maths.js',
    'grammar.js',
    'spelling.js',
    'verbal.js',
    'nonverbal.js',
    'cloze.js',
    'vr_compound.js'
];

let found = false;

files.forEach(file => {
    if (found) return;

    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) return;

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        // Clean up export syntax to make it JSON-like
        // Matches: export const VARIABLE_NAME = 
        content = content.replace(/export\s+const\s+\w+\s*=\s*/, '');

        // remove trailing semicolon
        content = content.trim().replace(/;$/, '');

        let data;
        try {
            // Start by trying JSON.parse
            data = JSON.parse(content);
        } catch (jsonErr) {
            // Fallback to eval for JS object literals (keys without quotes, trailing commas)
            // This is safe here as we are reading local trusted files we control
            data = eval('(' + content + ')');
        }

        let questions = [];

        if (Array.isArray(data)) {
            questions = data;
        } else if (typeof data === 'object') {
            // Assume it's grouped by category keys
            Object.values(data).forEach(group => {
                if (Array.isArray(group)) {
                    questions.push(...group);
                } else if (group && Array.isArray(group.questions)) {
                    questions.push(...group.questions);
                }
            });
        }

        const match = questions.find(q => q.id && q.id.toLowerCase() === targetId.toLowerCase());

        if (match) {
            console.log(`\n✅ Found in ${file}:`);
            console.log(JSON.stringify(match, null, 2));
            found = true;
        }

    } catch (e) {
        // Silent fail for parsing issues, mainly to avoid clutter if a file isn't pure JSON
        // console.error(`Failed to parse ${file}: ${e.message}`);
    }
});

if (!found) {
    console.log(`❌ Question ID '${targetId}' not found in known data files.`);
}
