const path = require('path');
const fs = require('fs');

const p = path.resolve(__dirname, '../../node_modules/react/jsx-runtime.js');
console.log('Manual Path:', p);
console.log('Manual Path Exists:', fs.existsSync(p));

try {
    const resolved = require.resolve('react/jsx-runtime', { paths: [__dirname] });
    console.log('Resolved via require:', resolved);
} catch (e) {
    console.log('Require failed:', e.message);
}

try {
    const resolvedReact = require.resolve('react', { paths: [__dirname] });
    console.log('Resolved react via require:', resolvedReact);
} catch (e) {
    console.log('Require react failed:', e.message);
}
