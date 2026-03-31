const fs = require('fs');
const qs = require('./m3l_questions.json');
console.log(JSON.stringify(qs.slice(0, 10), null, 2));
