const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js'));

// We want to skip utility scripts or non-quiz data
const ignoreFiles = ['blogPosts.js', 'instructions.js', 'temp_eval.js'];

let totalSummary = {};

function readFileSyncEncoding(filename) {
    const buffer = fs.readFileSync(filename);
    if (buffer.length >= 2 && buffer[0] === 255 && buffer[1] === 254) {
        return buffer.toString('utf16le');
    } else if (buffer.length >= 2 && buffer[0] === 254 && buffer[1] === 255) {
        // Technically utf16be, but rare in windows
        return buffer.toString('utf16le');
    }
    return buffer.toString('utf8');
}

for (const file of files) {
    if (ignoreFiles.includes(file)) continue;

    console.log(`\n\n--- Processing ${file} ---`);
    const filePath = path.join(dataDir, file);

    let content = readFileSyncEncoding(filePath);

    // Replace all "export const <Name> =" with "exports.<Name> ="
    content = content.replace(/export\s+const\s+(\w+)\s*=/g, 'exports.$1 =');

    // Handle any "export function" or default exports if they exist
    content = content.replace(/export\s+function\s+(\w+)/g, 'exports.$1 = function');
    content = content.replace(/export\s+default/g, 'exports.default =');

    const tempPath = path.join(__dirname, `temp_eval_${Date.now()}.js`);
    fs.writeFileSync(tempPath, content, 'utf8'); // write back as utf8

    let exportedData;
    try {
        exportedData = require(tempPath);
    } catch (e) {
        console.log(`Error parsing ${file}: ${e.message}`);
        fs.unlinkSync(tempPath);
        continue;
    }

    let countByTopic = {};
    let uniqueByTopic = {};

    function processQuestionArray(arr, defaultTopic) {
        if (!Array.isArray(arr)) return;
        for (const q of arr) {
            let topic = q.topic || defaultTopic || 'General';

            // Fixes for specific files
            if (file === 'spelling.js') topic = 'Spelling';
            if (file === 'grammar.js') topic = 'Grammar';
            if (file === 'cloze.js') topic = 'Cloze';
            if (file === 'vocab.js') topic = 'Vocabulary';
            if (file.includes('vr_compound')) topic = 'VR Compound';

            let uniqueId = q.id;
            if (q.prefix) {
                uniqueId = q.prefix;
            } else if (q.id) {
                const match = q.id.match(/(.*)_\d+$/);
                if (match) {
                    uniqueId = match[1];
                }
            }

            if (!countByTopic[topic]) {
                countByTopic[topic] = 0;
                uniqueByTopic[topic] = new Set();
            }

            countByTopic[topic]++;
            uniqueByTopic[topic].add(uniqueId);
        }
    }

    // Traverse exported data
    for (const key in exportedData) {
        const data = exportedData[key];

        if (typeof data === 'function') continue;

        if (Array.isArray(data)) {
            processQuestionArray(data, 'No Topic');
        } else if (typeof data === 'object' && data !== null) {
            for (const subKey in data) {
                const subData = data[subKey];
                if (subData && Array.isArray(subData.questions)) {
                    processQuestionArray(subData.questions, subData.title || subKey);
                }
            }
        }
    }

    for (const topic in countByTopic) {
        console.log(`Topic: ${topic} | Total Questions: ${countByTopic[topic]} | Unique Question Types: ${uniqueByTopic[topic].size}`);
    }

    fs.unlinkSync(tempPath);
}
