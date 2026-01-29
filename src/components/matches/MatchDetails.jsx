import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTournament } from '../../context/TournamentContext';
import './MatchDetails.css';
import { HeroImage } from '../ui/HeroTooltip';

const HERO_IMG_BASE = '/assets/images/dota/heroes/';
const ITEM_IMG_BASE = '/assets/images/dota/items/';
const ABILITY_IMG_BASE = '/assets/images/dota/abilities/';
const VALVE_RENDER_BASE = 'https://cdn.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/';

// Asset Manifest Cache
let ASSET_MANIFEST = null;

// Fetch manifest once
fetch('/assets/dota_manifest.json')
    .then(res => res.json())
    .then(data => {
        ASSET_MANIFEST = data;
    })
    .catch(err => console.warn('Failed to load asset manifest', err));

// --- Normalization Helpers ---

const HERO_NAME_OVERRIDES = {
    'emberspirit': 'ember_spirit',
    'centaur': 'centaur',
    'treant': 'treant',
    'magnataur': 'magnataur',
    'windrunner': 'windrunner',
    'necrolyte': 'necrophos',
    'skeleton_king': 'wraith_king',
    'rattletrap': 'clockwerk',
    'zuus': 'zeus',
    'doom_bringer': 'doom',
    'obsidian_destroyer': 'outworld_destroyer',
    'shadow_demon': 'shadow_demon',
    'shredder': 'timbersaw',
    'wisp': 'io',
    'magnus': 'magnataur',
    'furion': 'nature_prophet',
    'windranger': 'windrunner',
    'windrunner': 'windrunner',
    'wind_ranger': 'windrunner',
    'wind_runner': 'windrunner'
};

const ITEM_NAME_OVERRIDES = {
    'branches': 'branches', // Explicitly keep as branches (match branches.png)
    'ward_sentry': 'ward_sentry',
    'ward_observer': 'ward_observer',
    'travel_boots': 'travel_boots',
    'travel_boots_2': 'travel_boots_2',
    'blink': 'blink',
    'sphere': 'sphere'
};

const normalizeName = (name) => {
    if (!name) return null;
    let clean = name;
    if (clean.startsWith('item_')) clean = clean.replace('item_', '');
    if (clean.startsWith('npc_dota_hero_')) clean = clean.replace('npc_dota_hero_', '');
    clean = clean.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    clean = clean.replace(/_+/g, '_');
    if (clean.startsWith('_')) clean = clean.slice(1);
    if (clean.endsWith('_')) clean = clean.slice(0, -1);
    if (ITEM_NAME_OVERRIDES[clean]) return ITEM_NAME_OVERRIDES[clean];
    return clean;
};

const normalizeHeroName = (name) => {
    if (!name) return null;
    let lower = normalizeName(name);
    if (HERO_NAME_OVERRIDES[lower]) return HERO_NAME_OVERRIDES[lower];
    return lower;
};

const findBestMatch = (name, type) => {
    if (!name || !ASSET_MANIFEST || !ASSET_MANIFEST[type]) return name;
    const files = ASSET_MANIFEST[type];
    const target = name.toLowerCase();

    // Exact match (.png)
    if (files.includes(`${target}.png`)) return target;

    // Fallback for Windranger/Windrunner
    if (target === 'windranger' && files.includes('windrunner.png')) return 'windrunner';
    if (target === 'windrunner' && files.includes('windranger.png')) return 'windranger';
    if (target.includes('wind') && target.includes('ranger') && files.includes('windrunner.png')) return 'windrunner';

    let bestMatch = null;
    let maxScore = -1;
    const targetClean = target.replace(/[^a-z0-9]/g, '');

    for (const file of files) {
        const fileBase = file.replace('.png', '');
        const fileClean = fileBase.replace(/[^a-z0-9]/g, '');
        if (targetClean === fileClean) return fileBase;
        if (targetClean.includes(fileClean)) {
            const score = fileClean.length / targetClean.length;
            if (score > maxScore) {
                maxScore = score;
                bestMatch = fileBase;
            }
        }
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

const processMatchData = (rawMatch) => {
    if (!rawMatch) return null;
    const processed = { ...rawMatch };

    // 1. Calculate Scores if missing
    if (processed.radiantScore === undefined || processed.radiantScore === 0) {
        let rScore = 0, dScore = 0;
        (processed.players || []).forEach(p => {
            const kills = p.kills || 0;
            const slot = p.player_slot !== undefined ? p.player_slot : (p.team === 'Radiant' ? 0 : 128);
            if (slot < 128) rScore += kills;
            else dScore += kills;
        });
        processed.radiantScore = rScore;
        processed.direScore = dScore;
    }

    // 2. Normalize Players
    processed.players = (processed.players || []).map(p => {
        // Hero Name Handling
        let heroName = p.heroName || p.hero_name;
        if (heroName && heroName.startsWith('npc_dota_hero_')) {
            heroName = heroName.replace('npc_dota_hero_', '');
        }

        // Determine Team (Use parser's team if available, otherwise fallback to player_slot)
        let team = p.team; // Parser already provides "Radiant" or "Dire"
        if (!team && p.player_slot !== undefined) {
            team = (p.player_slot < 128) ? 'Radiant' : 'Dire';
        }

        // Ability Build (Transform timeline to array for grid if needed, or keep timeline)
        // We will store both formats to be versatile
        let abilityTimeline = p.ability_upgrades || [];
        let abilityBuild = [];

        if (abilityTimeline.length > 0) {
            // Populate linear ability build array (levels 1-30)
            abilityTimeline.forEach(u => {
                if (u.level > 0 && u.level <= 30) {
                    abilityBuild[u.level - 1] = u.ability;
                }
            });
        } else if (p.ability_build && Array.isArray(p.ability_build)) {
            // Fallback: Use existing flat array from parser
            abilityBuild = [...p.ability_build];
        }

        // Wards (Combine logs)
        // Note: parsed match might separate logs. We map p.obs_placed etc.

        return {
            ...p,
            steamId: p.steamId || p.steamid || p.account_id?.toString(),
            heroName: heroName,
            team: team,
            heroId: p.heroId || p.hero_id,
            level: p.level || p.lvl,
            kills: p.kills || 0,
            deaths: p.deaths || 0,
            assists: p.assists || 0,
            lastHits: p.lastHits || p.last_hits || 0,
            denies: p.denies || 0,
            netWorth: p.netWorth || p.net_worth || 0,
            gpm: p.gpm || p.gold_per_min || 0,
            xpm: p.xpm || p.xp_per_min || 0,
            heroDamage: p.heroDamage || p.hero_damage || 0,
            towerDamage: p.towerDamage || p.tower_damage || 0,
            heroHealing: p.heroHealing || p.hero_healing || 0,
            items: p.items || [],
            backpack: p.backpack || [],
            neutral_item: p.neutral_item || null,
            aghs_scepter: p.aghs_scepter || false,
            aghs_shard: p.aghs_shard || false,
            purchase_log: p.purchase_log || [],
            ability_upgrades: abilityTimeline, // Raw timeline
            ability_build: abilityBuild // Linear array 0..29
        };
    });

    // 3. Wards (Combine global logs if present)
    if (!processed.wards) {
        const obs = processed.obs_log || [];
        const sen = processed.sen_log || [];
        processed.wards = [
            ...obs.map(w => ({ type: 'Observer', x: w.x, y: w.y, z: w.z, time: w.time, team: w.team })),
            ...sen.map(w => ({ type: 'Sentry', x: w.x, y: w.y, z: w.z, time: w.time, team: w.team }))
        ];
    }

    // 4. Draft
    if ((!processed.picks_bans || processed.picks_bans.length === 0) && processed.draft_timings) {
        processed.picks_bans = processed.draft_timings.map(dt => ({
            is_pick: dt.pick,
            hero_id: dt.hero_id,
            team: dt.draft_active_team, // 2=Radiant, 3=Dire usually
            order: dt.draft_order
        }));
    }

    return processed;
};

// --- Components ---

const formatTime = (seconds) => {
    if (seconds == null) return null;
    const sign = seconds < 0 ? '-' : '';
    const date = new Date(Math.abs(seconds) * 1000);
    const m = date.getUTCMinutes();
    const s = date.getUTCSeconds().toString().padStart(2, '0');
    // Handle hours if needed, but usually match duration < 60m logic applies
    // Just manual calc is safer for negative
    const abs = Math.abs(seconds);
    const mm = Math.floor(abs / 60);
    const ss = (abs % 60).toFixed(0).padStart(2, '0');
    return `${seconds < 0 ? '-' : ''}${mm}:${ss}`;
};

const getPurchaseTime = (purchaseLog, itemName) => {
    if (!purchaseLog || !itemName) return null;
    const target = normalizeName(itemName);
    // Find last purchase
    for (let i = purchaseLog.length - 1; i >= 0; i--) {
        const log = purchaseLog[i];
        if (!log || !log.key) continue;
        const logKey = normalizeName(log.key);
        if (logKey === target) {
            return log.time;
        }
    }
    return null;
};

const PlayerRow = ({ p }) => {
    const normalizedHero = normalizeHeroName(p.heroName);
    const bestHero = findBestMatch(normalizedHero, 'heroes');
    const heroImg = bestHero ? `${HERO_IMG_BASE}${bestHero}.png` : null;

    const renderItem = (item, idx, isBackpack = false) => {
        const cleanItem = normalizeName(item);
        const finalItem = findBestMatch(cleanItem, 'items');
        const time = getPurchaseTime(p.purchase_log, item);

        return (
            <div key={`${isBackpack ? 'bp' : 'item'}-${idx}`} className={`item-slot ${isBackpack ? 'backpack-slot' : ''}`}>
                <img
                    src={`${ITEM_IMG_BASE}${finalItem}.png`}
                    alt={item}
                    title={`${item} (Purchased: ${formatTime(time)})`}
                    onError={(e) => e.target.style.opacity = 0}
                />
                {time != null && (
                    <div className="item-time">{formatTime(time)}</div>
                )}
            </div>
        );
    };

    const renderNeutralItem = (item) => {
        // Always render the slot so alignment is consistent
        const isEmpty = !item;
        const cleanItem = normalizeName(item);
        const finalItem = findBestMatch(cleanItem, 'items');

        return (
            <div className={`item-slot neutral-slot ${isEmpty ? 'empty' : ''}`}>
                {!isEmpty && (
                    <img
                        src={`${ITEM_IMG_BASE}${finalItem}.png`}
                        alt={item}
                        title={`Neutral: ${item}`}
                        onError={(e) => e.target.style.opacity = 0}
                    />
                )}
            </div>
        );
    };

    const renderAghsStatus = () => {
        const scepterImg = p.aghs_scepter ? '/assets/images/dota/scepter_1.png' : '/assets/images/dota/scepter_0.png';
        const shardImg = p.aghs_shard ? '/assets/images/dota/shard_1.png' : '/assets/images/dota/shard_0.png';

        return (
            <div className="aghs-status-container">
                <img
                    src={scepterImg}
                    className="aghs-icon"
                    title={`Aghanim's Scepter: ${p.aghs_scepter ? 'Yes' : 'No'}`}
                    alt="Scepter"
                />
                <img
                    src={shardImg}
                    className="aghs-icon"
                    title={`Aghanim's Shard: ${p.aghs_shard ? 'Yes' : 'No'}`}
                    alt="Shard"
                />
            </div>
        )
    }

    return (
        <tr id={`player-${p.steamId || p.heroId}`}>
            <td className="left-align player-cell-wrapper">
                <div className="player-cell">
                    <div className="hero-portrait-container">
                        {heroImg ? (
                            <img src={heroImg} alt={p.heroName} className="hero-icon" onError={e => e.target.style.display = 'none'} />
                        ) : (
                            <span className="hero-placeholder">{p.heroName || p.heroId}</span>
                        )}
                        <div className="hero-level">{p.level}</div>
                    </div>

                    <div className="player-info">
                        <span className="player-name">{p.name || p.personaname || 'Unknown'}</span>
                        {p.facet && <span className="facet-label">{p.facetTitle}</span>}
                    </div>
                </div>
            </td>
            <td className="kda-cell">
                <span className="kda-val k">{p.kills}</span>/
                <span className="kda-val d">{p.deaths}</span>/
                <span className="kda-val a">{p.assists}</span>
            </td>
            <td className="secondary-stats">{p.lastHits} <span className="stat-separator">/</span> {p.denies}</td>
            <td className="networth">{formatNumber(p.netWorth)}</td>
            <td className="secondary-stats">{p.gpm} <span className="stat-separator">/</span> {p.xpm}</td>

            <td className="damage-cell">{formatNumber(p.heroDamage)}</td>
            <td className="damage-cell tower">{formatNumber(p.towerDamage)}</td>
            <td className="heal-cell">{formatNumber(p.heroHealing) !== '0' ? formatNumber(p.heroHealing) : '-'}</td>

            <td>
                <div className="items-column">
                    {/* Main Objects Row: Items + Neutral + Aghs */}
                    <div className="items-row-primary">
                        <div className="items-cell main">
                            {p.items.map((item, idx) => renderItem(item, idx, false))}
                        </div>
                        <div className="neutral-aghs-group">
                            {renderNeutralItem(p.neutral_item)}
                            {renderAghsStatus()}
                        </div>
                    </div>

                    {/* Backpack Row */}
                    {p.backpack && p.backpack.length > 0 && (
                        <div className="items-cell backpack">
                            <div className="backpack-icon" title="Backpack">🎒</div>
                            {p.backpack.map((item, idx) => renderItem(item, idx, true))}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

const TeamTable = ({ teamName, players, winner }) => {
    const isRadiant = teamName === 'Radiant';
    const headerClass = isRadiant ? 'radiant-header' : 'dire-header';
    const totalKills = players.reduce((a, b) => a + b.kills, 0);
    const totalDeaths = players.reduce((a, b) => a + b.deaths, 0);
    const totalAssists = players.reduce((a, b) => a + b.assists, 0);
    const totalNet = players.reduce((a, b) => a + b.netWorth, 0);

    return (
        <div className="team-section">
            <div className={`section-header ${headerClass}`}>
                <span className="team-title">{teamName}</span>
                {winner === teamName && <span className="winner-badge">WINNER</span>}
            </div>
            <div className="table-responsive">
                <table className="stats-table">
                    <thead>
                        <tr>
                            <th className="left-align" style={{ width: '20%' }}>HERO</th>
                            <th style={{ width: '10%' }}>K / D / A</th>
                            <th style={{ width: '8%' }}>LH/DN</th>
                            <th style={{ width: '8%' }}>NET</th>
                            <th style={{ width: '10%' }}>GPM/XPM</th>
                            <th style={{ width: '7%' }}>HD</th>
                            <th style={{ width: '7%' }}>TD</th>
                            <th style={{ width: '6%' }}>HH</th>
                            <th style={{ width: '25%' }}>ITEMS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map(p => <PlayerRow key={p.steamId || Math.random()} p={p} />)}
                        <tr className="totals-row">
                            <td className="left-align">Totals</td>
                            <td className="kda-cell">
                                <span className="kda-val">{totalKills}</span>/
                                <span className="kda-val">{totalDeaths}</span>/
                                <span className="kda-val">{totalAssists}</span>
                            </td>
                            <td></td>
                            <td className="networth">{formatNumber(totalNet)}</td>
                            <td colSpan={5}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AbilityTimeline = ({ teamName, players }) => {
    return (
        <div className="ability-section">
            <div className="sub-header">{teamName} - Skill Build</div>
            <div className="ability-timeline-container">
                {/* Level Header */}
                <div className="timeline-header-row">
                    <div className="player-label-col"></div>
                    {[...Array(30)].map((_, i) => (
                        <div key={i} className="timeline-col-header">{i + 1}</div>
                    ))}
                </div>

                {players.map(p => {
                    const normalizedHero = normalizeHeroName(p.heroName);
                    const bestHero = findBestMatch(normalizedHero, 'heroes');
                    const heroImg = bestHero ? `${HERO_IMG_BASE}${bestHero}.png` : null;
                    return (
                        <div key={p.steamId} className="timeline-row">
                            <div className="player-label-col">
                                {heroImg && <img src={heroImg} className="mini-hero-icon" alt={p.heroName} onError={(e) => e.target.style.display = 'none'} />}
                            </div>
                            {[...Array(30)].map((_, i) => {
                                // Use the processed 'ability_build' array
                                const ability = p.ability_build ? p.ability_build[i] : null;
                                if (ability) {
                                    const cleanName = normalizeName(ability);
                                    let content = null;

                                    if (cleanName.includes('special_bonus_attributes') || cleanName === 'stats') {
                                        content = (
                                            <img
                                                src="/assets/images/dota/attribute_bonus.svg"
                                                title={`Lvl ${i + 1}: Attribute Bonus`}
                                                className="ability-icon-tiny special-icon"
                                                alt="Stats"
                                            />
                                        );
                                    } else if (cleanName.includes('special_bonus_unique')) {
                                        content = (
                                            <img
                                                src="/assets/images/dota/talent_tree.svg"
                                                title={`Lvl ${i + 1}: Talent`}
                                                className="ability-icon-tiny special-icon"
                                                alt="Talent"
                                            />
                                        );
                                    } else {
                                        const img = findBestMatch(cleanName, 'abilities');
                                        content = (
                                            <img
                                                src={`${ABILITY_IMG_BASE}${img}.png`}
                                                title={`Lvl ${i + 1}: ${ability}`}
                                                className="ability-icon-tiny"
                                                onError={(e) => e.target.style.opacity = 0}
                                                alt={ability}
                                            />
                                        );
                                    }

                                    return (
                                        <div key={i} className="timeline-slot active">
                                            {content}
                                        </div>
                                    )
                                }
                                return <div key={i} className="timeline-slot empty"></div>;
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const DraftTimeline = ({ picksBans }) => {
    if (!picksBans || picksBans.length === 0) return null;
    return (
        <div className="draft-container">
            <div className="sub-header">Draft</div>
            <div className="draft-row">
                {picksBans.map((pb, idx) => (
                    <div key={idx} className={`draft-card ${pb.is_pick ? 'pick' : 'ban'} team-${pb.team}`}>
                        <div className="draft-hero-content">
                            <HeroImage heroId={pb.hero_id} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                        </div>
                        <div className={`draft-type-label ${pb.is_pick ? 'pick-label' : 'ban-label'}`}>
                            {pb.is_pick ? 'PICK' : 'BAN'} {pb.order}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

const HeatmapOverlay = ({ players, wards }) => {
    const canvasRef = React.useRef(null);
    const bounds = { minX: 40, maxX: 216, minY: 40, maxY: 216 };
    const scaleX = 176;
    const scaleY = 176;

    const [showHeatmap, setShowHeatmap] = React.useState(true);
    const [showObs, setShowObs] = React.useState(true);
    const [showSent, setShowSent] = React.useState(true);
    const [wardTeamFilter, setWardTeamFilter] = React.useState('all');

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (showHeatmap && players) {
            ctx.globalCompositeOperation = 'screen';
            ctx.shadowBlur = 10;
            players.forEach(p => {
                // Apply team filter for heatmap
                if (wardTeamFilter !== 'all') {
                    const teamName = p.team === 'Radiant' ? 'radiant' : 'dire';
                    if (wardTeamFilter !== teamName) return;
                }

                // p.positions MUST be [[t,x,y],...] format or compatible
                // TODO: Ensure normalized parser output provides this format
                if (!p.positions) return;
                const color = p.team === 'Radiant' ? 'rgba(0, 255, 64, 0.08)' : 'rgba(255, 60, 60, 0.12)';
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                p.positions.forEach(pos => {
                    // Check structure. OpenDota might be sparse map?
                    // Assuming normalized array from processMatchData or direct parser output
                    const x = Array.isArray(pos) ? pos[1] : pos.x;
                    const y = Array.isArray(pos) ? pos[2] : pos.y;
                    if (!x || !y) return;

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
    }, [players, showHeatmap, wardTeamFilter]);

    return (
        <div className="minimap-section">
            <div className="minimap-container">
                <div className="minimap">
                    <div className="minimap-bg" />
                    <canvas ref={canvasRef} width={512} height={512} />
                    {(showObs || showSent) && wards && wards.map((w, i) => {
                        if (w.type === 'Observer' && !showObs) return null;
                        if (w.type === 'Sentry' && !showSent) return null;
                        if (wardTeamFilter !== 'all') {
                            const t = (w.team === 2 || w.team === 'Radiant') ? 'radiant' : 'dire';
                            if (wardTeamFilter !== t) return null;
                        }
                        const xPct = ((w.x - bounds.minX) / scaleX) * 100;
                        const yPct = ((w.y - bounds.minY) / scaleY) * 100;

                        // Debug logging
                        if (i === 0) {
                            console.log('Ward sample:', w);
                            console.log('Bounds:', bounds);
                            console.log('Scale:', { scaleX, scaleY });
                            console.log('Calculated position:', { xPct, yPct });
                            console.log('Total wards:', wards.length);
                        }

                        return (
                            <div key={i} className={`ward-icon ${w.type === 'Observer' ? 'obs' : 'sent'}`}
                                style={{ left: `${xPct}%`, bottom: `${yPct}%` }}
                                title={`${w.type} Ward (${w.time}s)`}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="vision-controls-panel">
                <div className="ctrl-header">Map Layers</div>
                <div className="toggle-group">
                    <button className={`toggle-btn ${showHeatmap ? 'active' : ''}`} onClick={() => setShowHeatmap(!showHeatmap)}>Heatmap</button>
                    <button className={`toggle-btn obs ${showObs ? 'active' : ''}`} onClick={() => setShowObs(!showObs)}>Observer</button>
                    <button className={`toggle-btn sent ${showSent ? 'active' : ''}`} onClick={() => setShowSent(!showSent)}>Sentry</button>
                </div>
                <div className="ctrl-divider"></div>
                <div className="ctrl-header">Team Filter</div>
                <div className="toggle-group">
                    <button className={`toggle-btn ${wardTeamFilter === 'all' ? 'active' : ''}`} onClick={() => setWardTeamFilter('all')}>All</button>
                    <button className={`toggle-btn rad ${wardTeamFilter === 'radiant' ? 'active' : ''}`} onClick={() => setWardTeamFilter('radiant')}>Radiant</button>
                    <button className={`toggle-btn dire ${wardTeamFilter === 'dire' ? 'active' : ''}`} onClick={() => setWardTeamFilter('dire')}>Dire</button>
                </div>
            </div>
        </div>
    );
};

const HeroRenderStack = ({ players, team }) => {
    const isRadiant = team === 'Radiant';

    return (
        <div className={`hero-render-stack ${isRadiant ? 'radiant' : 'dire'}`}>
            {players.map((p, idx) => {
                const heroName = normalizeHeroName(p.heroName || p.hero_name);

                // We'll create a small helper for the video sources
                const renderVideo = (name) => {
                    const webmUrl = `${VALVE_RENDER_BASE}${name}.webm`;
                    const movUrl = `${VALVE_RENDER_BASE}${name}.mov`;
                    const pngUrl = `${VALVE_RENDER_BASE}${name}.png`;

                    return (
                        <video
                            className="hero-render-media"
                            poster={pngUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            key={name}
                            onError={(e) => {
                                // Simple fallback for the whole video element
                                if (name === 'windranger') {
                                    // If windranger video fails, try windrunner
                                    const container = e.target.parentElement;
                                    // This is a bit hacky for a map, better to use state if needed
                                    // But let's see if we can just swap the sources or re-render
                                }
                            }}
                        >
                            <source src={movUrl} type='video/mp4; codecs="hvc1"' />
                            <source src={webmUrl} type="video/webm" />
                            <img src={pngUrl} alt={name} />
                        </video>
                    );
                };

                return (
                    <a
                        key={p.steamId || idx}
                        href={`#player-${p.steamId || p.heroId}`}
                        className="stacked-render-wrapper"
                        style={{ zIndex: 10 - idx }}
                    >
                        {renderVideo(heroName)}
                        <div className="render-player-name">
                            {p.name || p.personaname || 'Unknown'}
                        </div>
                    </a>
                );
            })}
        </div>
    );
};

// --- Main Page Component ---

const MatchDetails = ({ match: propMatch }) => {
    const { id } = useParams();
    const { teams, matchHistory } = useTournament();
    const [activeTab, setActiveTab] = React.useState('overview');

    // 1. Resolve Match Source
    const rawMatch = propMatch || matchHistory.find(m => m.matchId.toString() === id);

    // 2. Process Data (Memoized)
    const match = useMemo(() => processMatchData(rawMatch), [rawMatch]);

    if (!match) return <div className="loading-state">Match not found (ID: {id})</div>;

    // 3. Derived Data
    const radiantPlayers = match.players.filter(p => p.team === 'Radiant');
    const direPlayers = match.players.filter(p => p.team === 'Dire');

    // Winner Display Logic
    let winnerName = match.winner; // "Radiant" or "Dire"
    let winnerClass = match.winner === 'Radiant' ? 'radiant-winner' : 'dire-winner';

    // Attempt to lookup Team Name if IDs exist
    if (match.winner === 'Radiant' && match.radiantTeamId) {
        const t = teams.find(team => team.id.toString() === match.radiantTeamId.toString());
        if (t) winnerName = t.name;
    } else if (match.winner === 'Dire' && match.direTeamId) {
        const t = teams.find(team => team.id.toString() === match.direTeamId.toString());
        if (t) winnerName = t.name;
    }

    const durationMin = Math.floor(match.duration / 60);
    const durationSec = (match.duration % 60).toFixed(0).padStart(2, '0');

    return (
        <div className="match-details-container">
            {/* Scoreboard Header */}
            <div className="match-scoreboard-container">
                <HeroRenderStack players={radiantPlayers} team="Radiant" />

                <div className="match-scoreboard">
                    <div className="team-score radiant">
                        <div className="score-label">Radiant</div>
                        <div className="score-val">{match.radiantScore}</div>
                    </div>

                    <div className="match-meta">
                        <div className={`match-winner-banner ${winnerClass}`}>
                            {winnerName} Victory
                        </div>
                        <div className="meta-row">
                            <span className="meta-id">ID: {match.matchId}</span>
                            <span className="meta-time">{durationMin}:{durationSec}</span>
                        </div>
                    </div>

                    <div className="team-score dire">
                        <div className="score-val">{match.direScore}</div>
                        <div className="score-label">Dire</div>
                    </div>
                </div>

                <HeroRenderStack players={direPlayers} team="Dire" />
            </div>

            {/* Navigation */}
            <div className="tabs">
                <button className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-button ${activeTab === 'heatmaps' ? 'active' : ''}`} onClick={() => setActiveTab('heatmaps')}>Heatmaps</button>
                <button className={`tab-button ${activeTab === 'graphs' ? 'active' : ''}`} onClick={() => setActiveTab('graphs')}>Graphs</button>
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <>
                        <DraftTimeline picksBans={match.picks_bans} />

                        <TeamTable teamName="Radiant" players={radiantPlayers} winner={match.winner} />
                        <TeamTable teamName="Dire" players={direPlayers} winner={match.winner} />

                        <div className="timelines-wrapper">
                            <AbilityTimeline teamName="Radiant" players={radiantPlayers} />
                            <AbilityTimeline teamName="Dire" players={direPlayers} />
                        </div>
                    </>
                )}

                {activeTab === 'heatmaps' && (
                    <div className="heatmap-tab">
                        <div className="section-header">Player Positioning & Wards</div>
                        <HeatmapOverlay players={match.players} wards={match.wards} />
                    </div>
                )}

                {activeTab === 'graphs' && (
                    <div className="graphs-placeholder">
                        <div className="empty-state">
                            <span>Graphs coming soon</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchDetails;
