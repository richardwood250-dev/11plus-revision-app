const fs = require('fs');

let content = fs.readFileSync('data/verbal.js', 'utf8');
let jsonContent = content;

// Strip BOM
if (jsonContent.charCodeAt(0) === 0xFEFF) {
    jsonContent = jsonContent.slice(1);
}

// Strip export wrapper
jsonContent = jsonContent.replace('export const VERBAL_QUIZ = ', '').replace(/;\\n?$/, '');

try {
    JSON.parse(jsonContent);
    console.log('SUCCESS: data/verbal.js is valid JSON (when ignoring export statement).');
} catch (e) {
    console.log('ERROR JSON.parse Error:', e.message);
    const m = e.message.match(/position (\\d+)/);
    if (m) {
        const p = parseInt(m[1], 10);
        console.log('--- ERROR CONTEXT ---');
        console.log(jsonContent.substring(Math.max(0, p - 60), Math.min(jsonContent.length, p + 60)));
        console.log('---------------------');
    }
}
