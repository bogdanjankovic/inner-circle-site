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
                        {/* Winner Banner if applicable */}
                        {activeTournament.bracket_data?.every(m => m.winner) && (
                            <div className="card" style={{ background: 'linear-gradient(45deg, #1a237e, #0d47a1)', textAlign: 'center', border: '2px solid #ffd700' }}>
                                <h1 style={{ color: '#ffd700', textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>🏆 TURNIR ZAVRŠEN 🏆</h1>
                                <h3>Pobednik: {activeTournament.bracket_data[activeTournament.bracket_data.length - 1].winner === activeTournament.bracket_data[activeTournament.bracket_data.length - 1].team1?.id
                                    ? activeTournament.bracket_data[activeTournament.bracket_data.length - 1].team1?.name
                                    : activeTournament.bracket_data[activeTournament.bracket_data.length - 1].team2?.name}</h3>
                            </div>
                        )}

                        {activeTournament.bracket_data?.map((match, i) => (
                            <div key={match.matchId} className="card" style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto 1fr',
                                alignItems: 'center',
                                padding: '1.5rem',
                                position: 'relative',
                                opacity: match.winner ? 0.7 : 1,
                                border: match.winner ? '1px solid #333' : '1px solid var(--accent)'
                            }}>
                                {/* Date Badge - Fixed Position */}
                                {match.scheduledTime && (
                                    <div style={{
                                        position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                                        fontSize: '0.85rem', color: '#111', fontWeight: 'bold',
                                        background: '#fdd835', padding: '0.2rem 1rem', borderRadius: '20px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                                    }}>
                                        {new Date(match.scheduledTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} {new Date(match.scheduledTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}

                                <div style={{ textAlign: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: match.winner === match.team1?.id ? '#4caf50' : (match.winner ? '#666' : 'white') }}>
                                        {match.team1?.name || 'TBD'}
                                        {match.winner === match.team1?.id && ' 🏆'}
                                    </h4>
                                    {match.team1 && <small style={{ color: '#666' }}>Prosečan Rank: {getTeamMMR(match.team1).toFixed(0)}</small>}
                                </div>

                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: match.winner ? '#666' : 'var(--accent)', textAlign: 'center' }}>
                                    {match.winner ? <span style={{ fontSize: '0.9rem', border: '1px solid #444', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>ZAVRŠENO</span> : 'VS'}
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: match.winner === match.team2?.id ? '#4caf50' : (match.winner ? '#666' : 'white') }}>
                                        {match.team2?.name || 'TBD'}
                                        {match.winner === match.team2?.id && ' 🏆'}
                                    </h4>
                                    {match.team2 && <small style={{ color: '#666' }}>Prosečan Rank: {getTeamMMR(match.team2).toFixed(0)}</small>}
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
