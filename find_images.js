const fs = require('fs');
const https = require('https');

const url = 'https://api.github.com/repos/richardwood250-dev/11plus-maths/git/trees/main?recursive=1';

const options = {
    headers: {
        'User-Agent': 'Node.js'
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const tree = JSON.parse(data).tree;
            if (!tree) {
                console.error("No tree found in response:", data);
                return;
            }

            const p3q33 = tree.filter(f => f.path.toLowerCase().includes('p3q33'));
            console.log('Found P3Q33_ files:');
            p3q33.forEach(f => console.log(f.path));

            const p5q3 = tree.filter(f => f.path.toLowerCase().includes('p5q3'));
            console.log('\nFound P5Q3_ files:');
            p5q3.forEach(f => console.log(f.path));

        } catch (e) {
            console.error(e);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
