import fs from 'fs';
import path from 'path';
import https from 'https';
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
            https.get(currentUrl, response => {
                // Handle Redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    if (response.headers.location) {
                        // console.log(`Following redirect for ${path.basename(localPath)}`);
                        get(response.headers.location);
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
                    // Consume data to free memory
                    response.resume();
                    console.warn(`Failed to download ${currentUrl}: ${response.statusCode}`);
                    resolve(); // Resolve to convert failure to skip
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

    // 1. Heroes
    const heroesRes = await fetch('https://api.opendota.com/api/constants/heroes');
    const heroes = await heroesRes.json();
    console.log(`Found ${Object.keys(heroes).length} heroes.`);

    // Official CDN base for heroes (OpenDota img usually has /apps/dota2/...)
    const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com';

    for (const [id, hero] of Object.entries(heroes)) {
        // hero.img: "/apps/dota2/images/dota_react/heroes/icons/antimage.png?"
        // We want to save as "antimage.png" (clean name) or use ID?
        // Using "npc_dota_hero_antimage" is safer but "antimage" matches `heroName` used in code.
        // `hero.name` is "npc_dota_hero_antimage".
        // `heroDetails.jsx` uses `p.heroName` which removes prefix?
        // Let's verify what `p.heroName` is. usually "antimage".

        const heroName = hero.name.replace('npc_dota_hero_', '');
        const url = `${STEAM_CDN}${hero.img}`;
        const localPath = path.join(HEROES_DIR, `${heroName}.png`);
        await downloadImage(url, localPath);
    }

    // 2. Items
    const itemsRes = await fetch('https://api.opendota.com/api/constants/items');
    const items = await itemsRes.json();
    console.log(`Found ${Object.keys(items).length} items.`);

    for (const [key, item] of Object.entries(items)) {
        // item.img: "/apps/dota2/images/items/blink_lg.png?3"
        if (!item.img) continue;

        // key is "blink". `item_blink` -> replace `item_` -> `blink`.
        // We save as `blink.png`. (We will ignore _lg suffix in local filename to make it simpler, OR keep it?)
        // Let's Keep naming simple: `{item_name}.png`.

        const itemName = key; // e.g. "blink", "recipe_blink"
        const url = `${STEAM_CDN}${item.img.split('?')[0]}`;
        const localPath = path.join(ITEMS_DIR, `${itemName}.png`); // standardize extension? Source is png.
        await downloadImage(url, localPath);
    }

    // 3. Abilities
    const abilitiesRes = await fetch('https://api.opendota.com/api/constants/abilities');
    const abilities = await abilitiesRes.json();
    console.log(`Found ${Object.keys(abilities).length} abilities.`);

    for (const [key, ability] of Object.entries(abilities)) {
        // ability.img: "/apps/dota2/images/abilities/antimage_blink_md.png"
        if (!ability.img) continue;

        const abilityName = key; // e.g. "antimage_blink"
        const url = `${STEAM_CDN}${ability.img.split('?')[0]}`;
        const localPath = path.join(ABILITIES_DIR, `${abilityName}.png`);
        await downloadImage(url, localPath);
    }

    console.log('Done downloading assets!');
};

main();
