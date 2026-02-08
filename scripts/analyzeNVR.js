const fs = require('fs');
const path = require('path');

function analyzePrefixes() {
    const content = fs.readFileSync(path.join(__dirname, '../data/nonverbal.js'), 'utf8');

    const lines = content.split('\n');
    let currentTopic = 'Unknown';
    const topicPrefixes = {};

    lines.forEach(line => {
        // Detect topic start roughly: "TopicName": {
        const topicMatch = line.match(/^\s*"([^"]+)":\s*{/);
        if (topicMatch) {
            currentTopic = topicMatch[1];
            topicPrefixes[currentTopic] = new Set();
        }

        const imgMatch = line.match(/"image":\s*"([^"]+)"/);
        if (imgMatch) {
            const url = imgMatch[1];
            const filename = url.split('/').pop().replace(/\.\w+$/, '');
            const prefix = filename.replace(/_?\d+$/, '');

            if (!topicPrefixes[currentTopic]) topicPrefixes[currentTopic] = new Set();
            topicPrefixes[currentTopic].add(prefix);
        }
    });

    Object.keys(topicPrefixes).forEach(t => {
        console.log(`Topic: ${t}, Prefixes: ${topicPrefixes[t].size} (${Array.from(topicPrefixes[t]).join(', ')})`);
    });
}

analyzePrefixes();
