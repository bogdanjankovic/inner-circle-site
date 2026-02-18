import React from 'react';
import RankDisplay from '../ui/RankDisplay';
import HeroTooltip from '../ui/HeroTooltip';
import { steamIdToAccountId } from '../../services/dotaApi';

const POSITIONS = [
    { id: 1, name: 'Carry', icon: 'https://i.imgur.com/rL1ZwZ4.png' },
    { id: 2, name: 'Midlane', icon: 'https://i.imgur.com/7oAbbDo.png' },
    { id: 3, name: 'Offlaner', icon: 'https://i.imgur.com/ThXJQ0n.png' },
    { id: 4, name: 'Soft Support', icon: 'https://i.imgur.com/NkAmIjB.png' },
    { id: 5, name: 'Hard Support', icon: 'https://i.imgur.com/TGv7onk.png' }
];

export const PlayerCard = ({ player, stats, viewMode, onClick }) => {
    // viewMode can be 'registration' (Pub Stats) or 'tournament' (Tournament Stats)

    // Normalize stats if they are for tournament
    const tStats = stats || {
        matches: 0,
        avgKills: 0, avgDeaths: 0, avgAssists: 0,
        winrate: 0,
        avgGpm: 0, avgXpm: 0
    };

    const positionInfo = POSITIONS.find(p => p.id === player.position);

    return (
        <div
            className="card"
            onClick={onClick}
            style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
                position: 'relative',
                padding: '1.5rem',
                border: '1px solid transparent'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'transparent';
            }}
        >
            {/* Position Icon (Top Left) */}
            {positionInfo && (
                <div style={{ position: 'absolute', top: '0.8rem', left: '0.8rem', opacity: 0.8 }} title={positionInfo.name}>
                    <img src={positionInfo.icon} alt={positionInfo.name} style={{ width: '20px', height: '20px' }} />
                </div>
            )}

            {/* Rank Indicator (Top Right) */}
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                <RankDisplay rankTier={player.rankTier} leaderboardRank={player.leaderboardRank} width="32px" />
            </div>

            {/* Avatar & Hover Info */}
            <div className="hero-tooltip-container" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                <img
                    src={player.avatar || 'https://via.placeholder.com/150'}
                    alt={player.personaName}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--border)', marginBottom: '1rem' }}
                />
                {player.isCaptain && (
                    <div style={{
                        position: 'absolute',
                        bottom: '0.8rem',
                        right: '-5px',
                        background: '#ffd700',
                        color: '#000',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        ♔
                    </div>
                )}
                <HeroTooltip heroes={player.topHeroes} />
            </div>

            <h3 style={{ margin: '0.2rem 0', fontSize: '1.1rem', color: '#fff' }}>{player.personaName}</h3>

            <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '1rem', fontWeight: 'bold' }}>
                {player.teamName || 'Bez tima'}
            </div>

            {/* Stats Summary Area */}
            <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                padding: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
            }}>
                {viewMode === 'registration' ? (
                    // PUB STATS SUMMARY
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: '#888' }}>Winrate:</span>
                            <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{player.winrate}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: '#888' }}>GPM / XPM:</span>
                            <span style={{ color: '#ffd700' }}>{player.stats?.gpm || 0} / {player.stats?.xpm || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: '#888' }}>Mečeva:</span>
                            <span>{player.winCount + player.lossCount || 0}</span>
                        </div>
                    </>
                ) : (
                    // TOURNAMENT STATS SUMMARY
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: '#888' }}>K/D/A:</span>
                            <span>
                                <span style={{ color: '#4caf50' }}>{tStats.avgKills || 0}</span> /
                                <span style={{ color: '#f44336' }}> {tStats.avgDeaths || 0}</span> /
                                <span style={{ color: '#ccc' }}> {tStats.avgAssists || 0}</span>
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: '#888' }}>Winrate:</span>
                            <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
                                {tStats.matches ? ((tStats.wins / tStats.matches) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span style={{ color: '#888' }}>Odigrano:</span>
                            <span>{tStats.matches || 0} mečeva</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PlayerCard;
