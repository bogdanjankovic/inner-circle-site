import React from 'react';
import './MatchDetails.css';
import { HeroImage } from '../ui/HeroTooltip';

const HERO_IMG_BASE = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/';
const ITEM_IMG_BASE = 'https://cdn.dota2.com/apps/dota2/images/items/';
const ABILITY_IMG_BASE = 'https://cdn.dota2.com/apps/dota2/images/abilities/';

const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
};

const PlayerRow = ({ p }) => {
    // Determine image using internal heroName
    // fallback if no heroName
    const heroImg = p.heroName ? `${HERO_IMG_BASE}${p.heroName}.png` : null;

    return (
        <tr>
            <td className="left-align">
                <div className="player-cell">
                    {heroImg && <img src={heroImg} alt={p.heroName} className="hero-icon" />}
                    <div className="player-info">
                        <span className="player-name">{p.name}</span>
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
                        // Remove 'item_' prefix if present (parser usually keeps it? check parser)
                        // Parser seems to return names like "item_blink".
                        // Valve CDN expects "blink_lg.png".
                        const cleanItem = item.replace('item_', '');
                        return (
                            <img
                                key={idx}
                                src={`${ITEM_IMG_BASE}${cleanItem}_lg.png`}
                                alt={item}
                                title={item}
                                className="item-icon"
                                onError={(e) => e.target.style.display = 'none'}
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
        <div style={{ marginTop: '2rem' }}>
            <div className="section-header" style={{ color: '#fff', borderLeft: '4px solid #888' }}>
                {teamName} - Ability Build
            </div>
            <div className="ability-grid-header">
                <div style={{ paddingLeft: '10px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#667788', alignSelf: 'center' }}>Player</div>
                {[...Array(25)].map((_, i) => (
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
                            </div>
                        </div>
                        {[...Array(25)].map((_, i) => {
                            const ability = p.ability_build ? p.ability_build[i] : null;
                            if (ability) {
                                return (
                                    <div key={i} style={{ textAlign: 'center' }}>
                                        <img
                                            src={`${ABILITY_IMG_BASE}${ability}_md.png`}
                                            className="ability-icon-small"
                                            title={ability}
                                            onError={(e) => {
                                                // Fallback to _hp1 or default
                                                if (!e.target.src.includes('_hp1')) {
                                                    e.target.src = `${ABILITY_IMG_BASE}${ability}_hp1.png`;
                                                } else {
                                                    e.target.style.opacity = 0;
                                                }
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

// Simple ID to Name map or fetcher is needed. 
// For now, I will implement the Tabs structure and move existing code.

const Minimap = ({ wards, minX, minY, scaleX, scaleY }) => {
    // If no bounds provided, default to standard grid (128x128 centered at 64)
    // But since we are calculating dynamically, we expect props.
    // Fallback: 0-128 if undefined.
    const _minX = minX !== undefined ? minX : 0;
    const _minY = minY !== undefined ? minY : 0;
    const _scaleX = scaleX || 128;
    const _scaleY = scaleY || 128;

    const getPosStyle = (x, y) => {
        // Calculate percentage within bounds
        const xPct = ((x - _minX) / _scaleX) * 100;
        const yPct = ((y - _minY) / _scaleY) * 100;
        return {
            left: `${xPct}%`,
            bottom: `${yPct}%`
        };
    };

    return (
        <div className="minimap" style={{ backgroundImage: `url('/assets/images/dota_map_733.png')`, backgroundSize: 'cover', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 5, left: 5, zIndex: 100, color: 'white', background: 'rgba(0,0,0,0.5)', fontSize: '10px', pointerEvents: 'none' }}>
                DEBUG: Bounds [{_minX.toFixed(0)}, {(_minX + _scaleX).toFixed(0)}, {_minY.toFixed(0)}, {(_minY + _scaleY).toFixed(0)}]<br />
                Wards: {wards ? wards.length : 0} (Obs: {wards ? wards.filter(w => w.type === 'Observer').length : 0}, Sent: {wards ? wards.filter(w => w.type === 'Sentry').length : 0})
            </div>
            {wards && wards.map((w, i) => (
                <div
                    key={i}
                    className={`ward-icon ${w.type === 'Observer' ? 'obs' : 'sent'} team-ward`}
                    style={getPosStyle(w.x, w.y)}
                    title={`${w.type} Ward (${w.x}, ${w.y})`}
                ></div>
            ))}
        </div>
    );
};

const HeatmapOverlay = ({ players, wards }) => {
    const canvasRef = React.useRef(null);

    // Calculate Bounds
    const [bounds, setBounds] = React.useState({ minX: 64, maxX: 192, minY: 64, maxY: 192 });

    React.useEffect(() => {
        let minX = 1000, maxX = 0, minY = 1000, maxY = 0;
        let count = 0;

        // Scan Player positions
        players.forEach(p => {
            if (p.positions) {
                p.positions.forEach(pos => {
                    const x = pos[1];
                    const y = pos[2];
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    count++;
                });
            }
        });

        // Scan Wards
        if (wards) {
            wards.forEach(w => {
                if (w.x < minX) minX = w.x;
                if (w.x > maxX) maxX = w.x;
                if (w.y < minY) minY = w.y;
                if (w.y > maxY) maxY = w.y;
                count++;
            });
        }

        if (count > 0) {
            // Add padding (e.g. 5% edges) to ensure points are not on the border
            const rangeX = maxX - minX;
            const rangeY = maxY - minY;
            // Slightly expand bounds? Or trust the map image covers this exact range?
            // The 7.33 map is square. We should ensure aspect ratio.
            // Let's create a square bounding box centered on data.

            // Heuristic for 7.33: 
            // Observed range is likely approx 64 to 192 (128 width) if offset was removed?
            // Or 0 to 256?
            // Let's assume the Map Image covers the Full Grid.
            // Full Grid is usually 0-256 cells? or 0-16384 world units/128 = 0-128 cells earlier.
            // IF we are seeing raw indices > 128, then the grid is larger.
            // We'll normalize to the Min/Max observed, expecting the map image to align with the PLAY AREA.

            // For safety, force square aspect ratio
            let size = Math.max(rangeX, rangeY);
            // Min size 128 to avoid zoom in too much on short games
            if (size < 128) size = 128;

            // Center
            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;

            setBounds({
                minX: cx - size / 2,
                maxX: cx + size / 2,
                minY: cy - size / 2,
                maxY: cy + size / 2
            });
        }
    }, [players, wards]);

    const scaleX = bounds.maxX - bounds.minX;
    const scaleY = bounds.maxY - bounds.minY;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous

        // Draw Heatmap
        players.forEach(p => {
            if (!p.positions) return;

            // Determine color based on team
            const color = p.team === 'Radiant' ? 'rgba(61, 149, 70, 0.1)' : 'rgba(194, 60, 42, 0.1)';
            ctx.fillStyle = color;

            p.positions.forEach(pos => {
                const x = pos[1];
                const y = pos[2];

                // Map to canvas
                const cx = ((x - bounds.minX) / scaleX) * canvas.width;
                // Flip Y for canvas
                const cy = canvas.height - (((y - bounds.minY) / scaleY) * canvas.height);

                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, 2 * Math.PI); // Radius 3
                ctx.fill();
            });
        });

    }, [players, bounds, scaleX, scaleY]);

    return (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center' }}>
            <div className="minimap-wrapper" style={{ flex: '0 0 auto' }}>
                {/* Pass calculated bounds to Minimap for wards */}
                <Minimap wards={wards} minX={bounds.minX} minY={bounds.minY} scaleX={scaleX} scaleY={scaleY} />

                {/* Overlay Canvas */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <canvas
                        ref={canvasRef}
                        width={512}
                        height={512}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            </div>

            {/* Legend Side Panel */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#15191f',
                padding: '15px',
                borderRadius: '4px',
                minWidth: '200px'
            }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '4px' }}>
                    Legend
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(61, 149, 70, 0.8)' }}></div>
                    <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Radiant Movement</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(194, 60, 42, 0.8)' }}></div>
                    <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Dire Movement</div>
                </div>

                <div style={{ marginTop: '10px', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '4px' }}>
                    Wards
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="ward-dot obs"></div>
                    <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Observer Ward</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="ward-dot sent"></div>
                    <div style={{ color: '#ccc', fontSize: '0.9rem' }}>Sentry Ward</div>
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
                <button className={`tab-button ${activeTab === 'vision' ? 'active' : ''}`} onClick={() => setActiveTab('vision')}>Vision</button>
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

            {activeTab === 'vision' && (
                <div className="vision-tab">
                    <h3>Ward Map</h3>
                    <div className="minimap-wrapper">
                        <Minimap wards={match.wards} />
                        <div className="minimap-legend">
                            <div className="legend-item"><span className="ward-dot obs"></span> Observer</div>
                            <div className="legend-item"><span className="ward-dot sent"></span> Sentry</div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'heatmaps' && (
                <div className="heatmap-tab">
                    <h3>Player Positioning Heatmap & Ward Map</h3>
                    <div className="minimap-wrapper">
                        {/* Pass both players and wards to Overlay, which handles Minimap internally now */}
                        <HeatmapOverlay players={match.players} wards={match.wards} />
                    </div>
                </div>
            )}

        </div>
    );
};

export default MatchDetails;
