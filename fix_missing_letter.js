const fs = require('fs');
let content = fs.readFileSync('data/verbal.js', 'utf8');

content = content.replace(/({"id":"Missing_letter_160","question":"SQUI \\[ \\? \\] AR","key":null,"options":\\["E",)"A"(,"L","P","K"\\],"correctAnswer":"B"})/, '$1"B"$2');
content = content.replace(/({"id":"Missing_letter_161","question":"LIM \\[ \\? \\] AR","key":null,"options":\\["A",)"T"(,"L","C","K"\\],"correctAnswer":"B"})/, '$1"B"$2');
content = content.replace(/({"id":"Missing_letter_162","question":"LAM \\[ \\? \\] AR","key":null,"options":\\["A",)"T"(,"L","C","K"\\],"correctAnswer":"B"})/, '$1"B"$2');
content = content.replace(/({"id":"Missing_letter_163","question":"NUM \\[ \\? \\] AR","key":null,"options":\\["E",)"T"(,"L","A","K"\\],"correctAnswer":"B"})/, '$1"B"$2');
content = content.replace(/({"id":"Missing_letter_164","question":"DUM \\[ \\? \\] AR","key":null,"options":\\["E",)"T"(,"L","A","K"\\],"correctAnswer":"B"})/, '$1"B"$2');
content = content.replace(/({"id":"Missing_letter_165","question":"THUM \\[ \\? \\] AR","key":null,"options":\\["E",)"T"(,"L","A","K"\\],"correctAnswer":"B"})/, '$1"B"$2');
content = content.replace(/({"id":"Missing_letter_166","question":"PLUM \\[ \\? \\] AR","key":null,"options":\\["A",)"T"(,"L","C","K"\\],"correctAnswer":"B"})/, '$1"B"$2');
content = content.replace(/({"id":"Missing_letter_167","question":"CRUM \\[ \\? \\] AR","key":null,"options":\\["E",)"T"(,"L","A","K"\\],"correctAnswer":"B"})/, '$1"B"$2');

fs.writeFileSync('data/verbal.js', content, 'utf8');
console.log("Fixed 160-167");
