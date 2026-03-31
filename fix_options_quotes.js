const fs = require('fs');
let content = fs.readFileSync('data/verbal.js', 'utf8');

// The issue is inside the options array, e.g., ["DAR."", "FLY"]
content = content.replace(/"options":\[(.*?)\]/g, (match, optsChunk) => {
    // optsChunk is `"DAR."","FLY","NAY","NGE","WIT"`
    // Let's replace any `""` with `"` or just escape it to `\"`
    // Actually, `DAR."` inside JSON should be `"DAR.\""`. But the script `inject_m3l.ps1` wrote it as `"DAR."""`
    // Oh wait, `inject_m3l.ps1` wrote `"DAR.""`? No, `"DAR."` + `"` => `"DAR.""` ?
    // Let's just fix `""` preceded by a letter/period and followed by a comma/bracket.
    let cleaned = optsChunk.replace(/([A-Za-z0-9\.])""/g, '$1\\"');
    return '"options":[' + cleaned + ']';
});

// Also remove BOM
if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
}

fs.writeFileSync('data/verbal.js', content, 'utf8');
console.log('Fixed options inner quotes.');
