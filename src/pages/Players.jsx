import { useTournament } from '../context/TournamentContext';
import RankDisplay from '../components/ui/RankDisplay';
import HeroTooltip, { HeroImage } from '../components/ui/HeroTooltip';
import React, { useState, useMemo, useEffect } from 'react';
import { getMatchDetails, fetchPlayerData, getPositionHeroesFromStratz, clearPlayerPositionCache, steamIdToAccountId } from '../services/dotaApi';
import { useNavigate } from 'react-router-dom';
import PlayerModal from '../components/players/PlayerModal';
import PlayerCard from '../components/players/PlayerCard';

const SortIcon = ({ columnKey, sortConfig }) => {
    if (sortConfig.key !== columnKey) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    return sortConfig.direction === 'asc' ? <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>↑</span> : <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>↓</span>;
};

const Players = () => {
    const { teams, tournamentStats } = useTournament();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'desc' });
    const [viewMode, setViewMode] = useState('registration'); // 'registration' or 'tournament'
    const [layoutMode, setLayoutMode] = useState('table'); // 'table' or 'grid'
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [selectedTeams, setSelectedTeams] = useState(new Set());
    const [showTeamFilter, setShowTeamFilter] = useState(false);
    const [selectedPositions, setSelectedPositions] = useState(new Set());
    const [showPositionFilter, setShowPositionFilter] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showTeamFilter && !event.target.closest('th')) {
                setShowTeamFilter(false);
            }
            if (showPositionFilter && !event.target.closest('th')) {
                setShowPositionFilter(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showTeamFilter, showPositionFilter]);

    // Flatten all players from all teams
    const allPlayers = teams.flatMap(t => t.players.map(p => ({ ...p, teamName: t.name })));

    // Get unique team names
    const allTeamNames = [...new Set(allPlayers.map(p => p.teamName).filter(Boolean))];

    // Position data
    const positions = [
        { id: 1, name: 'Carry', icon: 'https://i.imgur.com/rL1ZwZ4.png' },
        { id: 2, name: 'Midlane', icon: 'https://i.imgur.com/7oAbbDo.png' },
        { id: 3, name: 'Offlaner', icon: 'https://i.imgur.com/ThXJQ0n.png' },
        { id: 4, name: 'Soft Support', icon: 'https://i.imgur.com/NkAmIjB.png' },
        { id: 5, name: 'Hard Support', icon: 'https://i.imgur.com/TGv7onk.png' }
    ];

    // Filter players by selected teams and positions
    const filteredPlayers = useMemo(() => {
        let filtered = allPlayers;

        // Filter by teams
        if (selectedTeams.size > 0) {
            filtered = filtered.filter(player => selectedTeams.has(player.teamName));
        }

        // Filter by positions
        if (selectedPositions.size > 0) {
            filtered = filtered.filter(player => selectedPositions.has(player.position));
        }

        return filtered;
    }, [allPlayers, selectedTeams, selectedPositions]);

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
                    const tid = player.steamId ? steamIdToAccountId(player.steamId.toString()) : null;
                    const stats = tid && tournamentStats[tid] ? tournamentStats[tid] : {};
                    return stats.matches ? (stats.wins / stats.matches) * 100 : 0;
                }

            case 'gpm':
                if (viewMode === 'registration') {
                    return player.stats?.gpm || 0;
                } else {
                    const tid = player.steamId ? steamIdToAccountId(player.steamId.toString()) : null;
                    const stats = tid && tournamentStats[tid] ? tournamentStats[tid] : {};
                    return stats.avgGpm || 0;
                }

            case 'xpm':
                if (viewMode === 'registration') {
                    return player.stats?.xpm || 0;
                } else {
                    const tid = player.steamId ? steamIdToAccountId(player.steamId.toString()) : null;
                    const stats = tid && tournamentStats[tid] ? tournamentStats[tid] : {};
                    return stats.avgXpm || 0;
                }

            case 'matches': {
                const tid = player.steamId ? steamIdToAccountId(player.steamId.toString()) : null;
                const matchStats = tid && tournamentStats[tid] ? tournamentStats[tid] : {};
                return matchStats.matches || 0;
            }

            case 'kills': {
                const tid = player.steamId ? steamIdToAccountId(player.steamId.toString()) : null;
                const killStats = tid && tournamentStats[tid] ? tournamentStats[tid] : {};
                return killStats.kills || 0;
            }

            case 'deaths': {
                const tid = player.steamId ? steamIdToAccountId(player.steamId.toString()) : null;
                const deathStats = tid && tournamentStats[tid] ? tournamentStats[tid] : {};
                return deathStats.deaths || 0;
            }

            case 'assists': {
                const tid = player.steamId ? steamIdToAccountId(player.steamId.toString()) : null;
                const assistStats = tid && tournamentStats[tid] ? tournamentStats[tid] : {};
                return assistStats.assists || 0;
            }

            default:
                return 0;
        }
    };

    // Sort function
    const sortedPlayers = useMemo(() => {
        let sortablePlayers = [...filteredPlayers];
        if (sortConfig.key !== null) {
            sortablePlayers.sort((a, b) => {
                const aValue = getSortValue(a, sortConfig.key);
                const bValue = getSortValue(b, sortConfig.key);

                let comparison = 0;

                // Handle string comparison
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    comparison = aValue.localeCompare(bValue);
                } else {
                    // Handle numeric comparison
                    comparison = aValue - bValue;
                }

                return sortConfig.direction === 'asc' ? comparison : -comparison;
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

    // Handle position filter toggle
    const handlePositionToggle = (positionId) => {
        const newSelectedPositions = new Set(selectedPositions);
        if (newSelectedPositions.has(positionId)) {
            newSelectedPositions.delete(positionId);
        } else {
            newSelectedPositions.add(positionId);
        }
        setSelectedPositions(newSelectedPositions);
    };

    // Select all positions
    const selectAllPositions = () => {
        setSelectedPositions(new Set(positions.map(p => p.id)));
    };

    // Deselect all positions
    const deselectAllPositions = () => {
        setSelectedPositions(new Set());
    };

    // Handle sort click
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };


    return (
        <div className="container" style={{ padding: '6rem 0 4rem 0' }}>
            {selectedPlayer && (
                <PlayerModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    stats={selectedPlayer.steamId ? tournamentStats[steamIdToAccountId(selectedPlayer.steamId.toString())] : null}
                />
            )}

            <div className="header-stack-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
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
                {/* Layout Toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.25rem', borderRadius: '8px' }}>
                    <button
                        onClick={() => setLayoutMode('table')}
                        style={{
                            padding: '0.5rem',
                            background: layoutMode === 'table' ? 'var(--accent)' : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                        title="Tabelarni prikaz"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <button
                        onClick={() => setLayoutMode('grid')}
                        style={{
                            padding: '0.5rem',
                            background: layoutMode === 'grid' ? 'var(--accent)' : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                        title="Mrežni prikaz"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </button>
                </div>
            </div>

            {layoutMode === 'table' ? (
                <div className="card" style={{ padding: 0, overflowX: 'auto', position: 'relative' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', textAlign: 'left' }}>
                                {/* ... table headers (keeping them as is for now, maybe add some refs) ... */}
                                <th
                                    style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', position: 'relative', minWidth: '120px' }}
                                    onClick={(e) => { e.stopPropagation(); setShowPositionFilter(!showPositionFilter); }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    Pozicija <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>▼</span>
                                    {selectedPositions.size > 0 && (
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
                                            {selectedPositions.size}
                                        </span>
                                    )}

                                    {/* Position Filter Dropdown */}
                                    {showPositionFilter && (
                                        <div onClick={e => e.stopPropagation()} style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '0',
                                            minWidth: '200px',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            padding: '1rem',
                                            marginTop: '0.5rem',
                                            zIndex: 1000,
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
                                        }}>
                                            {/* ... drop down content (keeping original) ... */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '1rem',
                                                paddingBottom: '0.75rem',
                                                borderBottom: '1px solid var(--border)'
                                            }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--accent)' }}>Filter Pozicija</h4>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); selectAllPositions(); }}
                                                        style={{
                                                            padding: '0.4rem 0.8rem',
                                                            fontSize: '0.85rem',
                                                            background: 'var(--accent)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                    >
                                                        Sve
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deselectAllPositions(); }}
                                                        style={{
                                                            padding: '0.4rem 0.8rem',
                                                            fontSize: '0.85rem',
                                                            background: '#666',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                    >
                                                        Ništa
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                {positions.map(position => (
                                                    <label
                                                        key={position.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem',
                                                            cursor: 'pointer',
                                                            padding: '0.5rem 0.4rem',
                                                            borderRadius: '4px',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePositionToggle(position.id);
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPositions.has(position.id)}
                                                            readOnly
                                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                                                        />
                                                        <span style={{ fontSize: '0.95rem', color: selectedPositions.has(position.id) ? 'var(--accent)' : '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <img src={position.icon} alt="" style={{ width: '16px', height: '16px' }} />
                                                            {position.name}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </th>
                                <th style={{ padding: '1rem' }}>Igrač</th>
                                <th
                                    style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', position: 'relative', minWidth: '150px' }}
                                    onClick={(e) => { e.stopPropagation(); setShowTeamFilter(!showTeamFilter); }}
                                >
                                    Tim <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>▼</span>
                                    {showTeamFilter && (
                                        <div onClick={e => e.stopPropagation()} style={{
                                            position: 'absolute', top: '100%', left: '0', minWidth: '250px', background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', marginTop: '0.5rem', zIndex: 1000,
                                            maxHeight: '400px', overflowY: 'auto', boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent)' }}>Filter Timova</h4>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => selectAllTeams()} style={{ padding: '0.4rem 0.8rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Svi</button>
                                                    <button onClick={() => deselectAllTeams()} style={{ padding: '0.4rem 0.8rem', background: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Ništa</button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                {allTeamNames.map(teamName => (
                                                    <label key={teamName} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0.4rem' }} onClick={() => handleTeamToggle(teamName)}>
                                                        <input type="checkbox" checked={selectedTeams.has(teamName)} readOnly style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent)' }} />
                                                        <span>{teamName}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </th>

                                {viewMode === 'registration' ? (
                                    <>
                                        <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('rank')}>Rank <SortIcon columnKey="rank" sortConfig={sortConfig} /></th>
                                        <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('winrate')}>Winrate <SortIcon columnKey="winrate" sortConfig={sortConfig} /></th>
                                        <th style={{ padding: '1rem' }}>GPM / XPM</th>
                                    </>
                                ) : (
                                    <>
                                        <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('matches')}>Mečeva <SortIcon columnKey="matches" sortConfig={sortConfig} /></th>
                                        <th style={{ padding: '1rem' }}>K / D / A</th>
                                        <th style={{ padding: '1rem' }}>Ciljevi (Rosh/Tor/Runes)</th>
                                        <th style={{ padding: '1rem' }}>Neutral Tokens</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPlayers.length > 0 ? sortedPlayers.map((player, idx) => {
                                const tStats = player.steamId ? tournamentStats[steamIdToAccountId(player.steamId.toString())] : null;
                                const stats = tStats || { matches: 0, kills: 0, deaths: 0, assists: 0, roshansKilled: 0, tormentorsKilled: 0, runesActivated: 0, neutralTokens: 0 };

                                return (
                                    <tr
                                        key={idx}
                                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                        onClick={() => setSelectedPlayer(player)}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem' }}>
                                            {player.position ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
                                                    <img src={positions.find(p => p.id === player.position)?.icon} alt="" style={{ width: '16px', height: '16px' }} />
                                                    {positions.find(p => p.id === player.position)?.name}
                                                </span>
                                            ) : <span style={{ color: '#666', fontSize: '0.9rem' }}>N/A</span>}
                                        </td>
                                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="hero-tooltip-container">
                                                <img src={player.avatar || 'https://via.placeholder.com/150'} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                                <HeroTooltip heroes={player.topHeroes} />
                                            </div>
                                            <span className="hero-tooltip-container">
                                                {player.personaName}
                                                {player.isCaptain && <span title="Captain" style={{ color: 'var(--accent)', marginLeft: '4px' }}>♔</span>}
                                                <HeroTooltip heroes={player.topHeroes} />
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{player.teamName || '-'}</td>

                                        {viewMode === 'registration' ? (
                                            <>
                                                <td style={{ padding: '0.5rem 1rem' }}><RankDisplay rankTier={player.rankTier} leaderboardRank={player.leaderboardRank} width="40px" /></td>
                                                <td style={{ padding: '1rem' }}>{player.winrate || 0}%</td>
                                                <td style={{ padding: '1rem' }}>{player.stats?.gpm || 0} / {player.stats?.xpm || 0}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ padding: '1rem' }}>{stats.matches}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{stats.kills}</span> /
                                                    <span style={{ color: '#f44336', fontWeight: 'bold' }}>{stats.deaths}</span> /
                                                    <span style={{ color: '#ccc' }}>{stats.assists}</span>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                                    🦁 {stats.roshansKilled} | 🧊 {stats.tormentorsKilled} | 💧 {stats.runesActivated}
                                                </td>
                                                <td style={{ padding: '1rem' }}>💎 {stats.neutralTokens}</td>
                                            </>
                                        )}
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Nema igrača koji odgovaraju kriterijumima.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="team-card-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '1.5rem',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    {sortedPlayers.length > 0 ? sortedPlayers.map((player, idx) => {
                        const tid = player.steamId ? steamIdToAccountId(player.steamId.toString()) : null;
                        const tStats = tid ? tournamentStats[tid] : null;

                        return (
                            <PlayerCard
                                key={idx}
                                player={player}
                                stats={tStats}
                                viewMode={viewMode}
                                onClick={() => setSelectedPlayer(player)}
                            />
                        );
                    }) : (
                        <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: '#888' }}>
                            Nema igrača koji odgovaraju kriterijumima.
                        </div>
                    )}
                </div>
            )}

            {selectedPlayer && (
                <PlayerModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                    stats={selectedPlayer.steamId ? tournamentStats[steamIdToAccountId(selectedPlayer.steamId.toString())] : null}
                />
            )}

            {viewMode === 'tournament' && (
                <p style={{ marginTop: '1rem', fontStyle: 'italic', fontSize: '0.8rem', color: '#666' }}>
                    * Prikazana statistika se odnosi samo na mečeve procesirane unutar ovog turnirskog sistema.
                </p>
            )}
        </div>
    );
};

export default Players;
