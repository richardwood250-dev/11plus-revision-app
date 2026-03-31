const fs = require('fs');

let content = fs.readFileSync('data/verbal.js');
if (content[0] === 255 && content[1] === 254) content = content.toString('utf16le');
else content = content.toString('utf8');

const idRegex = /"id"\s*:\s*"([^"]+)"/g;
let counts = {};
let uniques = {};

let match;
while ((match = idRegex.exec(content)) !== null) {
    let id = match[1];
    let topicMatch = id.match(/(.*)_\d+$/);
    let topic = topicMatch ? topicMatch[1] : 'General';
    let uniqueId = topic;

    if (!counts[topic]) {
        counts[topic] = 0;
        uniques[topic] = new Set();
    }
    counts[topic]++;
    uniques[topic].add(uniqueId);
}

for (const topic in counts) {
    console.log(`Topic: ${topic} | Total Questions: ${counts[topic]} | Unique Question Types: ${uniques[topic].size}`);
}
