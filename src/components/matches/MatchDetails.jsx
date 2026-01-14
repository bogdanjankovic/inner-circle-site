import React from 'react';
import './MatchDetails.css';
import { HeroImage } from '../ui/HeroTooltip';

const HERO_IMG_BASE = '/assets/images/dota/heroes/';
const ITEM_IMG_BASE = '/assets/images/dota/items/';
const ABILITY_IMG_BASE = '/assets/images/dota/abilities/';

// Asset Manifest Cache
let ASSET_MANIFEST = null;

// Fetch manifest once
fetch('/assets/dota_manifest.json')
    .then(res => res.json())
    .then(data => {
        ASSET_MANIFEST = data;
        // console.log('Asset Manifest Loaded', data);
    })
    .catch(err => console.warn('Failed to load asset manifest', err));

const findBestMatch = (name, type) => {
    // type: 'heroes', 'items', 'abilities'
    if (!name || !ASSET_MANIFEST || !ASSET_MANIFEST[type]) return name; // Fallback to raw/normalized name

    const files = ASSET_MANIFEST[type]; // array of filenames "antimage.png"
    const target = name.toLowerCase(); // keys are snake_case

    // 1. Exact match (name + .png)
    if (files.includes(`${target}.png`)) return target;

    // 2. Exact match (name) - sometimes parser has mismatch
    // 3. Heuristics
    // "windrunner_focusfire" vs "focus_fire.png"
    // "empty_bottle" vs "bottle.png"

    // Heuristic A: Substring match (Target contains File OR File contains Target)
    // "empty_bottle" contains "bottle". -> Match!
    // But "bottle" does NOT contain "empty_bottle".
    // We prefer the *Asset* that is contained in the *Target*?
    // "empty_bottle" (Parser) -> "bottle" (Asset). Yes.

    // Heuristic B: Suffix Match (windrunner_focusfire -> focusfire)
    // Remove "windrunner_" prefix?
    // Check if any asset is a suffix of target?
    // "focus_fire" is NOT strictly suffix of "windrunner_focusfire" due to underscore.

    // Heuristic C: Fuzzy Score (Simple common chars or stripped)

    let bestMatch = null;
    let maxScore = -1;

    const targetClean = target.replace(/[^a-z0-9]/g, '');

    for (const file of files) {
        const fileBase = file.replace('.png', '');
        const fileClean = fileBase.replace(/[^a-z0-9]/g, '');

        // Perfect match ignoring separators
        if (targetClean === fileClean) return fileBase;

        // Check containment (bottle inside empty_bottle)
        if (targetClean.includes(fileClean)) {
            // Score by length ratio (closer length = better)
            const score = fileClean.length / targetClean.length; // 0.0 - 1.0
            if (score > maxScore) {
                maxScore = score;
                bestMatch = fileBase;
            }
        }

        // Also check if Target is inside File (unlikely for "empty_bottle" -> "bottle" direction but possible)
    }

    return bestMatch || target;
};

const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
};

// Specific overrides for heroes where Parser output (lowercase, no prefix) mismatch Asset filename
const HERO_NAME_OVERRIDES = {
    'emberspirit': 'ember_spirit',
    'centaur': 'centaur', // Sometimes centaur_warrunner? Checked download: centaur.png
    'treant': 'treant',   // treant_protector? Download: treant.png
    'magnataur': 'magnataur', // magnus? Download: magnataur.png
    // Add others if reported missing
};

const normalizeHeroName = (name) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    if (HERO_NAME_OVERRIDES[lower]) return HERO_NAME_OVERRIDES[lower];
    return lower;
};

const normalizeName = (name) => {
    if (!name) return null;
    let clean = name;

    // Handle specific prefixes to strip
    if (clean.startsWith('item_')) clean = clean.replace('item_', '');
    // Abilities often don't have prefix but items do.

    // Convert PascalCase/camelCase to snake_case
    // e.g. "Abaddon_AphoticShield" -> "abaddon_aphotic_shield"
    // e.g. "PowerTreads" -> "power_treads"
    // e.g. "blink" -> "blink"

    // Strategy: Insert underscore before Capital letters that follow lowercase/number
    clean = clean.replace(/([a-z0-9])([A-Z])/g, '$1_$2');

    // Lowercase everything
    clean = clean.toLowerCase();

    // Remove any double underscores if they appeared (e.g. Abaddon_AphoticShield -> Abaddon__Aphotic_Shield)
    clean = clean.replace(/_+/g, '_');

    // Remove leading/trailing underscores
    if (clean.startsWith('_')) clean = clean.slice(1);
    if (clean.endsWith('_')) clean = clean.slice(0, -1);

    return clean;
};

const normalizeItemName = normalizeName; // Reuse logic
const normalizeAbilityName = normalizeName; // Reuse logic

const PlayerRow = ({ p }) => {
    // Determine image using internal heroName
    const normalizedHero = normalizeHeroName(p.heroName);
    // Use findBestMatch for robust matching (e.g. "centaur_warrunner" vs "centaur.png")
    const bestHero = findBestMatch(normalizedHero, 'heroes');
    const heroImg = bestHero ? `${HERO_IMG_BASE}${bestHero}.png` : null;

    return (
        <tr>
            <td className="left-align">
                <div className="player-cell">
                    {heroImg ? (
                        <img
                            src={heroImg}
                            alt={p.heroName}
                            className="hero-icon"
                            onError={(e) => {
                                // console.warn(`Hero Image Failed: ${p.heroName} -> ${e.target.src}`);
                                e.target.style.display = 'none';
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{p.heroName || p.heroId}</span>
                    )}
                    <div className="player-info">
                        <span className="player-name">{p.name}</span>
                        {p.facet && (
                            <div className="facet-info" style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                                <span className="facet-title">{p.facetTitle}</span>
                                {p.facetIcon && (
                                    <img
                                        src={p.facetIcon}
                                        alt={p.facetTitle}
                                        style={{ width: '16px', height: '16px', marginRight: '0.5rem', borderRadius: '2px' }}
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                )}
                            </div>
                        )}
                        <span className="player-rank">Level {p.level}</span>
                    </div>
                </div>
            </td>
            <td>{p.level}</td>
            <td className="kda-cell">
                <span className="kda-kills">{p.kills}</span>
                <span className="kda-deaths">{p.deaths}</span>
                <span className="kda-assists">{p.assists}</span>
            </td>
            <td>{p.lastHits} <span style={{ color: '#666' }}>/</span> {p.denies}</td>
            <td className="networth">{formatNumber(p.netWorth)}</td>
            <td>{p.gpm} <span style={{ color: '#666' }}>/</span> {p.xpm}</td>
            <td>{formatNumber(p.heroDamage)}</td>
            <td>{formatNumber(p.towerDamage)}</td>
            <td>{formatNumber(p.heroHealing)}</td>
            <td>
                <div className="items-cell">
                    {p.items.map((item, idx) => {
                        // Parser names: e.g. "PowerTreads" or "item_blink"
                        // Assets: "power_treads.png", "blink.png"
                        const cleanItem = normalizeItemName(item);
                        const finalItem = findBestMatch(cleanItem, 'items');
                        return (
                            <img
                                key={idx}
                                src={`${ITEM_IMG_BASE}${finalItem}.png`}
                                alt={item}
                                title={item}
                                className="item-icon"
                                onError={(e) => {
                                    // console.error(`Failed to load item image: ${e.target.src}`);
                                    e.target.style.display = 'none';
                                }}
                            />
                        );
                    })}
                </div>
            </td>
        </tr>
    );
};

const TeamTable = ({ teamName, players, winner }) => {
    const isRadiant = teamName === 'Radiant';
    const headerClass = isRadiant ? 'radiant-header' : 'dire-header';

    // Totals
    const totalKills = players.reduce((a, b) => a + b.kills, 0);
    const totalDeaths = players.reduce((a, b) => a + b.deaths, 0);
    const totalAssists = players.reduce((a, b) => a + b.assists, 0);
    const totalGold = players.reduce((a, b) => a + b.netWorth, 0);

    return (
        <div>
            <div className={`section-header ${headerClass}`}>
                <span>{teamName} - Overview</span>
                {winner === teamName && <span style={{ opacity: 0.6 }}>WINNER</span>}
            </div>
            <table className="stats-table">
                <thead>
                    <tr>
                        <th className="left-align" style={{ width: '25%' }}>Player</th>
                        <th style={{ width: '5%' }}>LVL</th>
                        <th style={{ width: '10%' }}>K D A</th>
                        <th style={{ width: '10%' }}>LH / DN</th>
                        <th style={{ width: '8%' }}>NET</th>
                        <th style={{ width: '10%' }}>GPM / XPM</th>
                        <th style={{ width: '8%' }}>HD</th>
                        <th style={{ width: '6%' }}>TD</th>
                        <th style={{ width: '6%' }}>HH</th>
                        <th style={{ width: '20%' }}>ITEMS</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map(p => <PlayerRow key={p.steamId} p={p} />)}
                    {/* Totals Row */}
                    <tr style={{ background: '#11151b', fontWeight: 'bold' }}>
                        <td colSpan={2} style={{ textAlign: 'right', paddingRight: '20px' }}>Totals</td>
                        <td className="kda-cell">
                            <span>{totalKills}</span>
                            <span className="kda-deaths">{totalDeaths}</span>
                            <span>{totalAssists}</span>
                        </td>
                        <td></td>
                        <td className="networth">{formatNumber(totalGold)}</td>
                        <td colSpan={5}></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const AbilityBuildGrid = ({ teamName, players }) => {
    return (
        <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
            <div className="section-header" style={{ color: '#fff', borderLeft: '4px solid #888' }}>
                {teamName} - Ability Build (Levels 1-30)
            </div>
            <div className="ability-grid-header">
                <div style={{ paddingLeft: '10px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#667788', alignSelf: 'center' }}>Player</div>
                {[...Array(30)].map((_, i) => (
                    <div key={i} className="level-header">{i + 1}</div>
                ))}
            </div>
            {players.map(p => {
                const heroImg = p.heroName ? `${HERO_IMG_BASE}${p.heroName}.png` : null;
                // abilityMap is list of strings in order.
                // We map indices 0..24 to columns 1..25
                return (
                    <div key={p.steamId} className="ability-player-row">
                        <div className="player-cell" style={{ paddingLeft: '10px' }}>
                            {heroImg && <img src={heroImg} alt={p.heroName} style={{ width: '32px', height: '18px', borderRadius: '2px' }} />}
                            <div className="player-info">
                                <span className="player-name" style={{ fontSize: '0.8rem' }}>{p.name}</span>
                                {p.facet && (
                                    <div className="facet-info" style={{ fontSize: '0.65rem', color: '#888', marginTop: '0.1rem' }}>
                                        <span className="facet-title">{p.facetTitle}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {[...Array(30)].map((_, i) => {
                            const ability = p.ability_build ? p.ability_build[i] : null;
                            if (ability) {
                                return (
                                    <div key={i} style={{ textAlign: 'center' }}>
                                        <img
                                            src={`${ABILITY_IMG_BASE}${findBestMatch(normalizeAbilityName(ability), 'abilities')}.png`}
                                            className="ability-icon-small"
                                            title={ability}
                                            onError={(e) => {
                                                // console.error(`Failed to load ability image: ${e.target.src}`);
                                                // Fallback to _hp1 or default not needed if local files standardized
                                                e.target.style.opacity = 0;
                                            }}
                                        />
                                    </div>
                                )
                            } else {
                                return <div key={i} className="empty-slot" style={{ width: '6px', height: '6px' }}></div>;
                            }
                        })}
                    </div>
                );
            })}
        </div>
    )
}

const DraftTimeline = ({ picksBans }) => {
    if (!picksBans || picksBans.length === 0) return null;

    // Helper to get hero image
    const getHeroImg = (id) => {
        // We need a mapping or fetch mechanism for ID -> Name if not provided. 
        // For now, assuming we might need to rely on the ID being sufficient if we had a map, 
        // OR we just use the ID if we can't map. 
        // Ideally the parser should provide hero names in picks_bans too to avoid huge client-side maps.
        // Waiting for user feedback or assuming we have a map.
        // Actually, let's use a placeholder or handle it if we have the data.
        // The parser output shows "hero_id". We need "hero_name" for the image URL.
        // We can find the hero name from the players list if a player picked it? 
        // Bans won't have players.
        // We might need a small ID->Name map or fetch it.
        // For this step, I will use a placeholder or generic DOTA ID usage if valid.
        // Crap, I need the hero name string (e.g. "antimage") for the image URL.
        // I will assume I can pass a heroMap or just use ID for now and fix later?
        // Let's check if we can pass a map from the parent or if we need to fetch constants.
        return null;
    };

    // The parser output in the example had "hero_id". 
    // To display images we need names. 
    // I'll skip the image logic for a second and just render boxes with IDs/Names if available
    // OR I can use the `dotaApi` service if available?
    // Let's look at `dotaApi.js` later. For now, basic structure.

    return (
        <div style={{ marginBottom: '20px', overflowX: 'auto' }}>
            <div className="section-header">Draft</div>
            <div className="draft-timeline">
                {picksBans.map((pb, idx) => (
                    <div key={idx} className={`draft-card ${pb.is_pick ? 'pick' : 'ban'} team-${pb.team}`}>
                        <span className="draft-label">{pb.is_pick ? 'PICK' : 'BAN'}</span>
                        {/* We need hero ID to Name mapping here. For now showcasing ID */}
                        <div className="draft-hero-id">{pb.hero_id}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const HeatmapOverlay = ({ players, wards }) => {
    const canvasRef = React.useRef(null);

    // Fixed Bounds for 7.33 Map (approximate grid coordinates)
    // Fixed Bounds for 7.33 Map (approximate grid coordinates)
    // Updated again: User requested "just a bit more inward".
    // Expanded from 48-208 to 40-216.
    const bounds = { minX: 40, maxX: 216, minY: 40, maxY: 216 };
    const scaleX = 176; // 216-40
    const scaleY = 176;

    const [showHeatmap, setShowHeatmap] = React.useState(true);
    const [showObs, setShowObs] = React.useState(true);
    const [showSent, setShowSent] = React.useState(true);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous

        if (showHeatmap) {
            ctx.globalCompositeOperation = 'screen';
            ctx.shadowBlur = 10;

            players.forEach(p => {
                if (!p.positions) return;
                const color = p.team === 'Radiant' ? 'rgba(0, 255, 64, 0.05)' : 'rgba(255, 60, 60, 0.05)';
                ctx.fillStyle = color;
                ctx.shadowColor = color;

                p.positions.forEach(pos => {
                    const x = pos[1];
                    const y = pos[2];

                    const px = ((x - bounds.minX) / scaleX) * canvas.width;
                    const py = canvas.height - ((y - bounds.minY) / scaleY) * canvas.height;

                    ctx.beginPath();
                    ctx.arc(px, py, 4, 0, 2 * Math.PI);
                    ctx.fill();
                });
            });
            ctx.globalCompositeOperation = 'source-over';
            ctx.shadowBlur = 0;
        }
    }, [players, showHeatmap]);

    return (
        <div className="minimap-section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '40px', marginTop: '20px' }}>

            {/* Map Container - Centered */}
            <div className="minimap-container" style={{ position: 'relative', width: '512px', height: '512px', flex: '0 0 auto', border: '1px solid #333', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                <div className="minimap" style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <div 
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url('/assets/images/dota_map_733.png')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'grayscale(50%) brightness(0.7) contrast(1.1)',
                            zIndex: 1
                        }}
                    />
                    <canvas
                        ref={canvasRef}
                        width={512}
                        height={512}
                        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                    />
                    {(showObs || showSent) && wards && wards.map((w, i) => {
                        if (w.type === 'Observer' && !showObs) return null;
                        if (w.type === 'Sentry' && !showSent) return null;

                        const xPct = ((w.x - bounds.minX) / scaleX) * 100;
                        const yPct = ((w.y - bounds.minY) / scaleY) * 100;

                        return (
                            <div
                                key={i}
                                className={`ward-icon ${w.type === 'Observer' ? 'obs' : 'sent'}`}
                                style={{
                                    position: 'absolute',
                                    left: `${xPct}%`,
                                    bottom: `${yPct}%`,
                                    width: '12px', height: '12px', borderRadius: '50%',
                                    backgroundColor: w.type === 'Observer' ? '#fb4' : '#48f',
                                    border: '1px solid black',
                                    boxShadow: '0 0 5px black',
                                    transform: 'translate(-50%, 50%)' // Center on point
                                }}
                                title={`${w.type} Ward`}
                            ></div>
                        );
                    })}
                </div>
            </div>

            {/* Controls Side Panel - Right Side */}
            <div className="vision-controls-panel" style={{
                display: 'flex', flexDirection: 'column', gap: '20px',
                background: '#15191f', padding: '20px', borderRadius: '8px',
                minWidth: '220px', border: '1px solid #333'
            }}>
                <div style={{ textTransform: 'uppercase', color: '#888', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>Map Controls</div>

                <div className="toggle-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: showHeatmap ? 'rgba(76, 204, 102, 0.15)' : 'rgba(255,255,255,0.05)',
                            color: showHeatmap ? '#4c6' : '#888',
                            padding: '12px', border: showHeatmap ? '1px solid #4c6' : '1px solid #333',
                            borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <span>Heatmap</span>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: showHeatmap ? '#4c6' : '#444' }}></div>
                    </button>

                    <button
                        onClick={() => setShowObs(!showObs)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: showObs ? 'rgba(255, 187, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                            color: showObs ? '#fb4' : '#888',
                            padding: '12px', border: showObs ? '1px solid #fb4' : '1px solid #333',
                            borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <span>Observer Wards</span>
                        <div className="ward-dot obs"></div>
                    </button>

                    <button
                        onClick={() => setShowSent(!showSent)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: showSent ? 'rgba(68, 136, 255, 0.15)' : 'rgba(255,255,255,0.05)',
                            color: showSent ? '#48f' : '#888',
                            padding: '12px', border: showSent ? '1px solid #48f' : '1px solid #333',
                            borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <span>Sentry Wards</span>
                        <div className="ward-dot sent"></div>
                    </button>
                </div>

                <div style={{ height: '1px', background: '#333', margin: '10px 0' }}></div>

                <div style={{ textTransform: 'uppercase', color: '#888', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>Legend</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(61, 149, 70, 0.8)' }}></div>
                        <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Radiant</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(194, 60, 42, 0.8)' }}></div>
                        <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Dire</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MatchDetails = ({ match }) => {
    const [activeTab, setActiveTab] = React.useState('overview');

    if (!match || !match.players) return <div style={{ padding: '1rem', color: '#888' }}>No match details available</div>;

    const radiantPlayers = match.players.filter(p => p.team === 'Radiant');
    const direPlayers = match.players.filter(p => p.team === 'Dire');

    // Create a hero ID map from players to at least show names for picked heroes
    const heroIdMap = {};
    match.players.forEach(p => {
        heroIdMap[p.heroId] = p.heroName;
    });

    return (
        <div className="match-details-container">
            <div className="match-header">
                <div>
                    <span className="match-id">Match {match.matchId}</span>
                    <span className="match-duration">{(match.duration / 60).toFixed(0)}:{(match.duration % 60).toFixed(0).padStart(2, '0')}</span>
                </div>
                <div className={`winner-label ${match.winner === 'Radiant' ? 'radiant-text' : 'dire-text'}`}>
                    {match.winner} Victory
                </div>
            </div>

            <div className="tabs">
                <button className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-button ${activeTab === 'heatmaps' ? 'active' : ''}`} onClick={() => setActiveTab('heatmaps')}>Heatmaps</button>
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="draft-section">
                        {match.picks_bans && (
                            <div className="draft-row">
                                {match.picks_bans.map((pb, i) => {
                                    const isBan = !pb.is_pick;
                                    return (
                                        <div key={i} className={`draft-item ${isBan ? 'ban' : 'pick'} ${pb.team === 2 ? 'radiant' : 'dire'}`}>
                                            <HeroImage heroId={pb.hero_id} style={{ width: '100%', height: '100%', opacity: isBan ? 0.6 : 1, filter: isBan ? 'grayscale(100%)' : 'none' }} />
                                            {isBan && <div className="ban-overlay">✖</div>}
                                            <span className="draft-type">{pb.is_pick ? 'PICK' : 'BAN'}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <TeamTable teamName="Radiant" players={radiantPlayers} winner={match.winner} />
                    <TeamTable teamName="Dire" players={direPlayers} winner={match.winner} />

                    <AbilityBuildGrid teamName="Radiant" players={radiantPlayers} />
                    <AbilityBuildGrid teamName="Dire" players={direPlayers} />
                </>
            )}

            {activeTab === 'heatmaps' && (
                <div className="heatmap-tab">
                    <h3>Player Positioning Heatmap & Ward Map</h3>
                    {/* Pass both players and wards to Overlay */}
                    <HeatmapOverlay players={match.players} wards={match.wards} />
                </div>
            )}

        </div>
    );
};

export default MatchDetails;
