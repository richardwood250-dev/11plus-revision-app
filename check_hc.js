const fs = require('fs');

let content = fs.readFileSync('data/nonverbal.js', 'utf8');
content = content.replace(/export\s+const\s+(\w+)\s*=/g, 'exports.$1 =');
fs.writeFileSync('temp_nvr.js', content);

const nvr = require('./temp_nvr.js');
const hc = nvr.nonverbal['Horizontal Code'] || nvr.nonverbal['horizontal_code'] || Object.values(nvr.nonverbal).find(v => v.title === 'Horizontal Code');

if (hc && hc.questions) {
    console.log(hc.questions.slice(0, 10).map(q => q.image));
} else {
    console.log('Horizontal Code not found');
}
