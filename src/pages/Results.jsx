import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';

import MatchDetails from '../components/matches/MatchDetails';

const Results = () => {
    const { matchHistory, teams } = useTournament();
    const [expandedMatch, setExpandedMatch] = useState(null);

    const toggleMatch = (id) => {
        setExpandedMatch(expandedMatch === id ? null : id);
    };

    const formatDate = (ts) => {
        if (!ts) return "Nepoznat Datum";
        return new Date(ts).toLocaleString();
    };





    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Istorija Mečeva</h1>

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
                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                                        <div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isRadiantWin ? '#4caf50' : 'white' }}>
                                                {match.radiantTeamName || teams?.find(t => t.id === match.radiantTeamId)?.name || 'Radiant'} {isRadiantWin && '🏆'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#4caf50' }}>Radiant</div>
                                        </div>
                                        {teams?.find(t => t.id === match.radiantTeamId)?.logo && (
                                            <img
                                                src={teams.find(t => t.id === match.radiantTeamId).logo}
                                                alt="Radiant Logo"
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }}
                                            />
                                        )}
                                    </div>

                                    {/* Score / VS */}
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#aaa' }}>VS</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{formatDate(match.timestamp)}</div>
                                    </div>

                                    {/* Dire Team */}
                                    <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {teams?.find(t => t.id === match.direTeamId)?.logo && (
                                            <img
                                                src={teams.find(t => t.id === match.direTeamId).logo}
                                                alt="Dire Logo"
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }}
                                            />
                                        )}
                                        <div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: !isRadiantWin ? '#f44336' : 'white' }}>
                                                {!isRadiantWin && '🏆'} {match.direTeamName || teams?.find(t => t.id === match.direTeamId)?.name || 'Dire'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#f44336' }}>Dire</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {(expandedMatch === (match.matchId || index)) && (
                                    <div style={{ padding: '0', background: '#111', overflowHidden: 'true' }}>
                                        <MatchDetails match={match} />
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
