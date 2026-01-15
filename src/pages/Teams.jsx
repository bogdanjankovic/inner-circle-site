import { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import RankDisplay from '../components/ui/RankDisplay';
import HeroTooltip, { HeroImage } from '../components/ui/HeroTooltip';

// --- Shared/Duplicated Components for Modals (Ideally move to /components/ui) ---

// Position data definitions
const POSITIONS = [
    { id: 1, name: 'Carry', icon: 'https://i.imgur.com/rL1ZwZ4.png' },
    { id: 2, name: 'Midlane', icon: 'https://i.imgur.com/7oAbbDo.png' },
    { id: 3, name: 'Offlaner', icon: 'https://i.imgur.com/ThXJQ0n.png' },
    { id: 4, name: 'Soft Support', icon: 'https://i.imgur.com/NkAmIjB.png' },
    { id: 5, name: 'Hard Support', icon: 'https://i.imgur.com/TGv7onk.png' }
];

// Import the new PlayerModal from Players.jsx with all features
const PlayerModal = ({ player, onClose, stats }) => {
    if (!player) return null;

    const navigate = useNavigate();
    const [refreshedPlayer, setRefreshedPlayer] = useState(player);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [positionHeroes, setPositionHeroes] = useState([]);

    // Refresh heroes with STRATZ API when modal opens (with caching)
    useEffect(() => {
        const refreshHeroes = async () => {
            if (player.steamId) {
                setIsRefreshing(true);
                try {
                    console.log('=== REFRESHING PLAYER HEROES (WITH CACHE) ===');

                    // Use existing topHeroes from player object (from hover card)
                    const existingTopHeroes = player.topHeroes || [];
                    console.log('DEBUG: Using existing topHeroes:', existingTopHeroes);

                    // Get position-specific heroes from STRATZ (if position exists) - will use cache
                    let posHeroes = [];
                    if (player.position && player.position !== 0) {
                        console.log('=== GETTING POSITION HEROES FROM STRATZ (CACHED) ===');
                        try {
                            // Import directly to avoid issues
                            const { getPositionHeroesFromStratz } = await import('../services/dotaApi');
                            posHeroes = await getPositionHeroesFromStratz(player.accountId, player.position, player.steamId, false);
                            console.log('DEBUG: Position heroes loaded:', posHeroes);
                        } catch (error) {
                            console.error('ERROR loading position heroes:', error);
                            posHeroes = [];
                        }
                    }

                    // Get Dota Plus heroes from STRATZ (with caching)
                    let dotaPlusHeroes = [];
                    try {
                        console.log('=== GETTING DOTA PLUS HEROES (CACHED) ===');
                        const { getTopDotaPlusHeroes, steamIdToStratzAccountId } = await import("../services/stratzApi.js");
                        const stratzAccountId = steamIdToStratzAccountId(player.steamId);
                        console.log('DEBUG: Stratz account ID:', stratzAccountId);
                        dotaPlusHeroes = await getTopDotaPlusHeroes(stratzAccountId);
                        console.log('DEBUG: Dota Plus heroes loaded:', dotaPlusHeroes);
                    } catch (error) {
                        console.error('ERROR loading Dota Plus heroes:', error);
                        dotaPlusHeroes = [];
                    }

                    setRefreshedPlayer({
                        ...player,
                        topHeroes: existingTopHeroes,
                        dotaPlusHeroes: dotaPlusHeroes || []
                    });
                    setPositionHeroes(posHeroes || []);
                    console.log('=== HEROES REFRESHED SUCCESSFULLY (USING EXISTING DATA) ===');
                } catch (error) {
                    console.error('Failed to refresh heroes:', error);
                    // Fallback to existing data
                    setRefreshedPlayer({
                        ...player,
                        topHeroes: player.topHeroes || [],
                        dotaPlusHeroes: []
                    });
                    setPositionHeroes([]);
                } finally {
                    setIsRefreshing(false);
                }
            }
        };

        refreshHeroes();
    }, [player.steamId, player.position, player.accountId]);

    const displayStats = stats || { matches: 0, kills: 0, deaths: 0, assists: 0, roshansKilled: 0, tormentorsKilled: 0, runesActivated: 0, neutralTokens: 0 };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2100 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                <button className="close-modal" onClick={onClose}>&times;</button>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <img
                        src={player.avatar || 'https://via.placeholder.com/150'}
                        alt={player.personaName}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--accent)' }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{player.personaName}</h2>
                            {player.isCaptain && (
                                <span style={{
                                    padding: '0.2rem 0.5rem',
                                    background: '#ffd700',
                                    color: '#000',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}>
                                    ♔ Kapiten
                                </span>
                            )}
                            <span style={{
                                padding: '0.2rem 0.5rem',
                                background: 'var(--accent)',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}>
                                {player.position ? POSITIONS.find(p => p.id === player.position)?.name : 'Nema pozicije'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <RankDisplay rankTier={player.rankTier} leaderboardRank={player.leaderboardRank} width="40px" />
                            {player.teamName ? (
                                <button
                                    onClick={() => {
                                        // Navigate to teams page and trigger team modal
                                        navigate('/teams', {
                                            state: {
                                                openTeamModal: true,
                                                teamName: player.teamName
                                            }
                                        });
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '4px',
                                        padding: '0.3rem 0.6rem',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = 'rgba(255,255,255,0.2)';
                                        e.target.style.borderColor = 'var(--accent)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'rgba(255,255,255,0.1)';
                                        e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                                    }}
                                >
                                    {player.teamLogo && (
                                        <img
                                            src={player.teamLogo}
                                            alt={player.teamName}
                                            style={{ width: '20px', height: '20px', borderRadius: '2px' }}
                                        />
                                    )}
                                    <span>{player.teamName}</span>
                                </button>
                            ) : (
                                <span style={{ fontSize: '1rem', color: '#ccc' }}>Nema tima</span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem' }}>Pub Statistika</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.8rem' }}>Winrate</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{player.winrate}%</div>
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.8rem' }}>Mečeva</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{player.winCount + player.lossCount}</div>
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.8rem' }}>GPM / XPM</label>
                                <div style={{ fontSize: '1rem' }}>{player.stats?.gpm} / {player.stats?.xpm}</div>
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.8rem' }}>KDA</label>
                                <div style={{ fontSize: '1rem' }}>
                                    {(() => {
                                        if (player.stats?.kda && !isNaN(player.stats.kda)) {
                                            return player.stats.kda;
                                        }
                                        const kills = Number(player.stats?.kills) || 0;
                                        const deaths = Number(player.stats?.deaths) || 0;
                                        const assists = Number(player.stats?.assists) || 0;

                                        if (kills > 0 || assists > 0) {
                                            const kda = (kills + assists) / Math.max(deaths, 1);
                                            return isNaN(kda) ? 'N/A' : kda.toFixed(2);
                                        }
                                        return 'N/A';
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ border: '1px solid var(--accent)', padding: '1rem' }}>
                        <h3 style={{ color: 'var(--accent)', fontSize: '1.1rem', marginBottom: '0.8rem' }}>Turnir Statistika</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.8rem' }}>K / D / A</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    <span style={{ color: '#4caf50' }}>{displayStats.kills}</span> / <span style={{ color: '#f44336' }}>{displayStats.deaths}</span> / <span>{displayStats.assists}</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.8rem' }}>Mečeva</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{displayStats.matches}</div>
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                <div title="Roshans Killed">🦁 {displayStats.roshansKilled}</div>
                                <div title="Tormentors Killed">🧊 {displayStats.tormentorsKilled}</div>
                                <div title="Runes">💧 {displayStats.runesActivated}</div>
                                <div title="Neutral Tokens">💎 {displayStats.neutralTokens}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* All-Time Heroes Section */}
                <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>
                        Najuspešniji Heroji (All Time)
                        {isRefreshing && <span style={{ fontSize: '0.7rem', color: '#888' }}> (🔄 osvežavanje...)</span>}
                    </h3>
                    {isRefreshing ? (
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>
                                <div>🔄 Učitavam...</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                            {(refreshedPlayer.topHeroes && Array.isArray(refreshedPlayer.topHeroes) ? refreshedPlayer.topHeroes : []).map((h, i) => (
                                <div key={i} className="card" style={{ padding: '0.8rem', flex: 1, textAlign: 'center' }}>
                                    <div style={{ marginBottom: '0.4rem' }}>
                                        <HeroImage heroId={h.heroId} style={{ width: '45px', height: '45px' }} />
                                    </div>
                                    <div style={{ color: h.winrate >= 55 ? '#4caf50' : h.winrate >= 50 ? '#ff9800' : '#f44336', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                        {h.winrate}%
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#888' }}>{h.games} mečeva</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Position-Specific Heroes Section (STRATZ) */}
                {refreshedPlayer.position && refreshedPlayer.position !== 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ color: '#2196f3', fontSize: '1.1rem' }}>
                            Top {positions.find(p => p.id === refreshedPlayer.position)?.name} Heroji u poslednje vreme
                        </h3>
                        {positionHeroes.length > 0 ? (
                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                                {positionHeroes.map((h, i) => (
                                    <div key={i} className="card" style={{
                                        padding: '0.8rem',
                                        flex: 1,
                                        textAlign: 'center',
                                        border: '2px solid #2196f3',
                                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))'
                                    }}>
                                        <div style={{ marginBottom: '0.4rem' }}>
                                            <HeroImage heroId={h.heroId} style={{ width: '45px', height: '45px' }} />
                                        </div>
                                        <div style={{ color: h.winrate >= 55 ? '#4caf50' : h.winrate >= 50 ? '#ff9800' : '#f44336', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                            {h.winrate}%
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>{h.games} mečeva</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#888', marginTop: '0.8rem', fontSize: '0.9rem' }}>
                                <div>📊 Nema podataka za poziciju</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Dota Plus Heroes */}
                {refreshedPlayer.dotaPlusHeroes && refreshedPlayer.dotaPlusHeroes.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ color: '#e63946', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ⭐ Dota Plus Heroji
                        </h3>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                            {refreshedPlayer.dotaPlusHeroes.map((h, i) => (
                                <div key={i} className="card" style={{
                                    padding: '0.8rem',
                                    flex: 1,
                                    textAlign: 'center',
                                    border: '2px solid #e63946',
                                    background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.1), rgba(230, 57, 70, 0.05))'
                                }}>
                                    <div style={{ marginBottom: '0.4rem' }}>
                                        <HeroImage heroId={h.heroId} style={{ width: '45px', height: '45px' }} />
                                    </div>
                                    <div style={{ color: '#e63946', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        Lvl {h.level}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#888' }}>Dota Plus</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                    stats={selectedPlayer.data?.accountId ? tournamentStats[selectedPlayer.data.accountId] : null}
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
