import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../public/assets/images/dota');
const OUTPUT_FILE = path.join(__dirname, '../public/assets/dota_manifest.json');

const directories = ['heroes', 'items', 'abilities'];
const manifest = {
    heroes: [],
    items: [],
    abilities: []
};

directories.forEach(dir => {
    const fullPath = path.join(ASSETS_DIR, dir);
    if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        // Store filenames without extension for easier matching, or full?
        // Let's store full filename, but maybe also a normalized "key" map?
        // Simple array of filenames is enough for client-side search if size is small.
        // 500 items + 500 abilities + 120 heroes = ~1200 strings. Fast enough.
        manifest[dir] = files.filter(f => f.endsWith('.png'));
    }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`Manifest generated at ${OUTPUT_FILE}`);
console.log(`Heroes: ${manifest.heroes.length}`);
console.log(`Items: ${manifest.items.length}`);
console.log(`Abilities: ${manifest.abilities.length}`);
