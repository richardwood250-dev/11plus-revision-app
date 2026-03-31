const fs = require('fs');
let content = fs.readFileSync('data/verbal.js', 'utf8');

// The pattern is: "id":"M3L_xxx",...,"options":["...","...","...","...","..."]
// We will match the entire M3L section and process each question block
let fixedContent = content.replace(/({"id":"M3L_\d+","question":".*?"(?<!\\)","key":null,"options":\[)(.*?)(\],"correctAnswer":".*?"})/g, (match, prefix, optionsStr, suffix) => {
    // optionsStr looks like `"DAR."","FLY","NAY","NGE","WIT"`
    // We want to replace any quotes that are NOT preceded by `[` or `,` and NOT followed by `,` or `]`
    // Actually, it's easier to just split by `,` and clean each item
    let opts = optionsStr.split(',');
    let cleanOpts = opts.map(opt => {
        // opt is usually `"TEXT"`
        // If it's `"TEXT""`, we have a trailing quote
        if (opt.startsWith('"') && opt.endsWith('"') && opt.length >= 2) {
            let inner = opt.slice(1, -1);
            // Escape any inner quotes
            inner = inner.replace(/"/g, '\\"');
            return '"' + inner + '"';
        }
        return opt;
    });
    return prefix + cleanOpts.join(',') + suffix;
});

// Also make sure to strip BOM if it exists to prevent random Vercel failures
if (fixedContent.charCodeAt(0) === 0xFEFF) {
    fixedContent = fixedContent.slice(1);
}

fs.writeFileSync('data/verbal.js', fixedContent, 'utf8');
console.log('Fixed quotes in options and stripped BOM in data/verbal.js');
