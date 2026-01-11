import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { getMatchDetails } from '../services/dotaApi';

const Tournaments = () => {
    const { teams, activeTournament, createTournament, processMatchStats } = useTournament();
    const [matchIdInput, setMatchIdInput] = useState('');
    const [processing, setProcessing] = useState(false);

    const getTeamMMR = (team) => {
        let total = 0;
        let count = 0;
        if (!team.players) return 0;

        team.players.forEach(p => {
            if (p.rankTier) {
                total += p.rankTier;
                count++;
            }
        });
        return count > 0 ? total / count : 0;
    };

    const handleGenerateBracket = () => {
        if (teams.length < 2) {
            alert("Potrebna su bar 2 tima za turnir!");
            return;
        }

        // 1. Sort by Strength (Seeding)
        const sortedTeams = [...teams].sort((a, b) => getTeamMMR(b) - getTeamMMR(a));

        // 2. Generate Round 1 (Best vs Worst)
        const round1 = [];
        const pool = [...sortedTeams];

        while (pool.length >= 2) {
            const strong = pool.shift();
            const weak = pool.pop();
            round1.push({
                matchId: Date.now() + Math.random(),
                team1: strong,
                team2: weak,
                winner: null
            });
        }

        createTournament(`Turnir #${Math.floor(Math.random() * 1000)}`, round1);
    };

    const handleProcessMatch = async () => {
        if (!matchIdInput) return;
        setProcessing(true);
        const details = await getMatchDetails(matchIdInput);
        if (details) {
            processMatchStats(details);
            setMatchIdInput('');
        } else {
            alert('Meč nije pronađen ili je došlo do greške (OpenDota API)');
        }
        setProcessing(false);
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1>Turniri</h1>
                <button className="btn" onClick={handleGenerateBracket}>
                    Generiši Žreb (Auto-Balance)
                </button>
            </div>

            {!activeTournament ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3>Nema aktivnih turnira</h3>
                    <p>Kreirajte novi turnir koristeći dugme iznad (zahteva registrovane timove).</p>
                    <p>Trenutno registrovanih timova: {teams.length}</p>
                </div>
            ) : (
                <div>
                    <h2 style={{ color: 'var(--accent)', marginBottom: '2rem' }}>{activeTournament.name} - Četvrtfinale</h2>

                    <div style={{ display: 'grid', gap: '2rem' }}>
                        {activeTournament.matches.map((match, i) => (
                            <div key={match.matchId} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
                                <div style={{ textAlign: 'right', width: '40%' }}>
                                    <h4 style={{ margin: 0 }}>{match.team1.name}</h4>
                                    <small style={{ color: '#888' }}>Avg Rank: {getTeamMMR(match.team1).toFixed(0)}</small>
                                </div>

                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>VS</div>

                                <div style={{ textAlign: 'left', width: '40%' }}>
                                    <h4 style={{ margin: 0 }}>{match.team2.name}</h4>
                                    <small style={{ color: '#888' }}>Avg Rank: {getTeamMMR(match.team2).toFixed(0)}</small>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                        <h3>Admin Panel: Unos Rezultata</h3>
                        <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>
                            Unesite Match ID nakon odigrane partije da bi se ažurirala statistika (Tormentori, Runes, itd.)
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', maxWidth: '400px' }}>
                            <input
                                type="text"
                                placeholder="Match ID (npr. 7548231902)"
                                value={matchIdInput}
                                onChange={(e) => setMatchIdInput(e.target.value)}
                            />
                            <button className="btn" onClick={handleProcessMatch} disabled={processing}>
                                {processing ? 'Učitavanje...' : 'Procesiraj'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tournaments;
