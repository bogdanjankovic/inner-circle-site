import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { HeroImage } from '../components/ui/HeroTooltip';

const Results = () => {
    const { matchHistory } = useTournament();
    const [expandedMatch, setExpandedMatch] = useState(null);

    const toggleMatch = (id) => {
        setExpandedMatch(expandedMatch === id ? null : id);
    };

    const formatDate = (ts) => {
        if (!ts) return "Unknown Date";
        return new Date(ts).toLocaleString();
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
                        const duration = (match.duration / 60).toFixed(0) + " min"; // If duration exists

                        return (
                            <div key={index} className="card" style={{ padding: '0', overflow: 'hidden', border: isRadiantWin ? '1px solid #2c5e2c' : '1px solid #5e2c2c' }}>
                                {/* Header */}
                                <div
                                    onClick={() => toggleMatch(match.matchId || index)}
                                    style={{
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        background: isRadiantWin ? 'linear-gradient(90deg, rgba(46,139,87,0.2) 0%, rgba(0,0,0,0) 100%)' : 'linear-gradient(90deg, rgba(139,46,46,0.2) 0%, rgba(0,0,0,0) 100%)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            fontWeight: 'bold',
                                            fontSize: '1.2rem',
                                            color: isRadiantWin ? '#4caf50' : '#f44336'
                                        }}>
                                            {isRadiantWin ? 'RADIANT VICTORY' : 'DIRE VICTORY'}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                            Match ID: {match.matchId}
                                        </div>
                                    </div>
                                    <div style={{ color: '#aaa' }}>
                                        {formatDate(match.timestamp)}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {(expandedMatch === (match.matchId || index)) && (
                                    <div style={{ padding: '1rem', background: '#111' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Player</th>
                                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Hero</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Lvl</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>K/D/A</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>LH/DN</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Net Worth</th>
                                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>GPM/XPM</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {match.players.sort((a, b) => (a.team === 'Radiant' ? 0 : 1) - (b.team === 'Radiant' ? 0 : 1)).map((p, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                                        <td style={{ padding: '0.5rem', color: p.team === 'Radiant' ? '#4caf50' : '#f44336' }}>
                                                            {p.name || p.personaName || 'Unknown'}
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
                                                        <td style={{ textAlign: 'center', color: '#aaa' }}>{p.lastHits || p.cs?.split('/')[0]}/{p.denies || p.cs?.split('/')[1]}</td>
                                                        <td style={{ textAlign: 'center', color: '#ffd700' }}>{p.netWorth?.toLocaleString()}</td>
                                                        <td style={{ textAlign: 'center', color: '#aaa' }}>{p.gpm || '-'}/{p.xpm || '-'}</td>
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
