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
                    {activeTournament.matches.map(m => (
                        <div key={m.matchId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div
                                style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#15191f' }}
                                onClick={() => toggleMatch(m.matchId)}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{m.team1.name}</div>
                                <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>VS</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{m.team2.name}</div>
                                <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: '#666', letterSpacing: '1px' }}>
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>

                            {/* Expandable Details */}
                            {expandedMatchId === m.matchId && (
                                <div style={{ borderTop: '1px solid #222' }}>
                                    {/* Pass 'm' as match data. Assuming 'm' has the structure from parser 
                                        OR 'm.stats' has it. If AdminUpload merges them, 'm' might be it.
                                        For safety, let's pass 'm' directly. */}
                                    <MatchDetails match={m} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Matches;
