const fs = require('fs');
const https = require('https');

https.get('https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const words = JSON.parse(rawData);
            fs.writeFileSync('words.json', JSON.stringify(Object.keys(words)));
            console.log('Downloaded', Object.keys(words).length, 'words');
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
