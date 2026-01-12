import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { HeroImage } from '../components/ui/HeroTooltip';

const Results = () => {
    const { matchHistory, teams } = useTournament();
    const [expandedMatch, setExpandedMatch] = useState(null);

    const toggleMatch = (id) => {
        setExpandedMatch(expandedMatch === id ? null : id);
    };

    const formatDate = (ts) => {
        if (!ts) return "Unknown Date";
        return new Date(ts).toLocaleString();
    };

    // Helper to resolve player name
    const getPlayerName = (p) => {
        if (p.tournamentPlayerId && teams) {
            for (const t of teams) {
                // Match by steamId, not id
                const found = t.players?.find(tp => tp.steamId === p.tournamentPlayerId);
                if (found) return found.personaName || found.name;
            }
        }
        return p.name || p.personaName || 'Unknown';
    };

    const getItemImageUrl = (itemName) => {
        if (!itemName) return '';
        const cleanName = itemName.replace(/"/g, "").replace('item_', '');
        const snake = cleanName.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
        return `https://steamcdn-a.akamaihd.net/apps/dota2/images/items/${snake}_lg.png`;
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Istorija Mečeve</h1>

            {!matchHistory || matchHistory.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: '#888' }}>Nema odigranih mečeva.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {matchHistory.map((match, index) => {
                        const isRadiantWin = match.winner === 'Radiant';

                        return (
                            <div key={index} className="card" style={{ padding: '0', overflow: 'hidden', border: isRadiantWin ? '1px solid #2c5e2c' : '1px solid #5e2c2c' }}>
                                {/* Header */}
                                <div
                                    onClick={() => toggleMatch(match.matchId || index)}
                                    style={{
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        background: isRadiantWin
                                            ? 'linear-gradient(90deg, rgba(46,139,87,0.1) 0%, #111 50%, rgba(46,139,87,0.0) 100%)'
                                            : 'linear-gradient(90deg, rgba(139,46,46,0.1) 0%, #111 50%, rgba(139,46,46,0.0) 100%)',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto 1fr',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}
                                >
                                    {/* Radiant Team */}
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isRadiantWin ? '#4caf50' : 'white' }}>
                                            {match.radiantTeamName || 'Radiant'} {isRadiantWin && '🏆'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#4caf50' }}>Radiant</div>
                                    </div>

                                    {/* Score / VS */}
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#aaa' }}>VS</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{formatDate(match.timestamp)}</div>
                                    </div>

                                    {/* Dire Team */}
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: !isRadiantWin ? '#f44336' : 'white' }}>
                                            {!isRadiantWin && '🏆'} {match.direTeamName || 'Dire'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#f44336' }}>Dire</div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {(expandedMatch === (match.matchId || index)) && (
                                    <div style={{ padding: '1rem', background: '#111', overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '800px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Player</th>
                                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Hero</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Lvl</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>K/D/A</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>LH/DN</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Net Worth</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>GPM / XPM</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Rosh</th>
                                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Items</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(match.players || []).sort((a, b) => (a.team === 'Radiant' ? 0 : 1) - (b.team === 'Radiant' ? 0 : 1)).map((p, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                                        <td style={{ padding: '0.5rem', color: p.team === 'Radiant' ? '#4caf50' : '#f44336', fontWeight: p.tournamentPlayerId ? 'bold' : 'normal' }}>
                                                            {getPlayerName(p)}
                                                            {p.team === 'Radiant' && p.tournamentPlayerId && <span style={{ marginLeft: '5px', fontSize: '0.7em', color: '#4caf50' }}>✓</span>}
                                                            {p.team === 'Dire' && p.tournamentPlayerId && <span style={{ marginLeft: '5px', fontSize: '0.7em', color: '#f44336' }}>✓</span>}
                                                        </td>
                                                        <td style={{ padding: '0.5rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <HeroImage heroId={p.heroId} />
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: '#ccc' }}>{p.level}</td>
                                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                            <span style={{ color: '#4caf50' }}>{p.kills}</span>/
                                                            <span style={{ color: '#f44336' }}>{p.deaths}</span>/
                                                            <span style={{ color: '#fff' }}>{p.assists}</span>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: '#aaa' }}>{p.lastHits || 0}/{p.denies || 0}</td>
                                                        <td style={{ textAlign: 'center', color: '#ffd700' }}>{(p.netWorth || 0).toLocaleString()}</td>
                                                        <td style={{ textAlign: 'center', color: '#aaa' }}>{p.gpm || 0} <span style={{ color: '#444' }}>/</span> {p.xpm || 0}</td>
                                                        <td style={{ textAlign: 'center', color: '#b8860b' }}>{p.roshans || '-'}</td>
                                                        <td style={{ padding: '0.5rem' }}>
                                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                                {p.items && p.items.map((item, i) => (
                                                                    <img
                                                                        key={i}
                                                                        src={getItemImageUrl(item)}
                                                                        alt={item}
                                                                        title={item}
                                                                        style={{ width: '32px', height: '24px', borderRadius: '2px', background: '#222' }}
                                                                        onError={(e) => e.target.style.display = 'none'}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Results;
