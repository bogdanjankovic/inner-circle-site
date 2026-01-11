import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Link } from 'react-router-dom';
import RankDisplay from '../components/ui/RankDisplay';
import HeroTooltip, { HeroImage } from '../components/ui/HeroTooltip';

// --- Shared/Duplicated Components for Modals (Ideally move to /components/ui) ---

const PlayerModal = ({ player, onClose, stats }) => {
    if (!player) return null;
    // Fallback stats if generic player view
    const tStats = stats || { matches: 0, kills: 0, deaths: 0, assists: 0, roshansKilled: 0, tormentorsKilled: 0, runesActivated: 0, neutralTokens: 0 };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2100 }}> {/* Higher z-index than TeamModal */}
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-modal" onClick={onClose}>&times;</button>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
                    <img src={player.avatar || 'https://via.placeholder.com/150'} alt={player.personaName} style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--accent)' }} />
                    <div>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{player.personaName}</h2>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <RankDisplay rankTier={player.rankTier} leaderboardRank={player.leaderboardRank} width="60px" />
                            <span style={{ fontSize: '1.2rem', color: '#ccc' }}>{player.teamName}</span>
                        </div>
                    </div>
                </div>
                {/* Simplified Stats View for this context (Drilldown) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="card">
                        <h3>Pub Statistika</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div><label style={{ color: '#888' }}>Winrate</label><div style={{ fontSize: '1.5rem' }}>{player.winrate}%</div></div>
                            <div><label style={{ color: '#888' }}>GPM/XPM</label><div style={{ fontSize: '1.2rem' }}>{player.stats?.gpm} / {player.stats?.xpm}</div></div>
                        </div>
                    </div>
                    <div className="card" style={{ border: '1px solid var(--accent)' }}>
                        <h3 style={{ color: 'var(--accent)' }}>Turnir Statistika</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.9rem' }}>K / D / A</label>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    <span style={{ color: '#4caf50' }}>{tStats.kills}</span> / <span style={{ color: '#f44336' }}>{tStats.deaths}</span> / <span>{tStats.assists}</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.9rem' }}>Mečeva</label>
                                <div style={{ fontSize: '1.5rem' }}>{tStats.matches}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '2rem' }}>
                    <h3>Najuspešniji Heroji</h3>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {player.topHeroes?.map((h, i) => (
                            <div key={i} className="card" style={{ padding: '1rem', flex: 1, textAlign: 'center' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <HeroImage heroId={h.heroId} style={{ width: '60px', height: '60px' }} />
                                </div>
                                <div style={{ color: '#4caf50' }}>{h.winrate}% Win</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TeamModal = ({ team, onClose, onPlayerClick }) => {
    if (!team) return null;
    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-modal" onClick={onClose}>&times;</button>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src={team.logo} alt={team.name} style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--border)', marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '3rem', color: 'var(--accent)' }}>{team.name}</h2>
                    <div style={{ color: '#aaa' }}>Registrovan: {new Date(team.registeredAt).toLocaleDateString()}</div>
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
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

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
                    stats={selectedPlayer.data?.accountId ? tournamentStats[selectedPlayer.data.accountId] : null}
                />
            )}

            {teams.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888' }}>
                    <p>Nema prijavljenih timova.</p>
                    <Link to="/register" className="btn" style={{ marginTop: '1rem' }}>Prijavi Tim</Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                    {teams.map(team => (
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
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff' }}>{team.name}</h3>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>
                                        Winrate: {team.stats.winrate}%
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Roster</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {team.players.map(p => (
                                        <div key={p.steamId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-main)', borderRadius: '4px', border: p.isCaptain ? '1px solid var(--accent)' : 'none', fontSize: '0.85rem' }}>
                                            <img src={p.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                                            <span>{p.personaName}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1rem', fontSize: '0.9rem', color: '#aaa' }}>
                                <span>Mečeva: {team.stats.matchesPlayed?.length || 0}</span>
                                <span>Pobede: {team.stats.wins}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Teams;
