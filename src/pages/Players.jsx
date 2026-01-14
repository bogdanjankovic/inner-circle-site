import { useTournament } from '../context/TournamentContext';
import RankDisplay from '../components/ui/RankDisplay';
import HeroTooltip, { HeroImage } from '../components/ui/HeroTooltip';
import { useState, useEffect, useMemo } from 'react';
import { getMatchDetails, fetchPlayerData } from '../services/dotaApi';

const PlayerModal = ({ player, onClose, stats }) => {
    if (!player) return null;

    // We can access tournamentStats from context if we really need independent lookup, 
    // but props 'stats' should be sufficient if passed correctly. 
    // However, to fix the specific "ReferenceError", we must ensure we don't treat 'tournamentStats' as a global.
    // Since 'stats' is passed as a prop, we should rely on it, OR we need to useTournament() here.
    // Let's rely on props to keep it pure, or fallback to safe defaults.

    // If stats are missing, we can try to look them up if we had access to context, 
    // but simpler to just default to 0s if not provided.
    const tStats = stats || { matches: 0, kills: 0, deaths: 0, assists: 0, roshansKilled: 0, tormentorsKilled: 0, runesActivated: 0, neutralTokens: 0 };
    // Refined stats lookup logic slightly above, relying on parent passing stats or simple default.
    // Actually the previous logic was fine: `const tStats = stats || ...` because parent handles lookup.
    // Let's stick to simple props rendering.

    const displayStats = stats || { matches: 0, kills: 0, deaths: 0, assists: 0, roshansKilled: 0, tormentorsKilled: 0, runesActivated: 0, neutralTokens: 0 };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-modal" onClick={onClose}>&times;</button>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
                    <img
                        src={player.avatar || 'https://via.placeholder.com/150'}
                        alt={player.personaName}
                        style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--accent)' }}
                    />
                    <div>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{player.personaName}</h2>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <RankDisplay rankTier={player.rankTier} leaderboardRank={player.leaderboardRank} width="60px" />
                            <span style={{ fontSize: '1.2rem', color: '#ccc' }}>{player.teamName}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="card">
                        <h3>Pub Statistika</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.9rem' }}>Winrate</label>
                                <div style={{ fontSize: '1.5rem' }}>{player.winrate}%</div>
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.9rem' }}>Mečeva (Recorded)</label>
                                <div style={{ fontSize: '1.5rem' }}>{player.winCount + player.lossCount}</div>
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.9rem' }}>GPM / XPM</label>
                                <div style={{ fontSize: '1.2rem' }}>{player.stats?.gpm} / {player.stats?.xpm}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ border: '1px solid var(--accent)' }}>
                        <h3 style={{ color: 'var(--accent)' }}>Turnir Statistika</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.9rem' }}>K / D / A</label>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    <span style={{ color: '#4caf50' }}>{displayStats.kills}</span> / <span style={{ color: '#f44336' }}>{displayStats.deaths}</span> / <span>{displayStats.assists}</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#888', fontSize: '0.9rem' }}>Mečeva</label>
                                <div style={{ fontSize: '1.5rem' }}>{displayStats.matches}</div>
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px' }}>
                                <div title="Roshans Killed">🦁 {displayStats.roshansKilled}</div>
                                <div title="Tormentors Killed">🧊 {displayStats.tormentorsKilled}</div>
                                <div title="Runes">💧 {displayStats.runesActivated}</div>
                                <div title="Neutral Tokens">💎 {displayStats.neutralTokens}</div>
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
                                <div style={{ fontSize: '0.9rem', color: '#888' }}>{h.games} mečeva</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const Players = () => {
    const { teams, tournamentStats } = useTournament();
    const [viewMode, setViewMode] = useState('registration');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [sortConfig, setSortConfig] = useState([]); // Array of sort configs for multi-sort
    const [selectedTeams, setSelectedTeams] = useState(new Set()); // Set of selected team names
    const [showTeamFilter, setShowTeamFilter] = useState(false);

    // Flatten all players from all teams
    const allPlayers = teams.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name })));

    // Get unique team names
    const allTeamNames = [...new Set(allPlayers.map(p => p.teamName).filter(Boolean))];

    // Filter players by selected teams
    const filteredPlayers = useMemo(() => {
        if (selectedTeams.size === 0) {
            return allPlayers; // Show all if no teams selected
        }
        return allPlayers.filter(player => selectedTeams.has(player.teamName));
    }, [allPlayers, selectedTeams]);

    // Get value for sorting based on key
    const getSortValue = (player, key) => {
        switch (key) {
            case 'personaName':
                return player.personaName || '';
            
            case 'rankTier':
                // Rank sorting logic based on actual rankTier values (OpenDota format)
                const rankTier = player.rankTier || 0;
                const leaderboardRank = player.leaderboardRank;
                
                if (rankTier === 80 && leaderboardRank) {
                    return 20000 - leaderboardRank;
                } else if (rankTier === 80) {
                    return 15000;
                } else {
                    return rankTier;
                }
            
            case 'winrate':
                if (viewMode === 'registration') {
                    return player.winrate || 0;
                } else {
                    const stats = player.steamId && tournamentStats[player.steamId] ? tournamentStats[player.steamId] : {};
                    return stats.matches ? (stats.wins / stats.matches) * 100 : 0;
                }
            
            case 'gpm':
                if (viewMode === 'registration') {
                    return player.stats?.gpm || 0;
                } else {
                    const stats = player.steamId && tournamentStats[player.steamId] ? tournamentStats[player.steamId] : {};
                    return stats.avgGpm || 0;
                }
            
            case 'xpm':
                if (viewMode === 'registration') {
                    return player.stats?.xpm || 0;
                } else {
                    const stats = player.steamId && tournamentStats[player.steamId] ? tournamentStats[player.steamId] : {};
                    return stats.avgXpm || 0;
                }
            
            case 'matches':
                const matchStats = player.steamId && tournamentStats[player.steamId] ? tournamentStats[player.steamId] : {};
                return matchStats.matches || 0;
            
            case 'kills':
                const killStats = player.steamId && tournamentStats[player.steamId] ? tournamentStats[player.steamId] : {};
                return killStats.kills || 0;
            
            case 'deaths':
                const deathStats = player.steamId && tournamentStats[player.steamId] ? tournamentStats[player.steamId] : {};
                return deathStats.deaths || 0;
            
            case 'assists':
                const assistStats = player.steamId && tournamentStats[player.steamId] ? tournamentStats[player.steamId] : {};
                return assistStats.assists || 0;
            
            default:
                return 0;
        }
    };

    // Multi-sort function
    const sortedPlayers = useMemo(() => {
        let sortablePlayers = [...filteredPlayers];
        
        if (sortConfig.length > 0) {
            sortablePlayers.sort((a, b) => {
                // Apply all sort criteria in order
                for (const { key, direction } of sortConfig) {
                    const aValue = getSortValue(a, key);
                    const bValue = getSortValue(b, key);
                    
                    let comparison = 0;
                    
                    // Handle string comparison
                    if (typeof aValue === 'string' && typeof bValue === 'string') {
                        comparison = aValue.localeCompare(bValue);
                    } else {
                        // Handle numeric comparison
                        comparison = aValue - bValue;
                    }
                    
                    // If values are different, return the comparison with direction
                    if (comparison !== 0) {
                        return direction === 'asc' ? comparison : -comparison;
                    }
                }
                
                // If all sort criteria are equal, return 0
                return 0;
            });
        }
        
        return sortablePlayers;
    }, [filteredPlayers, sortConfig, tournamentStats, viewMode]);

    // Handle team filter toggle
    const handleTeamToggle = (teamName) => {
        const newSelectedTeams = new Set(selectedTeams);
        if (newSelectedTeams.has(teamName)) {
            newSelectedTeams.delete(teamName);
        } else {
            newSelectedTeams.add(teamName);
        }
        setSelectedTeams(newSelectedTeams);
    };

    // Select all teams
    const selectAllTeams = () => {
        setSelectedTeams(new Set(allTeamNames));
    };

    // Deselect all teams
    const deselectAllTeams = () => {
        setSelectedTeams(new Set());
    };

    // Handle sort click (supports Ctrl/Cmd for multi-sort)
    const handleSort = (key, event) => {
        const isMultiSort = event.ctrlKey || event.metaKey;
        
        if (isMultiSort) {
            // Multi-sort logic
            const existingIndex = sortConfig.findIndex(config => config.key === key);
            let newSortConfig = [...sortConfig];
            
            if (existingIndex !== -1) {
                // Toggle direction for existing sort
                const existing = newSortConfig[existingIndex];
                newSortConfig[existingIndex] = {
                    ...existing,
                    direction: existing.direction === 'asc' ? 'desc' : 'asc'
                };
            } else {
                // Add new sort criteria
                newSortConfig.push({ key, direction: 'asc' });
            }
            
            setSortConfig(newSortConfig);
        } else {
            // Single sort logic (replace all)
            const existing = sortConfig.find(config => config.key === key);
            let direction = 'asc';
            
            if (existing) {
                direction = existing.direction === 'asc' ? 'desc' : 'asc';
            }
            
            setSortConfig([{ key, direction }]);
        }
    };

    // Sort icon component
    const SortIcon = ({ columnKey }) => {
        const sortConfigItem = sortConfig.find(config => config.key === columnKey);
        const sortIndex = sortConfig.findIndex(config => config.key === columnKey);
        
        if (!sortConfigItem) {
            return <span style={{ opacity: 0.3, fontSize: '0.8rem', marginLeft: '4px' }}>↕</span>;
        }
        
        return (
            <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>
                {sortConfigItem.direction === 'asc' ? '↑' : '↓'}
                {sortIndex > 0 && (
                    <span style={{ fontSize: '0.6rem', opacity: 0.7, marginLeft: '2px' }}>
                        {sortIndex + 1}
                    </span>
                )}
            </span>
        );
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            {selectedPlayer && (
                <PlayerModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    stats={selectedPlayer.steamId ? tournamentStats[selectedPlayer.steamId] : null}
                />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Registrovani Igrači</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn"
                        style={{ background: viewMode === 'registration' ? 'var(--dota-red)' : 'var(--bg-card)' }}
                        onClick={() => setViewMode('registration')}
                    >
                        Pub Statistika
                    </button>
                    <button
                        className="btn"
                        style={{ background: viewMode === 'tournament' ? 'var(--dota-red)' : 'var(--bg-card)' }}
                        onClick={() => setViewMode('tournament')}
                    >
                        Turnir Statistika
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--bg-secondary)', textAlign: 'left' }}>
                            <th 
                                style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s' }}
                                onClick={(e) => handleSort('personaName', e)}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                Igrač <SortIcon columnKey="personaName" />
                            </th>
                            <th 
                                style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', position: 'relative' }}
                                onClick={() => setShowTeamFilter(!showTeamFilter)}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                Tim <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>▼</span>
                                {selectedTeams.size > 0 && (
                                    <span style={{ 
                                        background: 'var(--accent)', 
                                        color: 'white', 
                                        borderRadius: '50%', 
                                        width: '16px', 
                                        height: '16px', 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '0.7rem', 
                                        marginLeft: '4px' 
                                    }}>
                                        {selectedTeams.size}
                                    </span>
                                )}
                            </th>
                            {viewMode === 'registration' ? (
                                <>
                                    <th 
                                        style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s' }}
                                        onClick={(e) => handleSort('rankTier', e)}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Rank <SortIcon columnKey="rankTier" />
                                    </th>
                                    <th 
                                        style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s' }}
                                        onClick={(e) => handleSort('winrate', e)}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Winrate <SortIcon columnKey="winrate" />
                                    </th>
                                    <th style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span 
                                                style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', padding: '2px 4px', borderRadius: '2px' }}
                                                onClick={(e) => handleSort('gpm', e)}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                GPM <SortIcon columnKey="gpm" />
                                            </span>
                                            <span>/</span>
                                            <span 
                                                style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', padding: '2px 4px', borderRadius: '2px' }}
                                                onClick={(e) => handleSort('xpm', e)}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                XPM <SortIcon columnKey="xpm" />
                                            </span>
                                        </div>
                                    </th>
                                </>
                            ) : (
                                <>
                                    <th 
                                        style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s' }}
                                        onClick={(e) => handleSort('matches', e)}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Mečeva <SortIcon columnKey="matches" />
                                    </th>
                                    <th style={{ padding: '1rem', title: 'Kills/Deaths/Assists' }}>
                                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                            <span 
                                                style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', padding: '2px 4px', borderRadius: '2px' }}
                                                onClick={(e) => handleSort('kills', e)}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                K <SortIcon columnKey="kills" />
                                            </span>
                                            <span>/</span>
                                            <span 
                                                style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', padding: '2px 4px', borderRadius: '2px' }}
                                                onClick={(e) => handleSort('deaths', e)}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                D <SortIcon columnKey="deaths" />
                                            </span>
                                            <span>/</span>
                                            <span 
                                                style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', padding: '2px 4px', borderRadius: '2px' }}
                                                onClick={(e) => handleSort('assists', e)}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                A <SortIcon columnKey="assists" />
                                            </span>
                                        </div>
                                    </th>
                                    <th style={{ padding: '1rem' }}>Ciljevi (Rosh/Tor/Runes)</th>
                                    <th style={{ padding: '1rem' }}>Neutral Tokens</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayers.length > 0 ? sortedPlayers.map((player, idx) => {
                            const tStats = player.steamId && tournamentStats[player.steamId]
                                ? tournamentStats[player.steamId]
                                : { matches: 0, kills: 0, deaths: 0, assists: 0, roshansKilled: 0, tormentorsKilled: 0, runesActivated: 0, neutralTokens: 0 };

                            return (
                                <tr
                                    key={idx}
                                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                    onClick={() => setSelectedPlayer(player)}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {/* Avatar & Name */}
                                        <div className="hero-tooltip-container">
                                            {player.avatar ? (
                                                <img src={player.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                            ) : (
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333' }}></div>
                                            )}
                                            <HeroTooltip heroes={player.topHeroes} />
                                        </div>

                                        <span className="hero-tooltip-container">
                                            {player.personaName || player.steamId}
                                            {player.isCaptain && <span title="Captain" style={{ color: 'var(--accent)', marginLeft: '4px' }}>♔</span>}
                                            <HeroTooltip heroes={player.topHeroes} />
                                        </span>
                                    </td>

                                    <td style={{ padding: '1rem' }}>{player.teamName}</td>

                                    {viewMode === 'registration' ? (
                                        <>
                                            <td style={{ padding: '0.5rem 1rem' }}>
                                                <RankDisplay rankTier={player.rankTier} leaderboardRank={player.leaderboardRank} width="40px" />
                                            </td>
                                            <td style={{ padding: '1rem' }}>{player.winrate || 0}%</td>
                                            <td style={{ padding: '1rem' }}>{player.stats?.gpm || 0} / {player.stats?.xpm || 0}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ padding: '1rem' }}>{tStats.matches}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{tStats.kills}</span> /
                                                <span style={{ color: '#f44336', fontWeight: 'bold' }}>{tStats.deaths}</span> /
                                                <span style={{ color: '#ccc' }}>{tStats.assists}</span>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                                <span title="Roshans">🦁 {tStats.roshansKilled}</span> <span style={{ margin: '0 5px' }}>|</span>
                                                <span title="Tormentors">🧊 {tStats.tormentorsKilled}</span> <span style={{ margin: '0 5px' }}>|</span>
                                                <span title="Runes">💧 {tStats.runesActivated}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>💎 {tStats.neutralTokens}</td>
                                        </>
                                    )}
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No players registered yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            
            {/* Team Filter Dropdown */}
            {showTeamFilter && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '1rem',
                    marginTop: '0.5rem',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Filter Timova</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={selectAllTeams}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    background: 'var(--accent)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '2px',
                                    cursor: 'pointer'
                                }}
                            >
                                Svi
                            </button>
                            <button
                                onClick={deselectAllTeams}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.8rem',
                                    background: '#666',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '2px',
                                    cursor: 'pointer'
                                }}
                            >
                                Ništa
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {allTeamNames.map(teamName => (
                            <label
                                key={teamName}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    borderRadius: '2px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTeams.has(teamName)}
                                    onChange={() => handleTeamToggle(teamName)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.9rem' }}>{teamName}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            </div>

            {viewMode === 'tournament' && (
                <p style={{ marginTop: '1rem', fontStyle: 'italic', fontSize: '0.8rem', color: '#666' }}>
                    * Prikazana statistika se odnosi samo na mečeve procesirane unutar ovog turnirskog sistema.
                </p>
            )}
        </div>
    );
};

export default Players;
