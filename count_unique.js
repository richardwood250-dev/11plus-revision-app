const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js'));

for (const file of files) {
    if (file === 'temp_eval.js' || file === 'blogPosts.js' || file === 'instructions.js') continue;

    console.log(`\n\n--- Processing ${file} ---`);
    const filePath = path.join(dataDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace "export const NAME = " with "module.exports = "
    content = content.replace(/export const [A-Z_]+ \=/, 'module.exports =');

    const tempPath = path.join(__dirname, 'temp_eval.js');
    fs.writeFileSync(tempPath, content);

    let data;
    try {
        // Clear require cache
        delete require.cache[require.resolve('./temp_eval.js')];
        data = require('./temp_eval.js');
    } catch (e) {
        console.log(`Error parsing ${file}: ${e.message}`);
        continue;
    }

    if (!Array.isArray(data)) {
        console.log(`Exported data in ${file} is not an array.`);
        continue;
    }

    const countByTopic = {};
    const uniqueByTopic = {};

    for (const q of data) {
        let topic = q.topic || 'No Topic';
        // Handle spelling / grammar where topic might be implied
        if (file === 'spelling.js') topic = 'Spelling';
        if (file === 'grammar.js') topic = 'Grammar';
        if (file === 'nonverbal.js') topic = 'Non-Verbal';
        if (file === 'cloze.js') topic = 'Cloze';

        let uniqueId = q.id;
        if (q.prefix) {
            uniqueId = q.prefix;
        } else if (q.id) {
            // Check for pattern like BaseID_1, BaseID_2
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

    for (const topic in countByTopic) {
        console.log(`Topic: ${topic} | Total Questions: ${countByTopic[topic]} | Unique Question Types: ${uniqueByTopic[topic].size}`);
    }
}

if (fs.existsSync(path.join(__dirname, 'temp_eval.js'))) {
    fs.unlinkSync(path.join(__dirname, 'temp_eval.js'));
}
