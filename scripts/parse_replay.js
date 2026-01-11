import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const rapier = require('rapier');


const filePath = process.argv[2];

if (!filePath) {
    console.error("Usage: node parse_replay.js <path-to-replay.dem>");
    process.exit(1);
}

const buffer = fs.readFileSync(filePath);

// Basic Stats Storage
// Output structure
const result = {
    matchId: 0,
    timestamp: Date.now(),
    winner: "Unknown",
    players: []
};

// Listen for the 'file info' message which contains the scoreboard at the end of the replay
parser.on('CDemoFileInfo', (msg) => {
    // This packet usually contains the full game summary
    const info = msg.game_info.dota;

    result.matchId = info.match_id || 0;
    result.winner = info.game_winner === 2 ? "Radiant" : "Dire";
    result.timestamp = info.end_time || Date.now();

    // Map players from the playback info
    if (info.player_info) {
        result.players = info.player_info.map(p => ({
            accountId: p.account_id || 0, // SteamID
            heroId: p.hero_id || 0,
            heroName: p.hero_name, // Typically internal name like 'npc_dota_hero_...'
            kills: p.kills || 0,
            deaths: p.deaths || 0,
            assists: p.assists || 0,
            gpm: p.gold_per_min || 0,
            xpm: p.xp_per_min || 0,
            team: p.game_team === 2 ? 'Radiant' : 'Dire'
        }));
    }
});

// Handling execution
try {
    parser.start();
} catch (e) {
    // If it fails or finishes (some parsers throw on end or EOF)
}

// Check if we found data
if (result.matchId === 0) {
    console.error("Warning: Could not find CDemoFileInfo. The replay might be incomplete or the parser missed the summary.");
    // Fallback or exit?
}

console.log(JSON.stringify(result, null, 2));
console.error("Parsing complete.");
