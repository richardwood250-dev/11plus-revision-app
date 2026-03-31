const fs = require('fs');
const quiz = require('./temp_verbal');
let found = false;

for (const [key, category] of Object.entries(quiz)) {
    for (const q of category.questions) {
        if (q.options) {
            const opts = q.options.join(',').toUpperCase();
            if (opts.includes('HAM') && opts.includes('HOP') && opts.includes('LAP') && opts.includes('PAR') && opts.includes('TAN')) {
                console.log(`Found in category ${key}:`);
                console.log(q);
                found = true;
            }
        }
    }
}
if (!found) {
    console.log("Not found.");
}
