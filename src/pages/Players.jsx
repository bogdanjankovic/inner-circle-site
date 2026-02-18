import { useTournament } from '../context/TournamentContext';
import RankDisplay from '../components/ui/RankDisplay';
import HeroTooltip, { HeroImage } from '../components/ui/HeroTooltip';
import React, { useState, useMemo, useEffect } from 'react';
import { getMatchDetails, fetchPlayerData, getPositionHeroesFromStratz, clearPlayerPositionCache } from '../services/dotaApi';
import { useNavigate } from 'react-router-dom';

const PlayerModal = ({ player, onClose, stats }) => {
    if (!player) return null;

    const navigate = useNavigate();
    const [refreshedPlayer, setRefreshedPlayer] = useState(player);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [positionHeroes, setPositionHeroes] = useState([]);

    const [showHistory, setShowHistory] = useState(false);

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
                        posHeroes = await getPositionHeroesFromStratz(player.accountId, player.position, player.steamId, false);
                    }

                    // Get Dota Plus heroes from STRATZ (with caching)
                    let dotaPlusHeroes = [];
                    try {
                        const { getTopDotaPlusHeroes, steamIdToStratzAccountId } = await import("../services/stratzApi.js");
                        const stratzAccountId = steamIdToStratzAccountId(player.steamId);
                        dotaPlusHeroes = await getTopDotaPlusHeroes(stratzAccountId);
                        console.log('DEBUG: Dota Plus heroes:', dotaPlusHeroes);
                    } catch (error) {
                        console.error('Error fetching Dota Plus heroes:', error);
                    }

                    // ✨ NEW: Fetch pub statistics from OpenDota (will use cache if available)
                    console.log('[PUB STATS] Fetching player data for pub statistics...');
                    try {
                        const playerData = await fetchPlayerData(player.steamId, player.position);
                        console.log('[PUB STATS] Fetched data:', playerData);

                        setRefreshedPlayer(prev => ({
                            ...prev,
                            topHeroes: existingTopHeroes,
                            dotaPlusHeroes: dotaPlusHeroes || [],
                            stats: playerData.stats // Update stats with detailed pub statistics
                        }));
                    } catch (error) {
                        console.error('[PUB STATS] Error fetching player data:', error);
                        setRefreshedPlayer(prev => ({
                            ...prev,
                            topHeroes: existingTopHeroes,
                            dotaPlusHeroes: dotaPlusHeroes || []
                        }));
                    }

                    setPositionHeroes(posHeroes || []);
                    console.log('=== HEROES REFRESHED SUCCESSFULLY ===');
                } catch (error) {
                    console.error('Failed to refresh heroes:', error);
                    setPositionHeroes([]);
                } finally {
                    setIsRefreshing(false);
                }
            }
        };

        refreshHeroes();
    }, [player.steamId, player.position, player.accountId]);

    // Force refresh STRATZ data when position changes
    useEffect(() => {
        const refreshPositionHeroes = async () => {
            if (player.steamId && player.position && player.position !== 0) {
                try {
                    console.log('=== POSITION CHANGED - FORCE REFRESHING STRATZ ===');
                    const posHeroes = await getPositionHeroesFromStratz(player.accountId, player.position, player.steamId, true);
                    setPositionHeroes(posHeroes);
                } catch (error) {
                    console.error('Failed to refresh position heroes:', error);
                }
            }
        };

        refreshPositionHeroes();
    }, [player.position]);

    // Position data
    const positions = [
        { id: 1, name: 'Carry', icon: 'https://i.imgur.com/rL1ZwZ4.png' },
        { id: 2, name: 'Midlane', icon: 'https://i.imgur.com/7oAbbDo.png' },
        { id: 3, name: 'Offlaner', icon: 'https://i.imgur.com/ThXJQ0n.png' },
        { id: 4, name: 'Soft Support', icon: 'https://i.imgur.com/NkAmIjB.png' },
        { id: 5, name: 'Hard Support', icon: 'https://i.imgur.com/TGv7onk.png' }
    ];

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

    const displayStats = stats || {
        matches: 0,
        avgKills: 0, avgDeaths: 0, avgAssists: 0,
        avgHeroDamage: 0, avgHeroHealing: 0, avgTowerDamage: 0,
        avgGpm: 0, avgXpm: 0,
        avgObsPlaced: 0, avgSenPlaced: 0, avgObsKilled: 0, avgSenKilled: 0,
        matchHistory: []
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                <button className="close-modal" onClick={onClose}>&times;</button>

                <div className="modal-stack-mobile" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
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
                                {player.position ? positions.find(p => p.id === player.position)?.name : 'Nema pozicije'}
                            </span>
                        </div>
                        <div className="rank-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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

                <div className="grid-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.2rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Pub Statistika</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Winrate</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4caf50' }}>{player.winrate}%</div>
                            </div>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>GPM / XPM</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffd700' }}>
                                    {refreshedPlayer.stats?.gpm || 0} / {refreshedPlayer.stats?.xpm || 0}
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Mečeva</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{player.winCount + player.lossCount}</div>
                            </div>
                        </div>

                        <div style={{
                            marginTop: '1.2rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.8rem',
                            background: 'rgba(0,0,0,0.5)',
                            padding: '0.8rem',
                            borderRadius: '6px',
                            fontSize: '0.85rem'
                        }} title="Prosečan damage i healing po meču (poslednjih 50 mečeva)">
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#f44336', fontWeight: 'bold' }}>{refreshedPlayer.stats?.avgHeroDamage?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: '0.65rem', color: '#666' }}>HERO DAMAGE</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#4caf50', fontWeight: 'bold' }}>{refreshedPlayer.stats?.avgHeroHealing?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: '0.65rem', color: '#666' }}>HEALING</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#ffa726', fontWeight: 'bold' }}>{refreshedPlayer.stats?.avgTowerDamage?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: '0.65rem', color: '#666' }}>TOWER DMG</div>
                            </div>
                        </div>

                        <div style={{
                            marginTop: '0.8rem',
                            fontSize: '0.8rem'
                        }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px' }}>
                                <div style={{ color: '#666', fontSize: '0.65rem', marginBottom: '0.2rem' }}>WARDING (BOUGHT)</div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Observers Bought">
                                        <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ward_observer.png"
                                            alt="Observer Ward"
                                            style={{ width: '20px', height: '15px', imageRendering: 'crisp-edges' }} />
                                        {refreshedPlayer.stats?.avgObsPlaced || 0}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Sentries Bought">
                                        <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ward_sentry.png"
                                            alt="Sentry Ward"
                                            style={{ width: '20px', height: '15px', imageRendering: 'crisp-edges' }} />
                                        {refreshedPlayer.stats?.avgSenPlaced || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ✨ Advanced Statistics */}
                        <div style={{
                            marginTop: '0.8rem',
                            display: 'flex',
                            justifyContent: 'center',
                            background: 'rgba(33,150,243,0.1)',
                            padding: '0.8rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(33,150,243,0.3)'
                        }} title="Actions Per Minute - Measure of gameplay speed">
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#2196f3', fontWeight: 'bold', fontSize: '1.1rem' }}>{refreshedPlayer.stats?.avgAPM || 0}</div>
                                <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions Per Minute</div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="card tournament-stats-card"
                        onClick={() => setShowHistory(!showHistory)}
                        style={{
                            border: '1px solid var(--accent)',
                            padding: '1.2rem',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s',
                            background: 'rgba(20, 20, 20, 0.8)',
                            overflow: 'hidden'
                        }}
                    >
                        <h3 style={{ color: '#e63946', fontSize: '1rem', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Turnir Statistika</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>K / D / A (Avg)</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    <span style={{ color: '#4caf50' }}>{displayStats.avgKills || 0}</span>
                                    <span style={{ color: '#666' }}>/</span>
                                    <span style={{ color: '#f44336' }}>{displayStats.avgDeaths || 0}</span>
                                    <span style={{ color: '#666' }}>/</span>
                                    <span style={{ color: '#ddd' }}>{displayStats.avgAssists || 0}</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>GPM / XPM</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffd700' }}>
                                    {displayStats.avgGpm || 0} / {displayStats.avgXpm || 0}
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Mečeva</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{displayStats.matches || 0}</div>
                            </div>
                        </div>

                        <div style={{
                            marginTop: '1.2rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.8rem',
                            background: 'rgba(0,0,0,0.5)',
                            padding: '0.8rem',
                            borderRadius: '6px',
                            fontSize: '0.85rem'
                        }} title="Prosečan damage i healing po meču">
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#f44336', fontWeight: 'bold' }}>{displayStats.avgHeroDamage?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: '0.65rem', color: '#666' }}>HERO DAMAGE</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#4caf50', fontWeight: 'bold' }}>{displayStats.avgHeroHealing?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: '0.65rem', color: '#666' }}>HEALING</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#ffa726', fontWeight: 'bold' }}>{displayStats.avgTowerDamage?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: '0.65rem', color: '#666' }}>TOWER DMG</div>
                            </div>
                        </div>

                        <div style={{
                            marginTop: '0.8rem',
                            fontSize: '0.8rem'
                        }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px' }}>
                                <div style={{ color: '#666', fontSize: '0.65rem', marginBottom: '0.2rem' }}>WARDING (BOUGHT)</div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Observers Bought">
                                        <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ward_observer.png"
                                            alt="Observer Ward"
                                            style={{ width: '20px', height: '15px', imageRendering: 'crisp-edges' }} />
                                        {displayStats.avgObsPlaced || 0}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Sentries Bought">
                                        <img src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ward_sentry.png"
                                            alt="Sentry Ward"
                                            style={{ width: '20px', height: '15px', imageRendering: 'crisp-edges' }} />
                                        {displayStats.avgSenPlaced || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* APM from tournament match */}
                        <div style={{
                            marginTop: '0.8rem',
                            display: 'flex',
                            justifyContent: 'center',
                            background: 'rgba(33,150,243,0.1)',
                            padding: '0.8rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(33,150,243,0.3)'
                        }} title="Actions Per Minute - From tournament replay">
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#2196f3', fontWeight: 'bold', fontSize: '1.1rem' }}>{displayStats.avgAPM || 0}</div>
                                <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions Per Minute</div>
                            </div>
                        </div>

                        {!showHistory && (
                            <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--accent)', fontSize: '0.8rem', opacity: 0.7 }}>
                                Klikni za istoriju mečeva
                            </div>
                        )}

                        {showHistory && displayStats.matchHistory && displayStats.matchHistory.length > 0 && (
                            <div style={{
                                marginTop: '1.5rem',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                paddingTop: '1rem',
                                animation: 'fadeIn 0.3s ease'
                            }} onClick={e => e.stopPropagation()}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: '#888' }}>Istorija Turnira</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {displayStats.matchHistory.map((m, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => navigate(`/matches/${m.matchId}`)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.6rem 0.8rem',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        >
                                            <HeroImage heroId={m.heroId} style={{ width: '38px', height: '38px', borderRadius: '4px', border: '1px solid #444' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: m.isWin ? '#4caf50' : '#f44336' }}>
                                                        {m.isWin ? 'Pobeda' : 'Poraz'}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                                                        {m.kills} / {m.deaths} / {m.assists}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#666' }}>{new Date(m.timestamp * 1000).toLocaleDateString()}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#ffd700', opacity: 0.8 }}>
                                                        GPM: {m.gpm} | XPM: {m.xpm}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                        <div className="flex-wrap-mobile" style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
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
                            Top {positions.find(p => p.id === refreshedPlayer.position)?.name} Heroji (poslednjih 50 mečeva)
                        </h3>
                        {positionHeroes.length > 0 ? (
                            <div className="flex-wrap-mobile" style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
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
                        <div className="flex-wrap-mobile" style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
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

// Sort icon component
const SortIcon = ({ columnKey, sortConfig }) => {
    if (sortConfig.key !== columnKey) {
        return <span style={{ opacity: 0.3, fontSize: '0.8rem', marginLeft: '4px' }}>↕</span>;
    }
    return <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
    </span>;
};

const Players = () => {
    const { teams, tournamentStats } = useTournament();
    const [viewMode, setViewMode] = useState('registration');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedTeams, setSelectedTeams] = useState(new Set()); // Set of selected team names
    const [showTeamFilter, setShowTeamFilter] = useState(false);
    const [selectedPositions, setSelectedPositions] = useState(new Set()); // Set of selected positions
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
                    stats={selectedPlayer.steamId ? tournamentStats[selectedPlayer.steamId] : null}
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
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto', position: 'relative' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--bg-secondary)', textAlign: 'left' }}>
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
                                    <div style={{
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
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-dark)'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
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
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#777'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#666'}
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
                                                        transition: 'all 0.2s ease',
                                                        border: '1px solid transparent'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                                                        e.currentTarget.style.borderColor = 'var(--accent)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.borderColor = 'transparent';
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        handlePositionToggle(position.id);
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPositions.has(position.id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            handlePositionToggle(position.id);
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            handlePositionToggle(position.id);
                                                        }}
                                                        style={{
                                                            cursor: 'pointer',
                                                            width: '16px',
                                                            height: '16px',
                                                            accentColor: 'var(--accent)',
                                                            pointerEvents: 'none'
                                                        }}
                                                    />
                                                    <span style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: '500',
                                                        color: selectedPositions.has(position.id) ? 'var(--accent)' : '#fff',
                                                        transition: 'color 0.2s',
                                                        userSelect: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <img
                                                            src={position.icon}
                                                            alt={position.name}
                                                            style={{
                                                                width: '16px',
                                                                height: '16px',
                                                                objectFit: 'contain'
                                                            }}
                                                        />
                                                        {position.name} [{position.id}]
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </th>
                            <th style={{ padding: '1rem' }}>
                                Igrač
                            </th>
                            <th
                                style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', position: 'relative', minWidth: '150px' }}
                                onClick={(e) => { e.stopPropagation(); setShowTeamFilter(!showTeamFilter); }}
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

                                {/* Team Filter Dropdown */}
                                {showTeamFilter && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '0',
                                        minWidth: '250px',
                                        width: 'max-content',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        padding: '1rem',
                                        marginTop: '0.5rem',
                                        zIndex: 1000,
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '1rem',
                                            paddingBottom: '0.75rem',
                                            borderBottom: '1px solid var(--border)'
                                        }}>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--accent)' }}>Filter Timova</h4>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => { selectAllTeams(); }}
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
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-dark)'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                                                >
                                                    Svi
                                                </button>
                                                <button
                                                    onClick={() => { deselectAllTeams(); }}
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
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#777'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#666'}
                                                >
                                                    Ništa
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            {allTeamNames.map(teamName => (
                                                <label
                                                    key={teamName}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem',
                                                        cursor: 'pointer',
                                                        padding: '0.5rem 0.4rem',
                                                        borderRadius: '4px',
                                                        transition: 'all 0.2s ease',
                                                        border: '1px solid transparent'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                                                        e.currentTarget.style.borderColor = 'var(--accent)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.borderColor = 'transparent';
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        handleTeamToggle(teamName);
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTeams.has(teamName)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            handleTeamToggle(teamName);
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            handleTeamToggle(teamName);
                                                        }}
                                                        style={{
                                                            cursor: 'pointer',
                                                            width: '16px',
                                                            height: '16px',
                                                            accentColor: 'var(--accent)',
                                                            pointerEvents: 'none'
                                                        }}
                                                    />
                                                    <span style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: '500',
                                                        color: selectedTeams.has(teamName) ? 'var(--accent)' : '#fff',
                                                        transition: 'color 0.2s',
                                                        userSelect: 'none'
                                                    }}>
                                                        {teamName}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </th>
                            {viewMode === 'registration' ? (
                                <>
                                    <th
                                        style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s' }}
                                        onClick={() => handleSort('rankTier')}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Rank <SortIcon columnKey="rankTier" sortConfig={sortConfig} />
                                    </th>
                                    <th
                                        style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s' }}
                                        onClick={() => handleSort('winrate')}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Winrate <SortIcon columnKey="winrate" sortConfig={sortConfig} />
                                    </th>
                                    <th style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span
                                                style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', padding: '2px 4px', borderRadius: '2px' }}
                                                onClick={() => handleSort('gpm')}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                GPM <SortIcon columnKey="gpm" sortConfig={sortConfig} />
                                            </span>
                                            <span>/</span>
                                            <span
                                                style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', padding: '2px 4px', borderRadius: '2px' }}
                                                onClick={() => handleSort('xpm')}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                XPM <SortIcon columnKey="xpm" sortConfig={sortConfig} />
                                            </span>
                                        </div>
                                    </th>
                                </>
                            ) : (
                                <>
                                    <th
                                        style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s' }}
                                        onClick={() => handleSort('matches')}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Mečeva <SortIcon columnKey="matches" sortConfig={sortConfig} />
                                    </th>
                                    <th style={{ padding: '1rem', title: 'Kills/Deaths/Assists' }}>
                                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                            <span
                                                style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', padding: '2px 4px', borderRadius: '2px' }}
                                                onClick={() => handleSort('kills')}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                K <SortIcon columnKey="kills" sortConfig={sortConfig} />
                                            </span>
                                            <span>/</span>
                                            <span
                                                style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', padding: '2px 4px', borderRadius: '2px' }}
                                                onClick={() => handleSort('deaths')}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                D <SortIcon columnKey="deaths" sortConfig={sortConfig} />
                                            </span>
                                            <span>/</span>
                                            <span
                                                style={{ cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.2s', padding: '2px 4px', borderRadius: '2px' }}
                                                onClick={() => handleSort('assists')}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                A <SortIcon columnKey="assists" sortConfig={sortConfig} />
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
                                    <td style={{ padding: '1rem' }}>
                                        {player.position ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                background: 'rgba(255,255,255,0.1)',
                                                fontSize: '0.9rem'
                                            }}>
                                                <img
                                                    src={positions.find(p => p.id === player.position)?.icon}
                                                    alt={positions.find(p => p.id === player.position)?.name}
                                                    style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                                {positions.find(p => p.id === player.position)?.name}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#666', fontSize: '0.9rem' }}>N/A</span>
                                        )}
                                    </td>
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
