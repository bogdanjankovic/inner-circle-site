import { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import RankDisplay from '../components/ui/RankDisplay';
import HeroTooltip, { HeroImage } from '../components/ui/HeroTooltip';
import PlayerModal from '../components/players/PlayerModal';
import { steamIdToAccountId } from '../services/dotaApi';

// --- Shared/Duplicated Components for Modals (Ideally move to /components/ui) ---

// Position data definitions
const POSITIONS = [
    { id: 1, name: 'Carry', icon: 'https://i.imgur.com/rL1ZwZ4.png' },
    { id: 2, name: 'Midlane', icon: 'https://i.imgur.com/7oAbbDo.png' },
    { id: 3, name: 'Offlaner', icon: 'https://i.imgur.com/ThXJQ0n.png' },
    { id: 4, name: 'Soft Support', icon: 'https://i.imgur.com/NkAmIjB.png' },
    { id: 5, name: 'Hard Support', icon: 'https://i.imgur.com/TGv7onk.png' }
];

// (Local PlayerModal removed, using imported one)

const TeamModal = ({ team, onClose, onPlayerClick }) => {
    if (!team) return null;
    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-modal" onClick={onClose}>&times;</button>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src={team.logo} alt={team.name} style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--border)', marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '3rem', color: 'var(--accent)', margin: 0 }}>{team.name}</h2>

                    {/* Team Strength Calculation */}
                    {(() => {
                        const rankedPlayers = team.players.filter(p => p.rankTier);
                        if (rankedPlayers.length > 0) {
                            const totalRank = rankedPlayers.reduce((sum, p) => sum + p.rankTier, 0);
                            const avgRank = Math.round(totalRank / rankedPlayers.length);
                            return (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <span style={{ color: '#aaa', fontSize: '1rem' }}>Team Strength:</span>
                                    <RankDisplay rankTier={avgRank} width="32px" />
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Registrovan: {new Date(team.registeredAt).toLocaleDateString()}
                    </div>
                </div>

                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Roster</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {team.players.map((player, idx) => (
                        <div
                            key={idx}
                            className="card"
                            style={{ cursor: 'pointer', transition: 'transform 0.2s', textAlign: 'center' }}
                            onClick={() => onPlayerClick({ ...player, teamName: team.name })}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div className="hero-tooltip-container" style={{ display: 'inline-block' }}>
                                <img src={player.avatar || 'https://via.placeholder.com/150'} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem' }} />
                                {player.isCaptain && <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>♔ Kapiten</div>}
                                <HeroTooltip heroes={player.topHeroes} />
                            </div>
                            <h4 style={{ margin: '0.5rem 0' }}>{player.personaName}</h4>
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '0.2rem', fontWeight: 'bold' }}>
                                {player.position ? POSITIONS.find(p => p.id === player.position)?.name : ''}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#888' }}>{player.rankTier ? <RankDisplay rankTier={player.rankTier} width="30px" /> : 'Unranked'}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Teams = () => {
    const { teams, tournamentStats } = useTournament();
    const location = useLocation();
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    // Check if we need to open team modal from navigation state
    useEffect(() => {
        if (location.state?.openTeamModal && location.state?.teamName) {
            const team = teams.find(t => t.name === location.state.teamName);
            if (team) {
                setSelectedTeam(team);
                // Clear the state to prevent reopening on refresh
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, [location.state, teams]);

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '3rem', color: '#fff' }}>Prijavljeni Timovi</h1>

            {selectedTeam && (
                <TeamModal
                    team={selectedTeam}
                    onClose={() => setSelectedTeam(null)}
                    onPlayerClick={(p) => setSelectedPlayer(p)}
                />
            )}

            {selectedPlayer && (
                <PlayerModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    stats={selectedPlayer.steamId ? tournamentStats[steamIdToAccountId(selectedPlayer.steamId.toString())] : null}
                />
            )}

            {teams.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888' }}>
                    <p>Nema prijavljenih timova.</p>
                    <Link to="/register" className="btn" style={{ marginTop: '1rem' }}>Prijavi Tim</Link>
                </div>
            ) : (
                <div className="team-card-grid">
                    {teams
                        .filter(t => t.stats?.type !== 'shuffle')
                        .map(t => {
                            // Calculate Strength for Sorting
                            let total = 0, count = 0;
                            if (t.players) t.players.forEach(p => { if (p.rankTier) { total += p.rankTier; count++; } });
                            t.strengthScore = count > 0 ? total / count : 0;
                            return t;
                        })
                        .sort((a, b) => b.strengthScore - a.strengthScore)
                        .map((team, index) => {
                            // Rank Badge Colors
                            let rankBadgeColor = '#333';
                            let rankTextColor = '#aaa';
                            let rankBorder = '1px solid #444';

                            if (index === 0) { rankBadgeColor = 'linear-gradient(45deg, #ffd700, #b8860b)'; rankTextColor = '#000'; rankBorder = 'none'; } // Gold
                            if (index === 1) { rankBadgeColor = 'linear-gradient(45deg, #c0c0c0, #7f7f7f)'; rankTextColor = '#000'; rankBorder = 'none'; } // Silver
                            if (index === 2) { rankBadgeColor = 'linear-gradient(45deg, #cd7f32, #8b4513)'; rankTextColor = '#fff'; rankBorder = 'none'; } // Bronze

                            return (
                                <div
                                    key={team.id}
                                    className="card"
                                    style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                    onClick={() => setSelectedTeam(team)}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <img
                                            src={team.logo}
                                            alt={team.name}
                                            style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h3 style={{ margin: 0, color: '#fff' }}>{team.name}</h3>

                                                {/* Power Rank Badge */}
                                                <div style={{
                                                    background: rankBadgeColor,
                                                    color: rankTextColor,
                                                    border: rankBorder,
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    boxShadow: index < 3 ? '0 2px 5px rgba(0,0,0,0.3)' : 'none'
                                                }}>
                                                    Power Rank #{index + 1}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>
                                                Winrate: {team.stats?.winrate || 0}%
                                            </div>

                                            {/* Trophies Section */}
                                            {team.trophies && team.trophies.length > 0 && (
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                    {team.trophies.map(t => (
                                                        <Link
                                                            to={`/tournaments#tournament-${t.id}`}
                                                            key={t.id}
                                                            title={`Osvajač: ${t.name}`} // Improved title
                                                            style={{
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s',
                                                                display: 'inline-block'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        >
                                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="gold" xmlns="http://www.w3.org/2000/svg" stroke="goldenrod" strokeWidth="1" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                                                                <path d="M5 2H19C19.5523 2 20 2.44772 20 3V6C20 6.55228 19.5523 7 19 7H18V10C18 13.3137 15.3137 16 12 16C8.68629 16 6 13.3137 6 10V7H5C4.44772 7 4 6.55228 4 6V3C4 2.44772 4.44772 2 5 2ZM16 7V10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10V7H16ZM12 18C13.5 18 14.85 18.25 15.5 18.75V20H8.5V18.75C9.15 18.25 10.5 18 12 18Z" />
                                                            </svg>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Roster</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {team.players.map(p => (
                                                <div key={p.steamId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-main)', borderRadius: '4px', border: p.isCaptain ? '1px solid var(--accent)' : 'none', fontSize: '0.85rem' }}>
                                                    <img src={p.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                                                    <span>{p.personaName}</span>
                                                    {p.position && (
                                                        <img
                                                            src={POSITIONS.find(pos => pos.id === p.position)?.icon}
                                                            alt=""
                                                            style={{ width: '16px', height: '16px', marginLeft: '4px', opacity: 0.8 }}
                                                            title={POSITIONS.find(pos => pos.id === p.position)?.name}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1rem', fontSize: '0.9rem', color: '#aaa' }}>
                                        <span>Mečeva: {team.stats?.matchesPlayed?.length || 0}</span>
                                        <span>Pobede: {team.stats?.wins || 0}</span>
                                    </div>
                                </div>
                            )
                        })}
                </div>
            )}
        </div>
    );
};

export default Teams;
