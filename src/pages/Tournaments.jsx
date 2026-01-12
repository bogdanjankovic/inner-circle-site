import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { getMatchDetails } from '../services/dotaApi';

const Tournaments = () => {
    const { activeTournament } = useTournament();

    const getTeamMMR = (team) => {
        let total = 0;
        let count = 0;
        if (!team || !team.players) return 0;

        team.players.forEach(p => {
            if (p.rankTier) {
                total += p.rankTier;
                count++;
            }
        });
        return count > 0 ? total / count : 0;
    };



    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1>Turniri</h1>
            </div>

            {!activeTournament ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3>Nema aktivnih turnira</h3>
                    <p>Trenutno nema turnira u toku. Pratite obaveštenja!</p>
                </div>
            ) : (
                <div>
                    <h2 style={{ color: 'var(--accent)', marginBottom: '2rem' }}>{activeTournament.name}</h2>

                    <div style={{ display: 'grid', gap: '2rem' }}>
                        {activeTournament.bracket_data?.map((match, i) => (
                            <div key={match.matchId} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', position: 'relative' }}>
                                {match.scheduledTime && (
                                    <div style={{
                                        position: 'absolute', top: '0.5rem', left: '50%', transform: 'translateX(-50%)',
                                        fontSize: '0.8rem', color: '#fdd835', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.5rem', borderRadius: '4px'
                                    }}>
                                        {new Date(match.scheduledTime).toLocaleString('sr-RS', { weekday: 'short', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                    </div>
                                )}
                                <div style={{ textAlign: 'right', width: '40%' }}>
                                    <h4 style={{ margin: 0, color: match.winner === match.team1?.id ? '#4caf50' : 'white' }}>
                                        {match.team1?.name || 'TBD'}
                                        {match.winner === match.team1?.id && ' ✓'}
                                    </h4>
                                    <small style={{ color: '#888' }}>{match.team1 ? `Avg Rank: ${getTeamMMR(match.team1).toFixed(0)}` : ''}</small>
                                </div>

                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                    {match.winner ? <span style={{ fontSize: '1rem', color: '#4caf50' }}>FINISHED</span> : 'VS'}
                                </div>

                                <div style={{ textAlign: 'left', width: '40%' }}>
                                    <h4 style={{ margin: 0, color: match.winner === match.team2?.id ? '#4caf50' : 'white' }}>
                                        {match.team2?.name || 'TBD'}
                                        {match.winner === match.team2?.id && ' ✓'}
                                    </h4>
                                    <small style={{ color: '#888' }}>{match.team2 ? `Avg Rank: ${getTeamMMR(match.team2).toFixed(0)}` : ''}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tournaments;
