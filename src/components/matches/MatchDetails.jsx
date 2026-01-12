import React from 'react';
import './MatchDetails.css';

const HERO_IMG_BASE = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/';
const ITEM_IMG_BASE = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/';
const ABILITY_IMG_BASE = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/abilities/';

const formatNumber = (num) => {
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
                    {p.items.map((item, idx) => (
                        <img
                            key={idx}
                            src={`${ITEM_IMG_BASE}${item}.png`}
                            alt={item}
                            title={item}
                            className="item-icon"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    ))}
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
                            const ability = p.abilityMap ? p.abilityMap[i] : null;
                            if (ability) {
                                return (
                                    <div key={i} style={{ textAlign: 'center' }}>
                                        <img
                                            src={`${ABILITY_IMG_BASE}${ability}.png`}
                                            className="ability-icon-small"
                                            title={ability}
                                            onError={(e) => e.target.style.opacity = 0}
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

const MatchDetails = ({ match }) => {
    if (!match || !match.players) return <div style={{ padding: '1rem', color: '#888' }}>No match details available</div>;

    const radiantPlayers = match.players.filter(p => p.team === 'Radiant');
    const direPlayers = match.players.filter(p => p.team === 'Dire');

    return (
        <div className="match-details-container">
            <TeamTable teamName="Radiant" players={radiantPlayers} winner={match.winner} />
            <TeamTable teamName="Dire" players={direPlayers} winner={match.winner} />

            <AbilityBuildGrid teamName="Radiant" players={radiantPlayers} />
            <AbilityBuildGrid teamName="Dire" players={direPlayers} />
        </div>
    );
};

export default MatchDetails;
