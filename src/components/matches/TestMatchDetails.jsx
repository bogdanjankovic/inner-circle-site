import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTournament } from '../../context/TournamentContext';
import './MatchDetails.css';
import { HeroImage } from '../ui/HeroTooltip';

const HERO_IMG_BASE = '/assets/images/dota/heroes/';
const ITEM_IMG_BASE = '/assets/images/dota/items/';

const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
};

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const TestMatchDetails = () => {
    const { id } = useParams();
    const { teams, matchHistory } = useTournament();
    const [activeTab, setActiveTab] = useState('overview');

    const match = useMemo(() => matchHistory.find(m => m.matchId.toString() === id), [matchHistory, id]);

    if (!match) return <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Match not found (ID: {id})</div>;
    if (!match.players) return <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Match data incomplete</div>;

    const radiantPlayers = match.players.filter(p => p.team === 'Radiant');
    const direPlayers = match.players.filter(p => p.team === 'Dire');

    const winnerName = match.winner === 'Radiant'
        ? (teams.find(t => t.id === match.radiantTeamId)?.name || 'Radiant')
        : (teams.find(t => t.id === match.direTeamId)?.name || 'Dire');

    return (
        <div className="match-details-container test-version">
            <div className="match-header" style={{ borderBottom: '2px solid #00d2ff' }}>
                <div>
                    <span className="match-id" style={{ color: '#00d2ff' }}>TEST Match {match.matchId}</span>
                    <span className="match-duration">{formatTime(match.duration)}</span>
                </div>
                <div className={`winner-label ${match.winner === 'Radiant' ? 'radiant-text' : 'dire-text'}`}>
                    {winnerName} Victory
                </div>
            </div>

            <div className="tabs">
                <button className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Purchase Timeline</button>
                <button className={`tab-button ${activeTab === 'heatmaps' ? 'active' : ''}`} onClick={() => setActiveTab('heatmaps')}>Wards & Map</button>
            </div>

            {activeTab === 'overview' && (
                <div className="overview-tab">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                        <div>
                            <h3 style={{ color: '#4caf50', borderBottom: '1px solid #4caf5033' }}>Radiant</h3>
                            {radiantPlayers.map(p => <MiniPlayerCard key={p.steamId} p={p} />)}
                        </div>
                        <div>
                            <h3 style={{ color: '#f44336', borderBottom: '1px solid #f4433633' }}>Dire</h3>
                            {direPlayers.map(p => <MiniPlayerCard key={p.steamId} p={p} />)}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'timeline' && (
                <div className="timeline-tab" style={{ marginTop: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Item Purchase History</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {[...radiantPlayers, ...direPlayers].map(p => (
                            <div key={p.steamId} className="player-timeline-row" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <HeroImage heroId={p.heroId} style={{ width: '40px', borderRadius: '4px' }} />
                                    <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                    {p.item_purchase_log?.map((item, idx) => (
                                        <div key={idx} style={{ textAlign: 'center', minWidth: '50px' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#888' }}>{formatTime(item.time)}</div>
                                            <img
                                                src={`${ITEM_IMG_BASE}${item.item.toLowerCase()}.png`}
                                                alt={item.item}
                                                title={`${item.item} @ ${formatTime(item.time)}`}
                                                style={{ width: '32px', height: '24px', borderRadius: '2px', border: '1px solid #333' }}
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'heatmaps' && (
                <div className="heatmap-tab">
                    <h3 style={{ margin: '1rem 0' }}>Wards & Movement</h3>
                    <div style={{ background: '#111', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ color: '#888' }}>[ Minimap & Ward Analytics Component ]</p>
                        <p style={{ fontSize: '0.8rem', color: '#666' }}>Heatmap integration coming soon to test version.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const MiniPlayerCard = ({ p }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', marginBottom: '0.5rem', borderRadius: '4px' }}>
        <HeroImage heroId={p.heroId} style={{ width: '50px' }} />
        <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{p.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{p.heroName} • Lvl {p.level}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>{p.kills} / {p.deaths} / {p.assists}</div>
            <div style={{ fontSize: '0.8rem', color: '#gold' }}>{formatNumber(p.netWorth)} NW</div>
        </div>
    </div>
);

export default TestMatchDetails;
