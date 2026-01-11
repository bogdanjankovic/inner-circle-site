import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const fs = require('fs');
const rapier = require('rapier');


const filePath = process.argv[2];

if (!filePath) {
    console.error("Usage: node parse_replay.js <path-to-replay.dem>");
    process.exit(1);
}

const { spawn } = require('child_process');
const path = require('path');

// Path to our custom built Java parser
const jarPath = path.resolve(__dirname, '../local-parser/target/dota-parser-1.0-SNAPSHOT.jar');
const javaPath = "C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.17.10-hotspot\\bin\\java.exe";

console.log(`Using Java: ${javaPath}`);
console.log(`Parsing replay: ${filePath}`);

let outputData = "";
const child = spawn(javaPath, ['-jar', jarPath, filePath]);

child.stdout.on('data', (data) => {
    outputData += data.toString();
});

child.stderr.on('data', (data) => {
    process.stderr.write(data);
});

child.on('close', (code) => {
    if (code !== 0) {
        console.error(`Parser exited with code ${code}`);
        process.exit(code);
    }

    try {
        const result = JSON.parse(outputData);

        // Fallback for timestamp if missing
        if (!result.timestamp || result.timestamp === 0) {
            const stats = fs.statSync(filePath);
            result.timestamp = stats.mtimeMs;
        }

        console.log(JSON.stringify(result, null, 2));

    } catch (e) {
        console.error("Failed to parse output JSON: " + e.message);
        console.error("Raw output: " + outputData);
    }
});

