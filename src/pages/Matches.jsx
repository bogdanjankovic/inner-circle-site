import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import MatchDetails from '../components/matches/MatchDetails';

const Matches = () => {
    const { activeTournament } = useTournament();
    const [expandedMatchId, setExpandedMatchId] = useState(null);

    const toggleMatch = (id) => {
        setExpandedMatchId(expandedMatchId === id ? null : id);
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ marginBottom: '2rem' }}>Raspored Mečeva</h1>

            {!activeTournament ? (
                <div className="card">Nema zakazanih mečeva.</div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {(activeTournament.bracket_data || [])
                        .filter(m => !m.winner) // ONLY Upcoming matches
                        .sort((a, b) => new Date(a.scheduledTime || 9999999999999) - new Date(b.scheduledTime || 9999999999999))
                        .map(m => (
                            <div key={m.matchId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div
                                    style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', cursor: 'pointer', background: '#15191f', gap: '1rem' }}
                                    onClick={() => toggleMatch(m.matchId)}
                                >
                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'right' }}>
                                        {m.team1?.name || 'TBD'}
                                        {(m.team1Score > 0 || m.team2Score > 0) && (
                                            <span style={{ marginLeft: '10px', color: m.team1Score > m.team2Score ? '#4caf50' : '#888' }}>
                                                ({m.team1Score})
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.5rem' }}>VS</div>
                                        {m.scheduledTime ? (
                                            <div style={{ fontSize: '0.9rem', color: '#fdd835', fontWeight: 'bold', marginTop: '0.2rem' }}>
                                                {new Date(m.scheduledTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {new Date(m.scheduledTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>TBA</div>
                                        )}
                                    </div>

                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'left' }}>
                                        {(m.team1Score > 0 || m.team2Score > 0) && (
                                            <span style={{ marginRight: '10px', color: m.team2Score > m.team1Score ? '#4caf50' : '#888' }}>
                                                ({m.team2Score})
                                            </span>
                                        )}
                                        {m.team2?.name || 'TBD'}
                                    </div>
                                </div>

                                {/* Expandable Details */}
                                {expandedMatchId === m.matchId && (
                                    <div style={{ borderTop: '1px solid #222', padding: '1rem', textAlign: 'center', color: '#888' }}>
                                        Detalji meča će se prikazati ovde kada meč počne.
                                    </div>
                                )}
                            </div>
                        ))}
                    {(activeTournament.bracket_data || []).filter(m => !m.winner).length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <h3>Nema predstojećih mečeva</h3>
                            <p>Svi mečevi u trenutnom turniru su završeni.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Matches;
