import { useTournament } from '../context/TournamentContext';

const Matches = () => {
    const { activeTournament } = useTournament();

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ marginBottom: '2rem' }}>Raspored Mečeva</h1>

            {!activeTournament ? (
                <div className="card">Nema zakazanih mečeva.</div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {activeTournament.matches.map(m => (
                        <div key={m.matchId} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 'bold' }}>{m.team1.name}</div>
                            <div style={{ color: 'var(--accent)' }}>VS</div>
                            <div style={{ fontWeight: 'bold' }}>{m.team2.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date().toLocaleDateString()} 20:00</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Matches;
