const fs = require('fs');
let content = fs.readFileSync('data/verbal.js', 'utf8');

// The pattern is: "id":"M3L_xxx","question":"...","key":null
content = content.replace(/("id":"M3L_\d+","question":")(.*?)((?<!\\)","key":null)/g, (match, prefix, qText, suffix) => {
    // Escape unescaped double quotes inside qText
    const fixedQtext = qText.replace(/(?<!\\)"/g, '\\"');
    return prefix + fixedQtext + suffix;
});

fs.writeFileSync('data/verbal.js', content, 'utf8');
console.log('Fixed quotes in data/verbal.js');
