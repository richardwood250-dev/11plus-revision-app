const fs = require('fs');
const content = fs.readFileSync('data/verbal.js', 'utf8');
const regex = /\{"id":"Missing_letter_16\d"[^}]+\}/gi;
const matches = content.match(regex);
if (matches) {
    console.log(matches.join('\n'));
} else {
    console.log("No matches found.");
}
