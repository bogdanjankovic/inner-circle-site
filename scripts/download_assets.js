import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

// Helper to handle ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../public/assets/images/dota');
const HEROES_DIR = path.join(ASSETS_DIR, 'heroes');
const ITEMS_DIR = path.join(ASSETS_DIR, 'items');
const ABILITIES_DIR = path.join(ASSETS_DIR, 'abilities');

// Ensure directories exist
[HEROES_DIR, ITEMS_DIR, ABILITIES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const downloadImage = (url, localPath) => {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(localPath)) {
            // console.log(`Skipping existing: ${path.basename(localPath)}`);
            resolve();
            return;
        }

        const get = (currentUrl) => {
            if (!currentUrl) {
                console.warn(`Empty redirect URL for ${path.basename(localPath)}`);
                resolve();
                return;
            }

            const client = currentUrl.startsWith('https') ? https : http;

            client.get(currentUrl, response => {
                // Handle Redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    if (response.headers.location) {
                        // Handle relative redirects (unlikely but possible)
                        const redirectUrl = response.headers.location.startsWith('http')
                            ? response.headers.location
                            : new URL(response.headers.location, currentUrl).toString();

                        get(redirectUrl);
                        return;
                    }
                }

                if (response.statusCode === 200) {
                    const file = fs.createWriteStream(localPath);
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`Downloaded: ${path.basename(localPath)}`);
                        resolve();
                    });
                } else {
                    response.resume();
                    console.warn(`Failed to download ${currentUrl}: ${response.statusCode}`);
                    resolve();
                }
            }).on('error', err => {
                fs.unlink(localPath, () => { });
                console.warn(`Error downloading ${currentUrl}: ${err.message}`);
                resolve();
            });
        };

        get(url);
    });
};

const main = async () => {
    console.log('Fetching OpenDota Constants...');

    // CDNs
    const REACT_CDN = 'https://cdn.cloudflare.steamstatic.com'; // For Heroes (dota_react)
    const VALVE_CDN = 'http://cdn.dota2.com'; // For Items/Abilities (standard)

    // 1. Heroes
    const heroesRes = await fetch('https://api.opendota.com/api/constants/heroes');
    const heroes = await heroesRes.json();
    console.log(`Found ${Object.keys(heroes).length} heroes.`);

    for (const [id, hero] of Object.entries(heroes)) {
        const heroName = hero.name.replace('npc_dota_hero_', '');
        // Heroes use dota_react paths usually
        const url = `${REACT_CDN}${hero.img}`;
        const localPath = path.join(HEROES_DIR, `${heroName}.png`);
        await downloadImage(url, localPath);
    }

    // 2. Items
    const itemsRes = await fetch('https://api.opendota.com/api/constants/items');
    const items = await itemsRes.json();
    console.log(`Found ${Object.keys(items).length} items.`);

    for (const [key, item] of Object.entries(items)) {
        if (!item.img) continue;
        const itemName = key;
        // Items often use standard paths. Use VALVE_CDN (http)
        const url = `${VALVE_CDN}${item.img.split('?')[0]}`;
        const localPath = path.join(ITEMS_DIR, `${itemName}.png`);
        await downloadImage(url, localPath);
    }

    // 3. Abilities
    const abilitiesRes = await fetch('https://api.opendota.com/api/constants/abilities');
    const abilities = await abilitiesRes.json();
    console.log(`Found ${Object.keys(abilities).length} abilities.`);

    for (const [key, ability] of Object.entries(abilities)) {
        if (!ability.img) continue;
        const abilityName = key;
        // Abilities also use VALVE_CDN usually
        const url = `${VALVE_CDN}${ability.img.split('?')[0]}`;
        const localPath = path.join(ABILITIES_DIR, `${abilityName}.png`);
        await downloadImage(url, localPath);
    }

    console.log('Done downloading assets!');
};

main();
