import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { getPositionHeroesFromStratz, fetchPlayerData, steamIdToAccountId } from '../../services/dotaApi';
import RankDisplay from '../ui/RankDisplay';
import { HeroImage } from '../ui/HeroTooltip';

export const PlayerModal = ({ player, onClose, stats }) => {
    if (!player) return null;

    const navigate = useNavigate();
    const [refreshedPlayer, setRefreshedPlayer] = useState(player);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [positionHeroes, setPositionHeroes] = useState([]);

    const [showHistory, setShowHistory] = useState(false);

    // Position data - unified
    const POSITIONS = [
        { id: 1, name: 'Carry', icon: 'https://i.imgur.com/rL1ZwZ4.png' },
        { id: 2, name: 'Midlane', icon: 'https://i.imgur.com/7oAbbDo.png' },
        { id: 3, name: 'Offlaner', icon: 'https://i.imgur.com/ThXJQ0n.png' },
        { id: 4, name: 'Soft Support', icon: 'https://i.imgur.com/NkAmIjB.png' },
        { id: 5, name: 'Hard Support', icon: 'https://i.imgur.com/TGv7onk.png' }
    ];

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
                        const accountId = player.accountId || (player.steamId ? steamIdToAccountId(player.steamId.toString()) : null);
                        posHeroes = await getPositionHeroesFromStratz(accountId, player.position, player.steamId, false);
                    }

                    // Get Dota Plus heroes from STRATZ (with caching)
                    let dotaPlusHeroes = [];
                    try {
                        const { getTopDotaPlusHeroes, steamIdToStratzAccountId } = await import("../../services/stratzApi.js");
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
                            ...playerData,
                            topHeroes: existingTopHeroes.length > 0 ? existingTopHeroes : (playerData.topHeroes || []),
                            dotaPlusHeroes: dotaPlusHeroes || [],
                            winCount: playerData.profile?.winCount || 0,
                            lossCount: playerData.profile?.lossCount || 0,
                            stats: {
                                ...playerData.stats,
                                gpm: playerData.stats?.avgGPM || 0,
                                xpm: playerData.stats?.avgXPM || 0
                            }
                        }));
                    } catch (error) {
                        console.error('[PUB STATS] Error fetching player data:', error);
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
                    const accountId = player.accountId || (player.steamId ? steamIdToAccountId(player.steamId.toString()) : null);
                    const posHeroes = await getPositionHeroesFromStratz(accountId, player.position, player.steamId, true);
                    setPositionHeroes(posHeroes);
                } catch (error) {
                    console.error('Failed to refresh position heroes:', error);
                }
            }
        };

        refreshPositionHeroes();
    }, [player.position]);

    const displayStats = stats || {
        matches: 0,
        avgKills: 0, avgDeaths: 0, avgAssists: 0,
        avgHeroDamage: 0, avgHeroHealing: 0, avgTowerDamage: 0,
        avgGpm: 0, avgXpm: 0,
        avgObsPlaced: 0, avgSenPlaced: 0, avgObsKilled: 0, avgSenKilled: 0,
        matchHistory: []
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2100 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                <button className="close-modal" onClick={onClose}>&times;</button>

                <div className="modal-stack-mobile" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <img
                        src={refreshedPlayer.avatar || 'https://via.placeholder.com/150'}
                        alt={refreshedPlayer.personaName}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--accent)' }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{refreshedPlayer.personaName}</h2>
                            {refreshedPlayer.isCaptain && (
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
                        <div className="rank-row" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <RankDisplay rankTier={refreshedPlayer.rankTier} leaderboardRank={refreshedPlayer.leaderboardRank} width="40px" />
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
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4caf50' }}>{refreshedPlayer.winrate || 0}%</div>
                            </div>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>GPM / XPM</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffd700' }}>
                                    {refreshedPlayer.stats?.gpm || 0} / {refreshedPlayer.stats?.xpm || 0}
                                </div>
                            </div>
                            <div>
                                <label style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginBottom: '0.2rem' }}>Mečeva</label>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    {(Number(refreshedPlayer.winCount) || 0) + (Number(refreshedPlayer.lossCount) || 0)}
                                </div>
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
                            Top {POSITIONS.find(p => p.id === refreshedPlayer.position)?.name} Heroji (poslednjih 50 mečeva)
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

export default PlayerModal;
