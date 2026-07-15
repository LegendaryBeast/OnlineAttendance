const fs = require('fs');
const path = require('path');

const authJsPath = path.join(__dirname, 'js/auth.js');
const backendUrl = process.env.BACKEND_URL;

if (backendUrl) {
    console.log(`Injecting BACKEND_URL: ${backendUrl}`);
    let content = fs.readFileSync(authJsPath, 'utf8');
    content = content.replace('http://localhost:3000/api', backendUrl);
    fs.writeFileSync(authJsPath, content, 'utf8');
    console.log('Successfully injected backend URL.');
} else {
    console.log('No BACKEND_URL environment variable found. Keeping default local URL.');
}
