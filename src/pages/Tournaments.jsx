import { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { getMatchDetails } from '../services/dotaApi';
import Bracket from '../components/ui/Bracket';
import { useLocation } from 'react-router-dom';

const Tournaments = () => {
    const { activeTournament, tournaments, teams } = useTournament();
    const [expandedArchive, setExpandedArchive] = useState(null);
    const location = useLocation();

    // Auto-expand and scroll from URL hash
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#tournament-', '');
            setExpandedArchive(Number(id) || id); // Handle string/number ID mismatch
            setTimeout(() => {
                const element = document.getElementById(`tournament-${id}`);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }, [location.hash, tournaments]);

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

    const archivedTournaments = tournaments.filter(t => t.status === 'archived');

    const renderTournamentContent = (tournament) => {
        if (!tournament) return null;

        // Winner Banner for Finished Tournaments inside Archive
        const winnerTeam = teams.find(t => t.id == tournament.winner);

        return (
            <div style={{ display: 'grid', gap: '2rem' }}>
                {winnerTeam && (
                    <div className="card" style={{
                        background: 'linear-gradient(to right, #1a237e, #000)',
                        textAlign: 'center',
                        border: '1px solid #ffd700',
                        padding: '1rem'
                    }}>
                        <h3 style={{ color: '#ffd700', margin: 0 }}>🏆 Winner: {winnerTeam.name} 🏆</h3>
                    </div>
                )}

                {/* Bracket or List */}
                {(tournament.config?.type === 'single_elimination' ||
                    tournament.bracket_data?.some(m => m.round > 1 || m.nextMatchId || m.placeholder)) ? (
                    <Bracket matches={tournament.bracket_data || []} />
                ) : (
                    // Use List for Round Robin or Legacy
                    tournament.bracket_data?.map((match, i) => (
                        <div key={match.matchId} className="card" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto 1fr',
                            alignItems: 'center',
                            padding: '1rem',
                            position: 'relative',
                            opacity: match.winner ? 0.7 : 1,
                            border: match.winner ? '1px solid #333' : '1px solid var(--accent)',
                            background: 'rgba(0,0,0,0.3)'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: match.winner == match.team1?.id ? '#4caf50' : (match.winner ? '#888' : 'white') }}>
                                    {match.team1?.name || 'TBD'}
                                </h4>
                                {(match.team1Score !== undefined) && (
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: match.team1Score > (match.team2Score || 0) ? '#4caf50' : '#888' }}>
                                        {match.team1Score}
                                    </div>
                                )}
                            </div>

                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#666', textAlign: 'center' }}>
                                {match.winner ? <span style={{ fontSize: '0.9rem', border: '1px solid #444', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>ZAVRŠENO</span> : 'VS'}
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: match.winner == match.team2?.id ? '#4caf50' : (match.winner ? '#888' : 'white') }}>
                                    {match.team2?.name || 'TBD'}
                                </h4>
                                {(match.team2Score !== undefined) && (
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: match.team2Score > (match.team1Score || 0) ? '#4caf50' : '#888' }}>
                                        {match.team2Score}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1>Turniri</h1>
            </div>

            {/* Active Tournament Section */}
            {activeTournament && (
                <div style={{ marginBottom: '4rem' }}>
                    <h2 style={{ color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '10px', height: '10px', background: '#4caf50', borderRadius: '50%', display: 'inline-block' }}></span>
                        U Toku: {activeTournament.name}
                    </h2>
                    {renderTournamentContent(activeTournament)}
                </div>
            )}

            {/* Archived Tournaments Section */}
            <h2 style={{ color: '#aaa', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '2rem' }}>Arhiva</h2>

            {archivedTournaments.length === 0 ? (
                <p style={{ color: '#666' }}>Nema arhiviranih turnira.</p>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {archivedTournaments.map(tournament => {
                        const isExpanded = expandedArchive === tournament.id;
                        const winnerTeam = teams.find(t => t.id == tournament.winner);

                        return (
                            <div
                                id={`tournament-${tournament.id}`}
                                key={tournament.id}
                                style={{
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    overflow: 'hidden',
                                    background: isExpanded ? 'rgba(0,0,0,0.2)' : 'linear-gradient(to right, #222, #111)',
                                }}
                            >
                                {/* Header / Trigger */}
                                <div
                                    onClick={() => setExpandedArchive(isExpanded ? null : tournament.id)}
                                    style={{
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)'
                                    }}
                                >
                                    <div>
                                        <h3 style={{ margin: 0, color: '#ccc' }}>{tournament.name}</h3>
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                            {new Date(tournament.created_at).toLocaleDateString()} &bull; {tournament.bracket_data?.length || 0} Mečeva
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {winnerTeam && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ffd700', fontWeight: 'bold' }}>
                                                🏆 {winnerTeam.name}
                                            </div>
                                        )}
                                        <div style={{ color: '#888', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                {/* Collapsible Content */}
                                {isExpanded && (
                                    <div style={{ padding: '2rem', borderTop: '1px solid #333', background: 'rgba(0,0,0,0.5)' }}>
                                        {renderTournamentContent(tournament)}
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

export default Tournaments;
