const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js'));
const ignoreFiles = ['blogPosts.js', 'instructions.js', 'temp_eval.js'];

let mdContent = '# Question Bank Analysis\n\nThis report details the total number of questions and the amount of unique "types" of questions (variations rolled up) across each topic in each quiz.\n\n';

function readFileSyncEncoding(filename) {
    const buffer = fs.readFileSync(filename);
    if (buffer[0] === 255 && buffer[1] === 254) return buffer.toString('utf16le');
    return buffer.toString('utf8');
}

for (const file of files) {
    if (ignoreFiles.includes(file)) continue;

    let countByTopic = {};
    let uniqueByTopic = {};

    const filePath = path.join(dataDir, file);
    let content = readFileSyncEncoding(filePath);

    if (file === 'verbal.js') {
        // Use Regex for verbal to avoid syntax errors
        const idRegex = /"id"\s*:\s*"([^"]+)"/g;
        let match;
        while ((match = idRegex.exec(content)) !== null) {
            let id = match[1];
            let topicMatch = id.match(/(.*)_\d+$/);
            let topic = topicMatch ? topicMatch[1] : 'General';
            let uniqueId = topic;

            if (!countByTopic[topic]) { countByTopic[topic] = 0; uniqueByTopic[topic] = new Set(); }
            countByTopic[topic]++;
            uniqueByTopic[topic].add(uniqueId);
        }
    } else {
        // Use require strategy for the rest
        content = content.replace(/export\s+const\s+(\w+)\s*=/g, 'exports.$1 =');
        content = content.replace(/export\s+function\s+(\w+)/g, 'exports.$1 = function');
        content = content.replace(/export\s+default/g, 'exports.default =');
        const tempPath = path.join(__dirname, `temp_eval_${Date.now()}.js`);
        fs.writeFileSync(tempPath, content, 'utf8');

        let exportedData;
        try {
            exportedData = require(tempPath);
        } catch (e) {
            fs.unlinkSync(tempPath);
            continue;
        }

        function processArray(arr, defaultTopic) {
            if (!Array.isArray(arr)) return;
            for (const q of arr) {
                let topic = q.topic || defaultTopic || 'General';
                if (file === 'spelling.js') topic = 'Spelling';
                if (file === 'grammar.js') topic = 'Grammar';
                if (file === 'cloze.js') topic = 'Cloze';
                if (file === 'vocab.js') topic = 'Vocabulary';
                if (file.includes('vr_compound')) topic = 'VR Compound';

                let uniqueId = q.id;
                if (q.prefix) uniqueId = q.prefix;
                else if (q.id) {
                    const match = q.id.match(/(.*)_\d+$/);
                    if (match) uniqueId = match[1];
                }

                if (!countByTopic[topic]) { countByTopic[topic] = 0; uniqueByTopic[topic] = new Set(); }
                countByTopic[topic]++;
                uniqueByTopic[topic].add(uniqueId);
            }
        }

        for (const key in exportedData) {
            const data = exportedData[key];
            if (typeof data === 'function') continue;
            if (Array.isArray(data)) processArray(data, 'No Topic');
            else if (typeof data === 'object' && data !== null) {
                for (const subKey in data) {
                    const subData = data[subKey];
                    if (subData && Array.isArray(subData.questions)) {
                        processArray(subData.questions, subData.title || subKey);
                    }
                }
            }
        }
        fs.unlinkSync(tempPath);
    }

    if (Object.keys(countByTopic).length > 0) {
        let quizName = file.replace('.js', '').toUpperCase();
        mdContent += `## ${quizName}\n\n`;
        mdContent += `| Topic | Total Questions | Unique Types |\n|---|---|---|\n`;

        let fileTotalCount = 0;
        let fileUniqueCount = 0;

        for (let topic of Object.keys(countByTopic).sort()) {
            mdContent += `| ${topic} | ${countByTopic[topic]} | ${uniqueByTopic[topic].size} |\n`;
            fileTotalCount += countByTopic[topic];
            fileUniqueCount += uniqueByTopic[topic].size;
        }
        mdContent += `| **TOTAL** | **${fileTotalCount}** | **${fileUniqueCount}** |\n\n`;
    }
}

const reportPath = 'C:\\Users\\richa\\.gemini\\antigravity\\brain\\4b2411dd-ccd9-42e5-8559-5daf48f1b506\\question_counts_report.md';
fs.writeFileSync(reportPath, mdContent);
