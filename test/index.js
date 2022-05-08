const fs = require('fs');
const path = require('path');
const cjs2esm = require('../').default;

const filepath = path.join(__dirname, 'fixtures/v0.3.0');
const code = fs.readFileSync(path.join(filepath, 'input.js'), 'utf8');
const result = cjs2esm(code);

fs.writeFileSync(path.join(filepath, 'output.js'), result.code);
