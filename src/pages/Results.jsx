import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useNavigate } from 'react-router-dom';

const SeriesCard = ({ series, teams, onExpand, expanded }) => {
    const navigate = useNavigate();
    const { matchHistory } = useTournament();
    const isTeam1Winner = series.winner && series.team1 && series.winner.toString() === series.team1.id.toString();
    const isTeam2Winner = series.winner && series.team2 && series.winner.toString() === series.team2.id.toString();

    const t1 = series.team1 || { name: 'TBD', logo: '' };
    const t2 = series.team2 || { name: 'TBD', logo: '' };

    // Format Date
    const dateStr = series.scheduledTime ? new Date(series.scheduledTime).toLocaleDateString() : 'Datum TBD';

    // Status Text
    let statusText = `${series.team1Score || 0} - ${series.team2Score || 0}`;
    if (series.winner) statusText += " (Kraj)";
    else statusText += ` (${series.format ? series.format.toUpperCase() : 'BO1'})`;

    // Helper for safe logo
    const getLogo = (team) => team.logo || 'https://via.placeholder.com/50';

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #333', marginBottom: '1rem' }}>
            <div
                onClick={onExpand}
                className="series-card-grid"
                style={{
                    padding: '1.5rem',
                    cursor: 'pointer',
                    background: 'linear-gradient(90deg, #1a1a1a 0%, #222 50%, #1a1a1a 100%)'
                }}
            >
                {/* Team 1 */}
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px' }}>
                    <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isTeam1Winner ? '#4caf50' : 'white' }}>
                            {t1.name} {isTeam1Winner && '🏆'}
                        </div>
                        {series.winner && <div style={{ fontSize: '0.8rem', color: isTeam1Winner ? '#4caf50' : '#666' }}>
                            {isTeam1Winner ? 'Pobednik' : ''}
                        </div>}
                    </div>
                    <img src={getLogo(t1)} alt={t1.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', border: isTeam1Winner ? '2px solid #4caf50' : '1px solid #444', opacity: series.winner && !isTeam1Winner ? 0.6 : 1 }} />
                </div>

                {/* Score & Info */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '5px' }}>
                        {series.team1Score || 0}:{series.team2Score || 0}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>{statusText}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>{series.tournamentRoundText || 'Bracket Match'} • {dateStr}</div>
                </div>

                {/* Team 2 */}
                <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '15px' }}>
                    <img src={getLogo(t2)} alt={t2.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', border: isTeam2Winner ? '2px solid #4caf50' : '1px solid #444', opacity: series.winner && !isTeam2Winner ? 0.6 : 1 }} />
                    <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isTeam2Winner ? '#4caf50' : 'white' }}>
                            {t2.name} {isTeam2Winner && '🏆'}
                        </div>
                        {series.winner && <div style={{ fontSize: '0.8rem', color: isTeam2Winner ? '#4caf50' : '#666' }}>
                            {isTeam2Winner ? 'Pobednik' : ''}
                        </div>}
                    </div>
                </div>
            </div>

            {/* Expanded Games List */}
            {expanded && (
                <div style={{ background: '#111', borderTop: '1px solid #333', padding: '1rem' }}>
                    <h4 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>Detalji Mečeva (Games in Series)</h4>

                    {(!series.games || series.games.length === 0) && series.realMatchId && (
                        // Fallback for old data where games array wasn't populated but realMatchId exists
                        <div style={{ padding: '0.5rem', background: '#222', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Game (Legacy Record)</span>
                            <span>ID: {series.realMatchId}</span>
                            <span>Winner: {series.winner && series.winner.toString() === series.team1?.id.toString() ? t1.name : t2.name}</span>
                        </div>
                    )}

                    {series.games && series.games.map((game, idx) => {
                        // Resolve Winner Name logic
                        console.log("Game Data:", game); // Debug
                        let winnerName = game.winner; // Default Radiant/Dire

                        // Try to map back to teams

                        // Fallback: If game object doesn't have team IDs (legacy link), check global history
                        let rId = game.radiantTeamId;
                        let dId = game.direTeamId;

                        if (!rId && !dId && matchHistory) {
                            const historicMatch = matchHistory.find(m => m.matchId.toString() === game.matchId.toString());
                            if (historicMatch) {
                                rId = historicMatch.radiantTeamId;
                                dId = historicMatch.direTeamId;
                            }
                        }

                        // If winner is Radiant, checking which bracket team was Radiant
                        if (game.winner === 'Radiant' && rId) {
                            if (series.team1 && series.team1.id.toString() == rId.toString()) winnerName = series.team1.name;
                            else if (series.team2 && series.team2.id.toString() == rId.toString()) winnerName = series.team2.name;
                        } else if (game.winner === 'Dire' && dId) {
                            if (series.team1 && series.team1.id.toString() == dId.toString()) winnerName = series.team1.name;
                            else if (series.team2 && series.team2.id.toString() == dId.toString()) winnerName = series.team2.name;
                        }

                        // Styles for hover effect could be added via CSS class, passing inline for now
                        return (
                            <div
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation(); // prevent collapsing card
                                    navigate(`/matches/${game.matchId}`);
                                }}
                                style={{
                                    padding: '0.8rem',
                                    background: '#222',
                                    borderRadius: '4px',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    border: '1px solid transparent',
                                    transition: 'border-color 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#4caf50'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                            >
                                <div>
                                    <span style={{ color: '#aaa', marginRight: '1rem' }}>Game {idx + 1}</span>
                                    <span style={{ fontWeight: 'bold', color: game.winner === 'Radiant' ? '#4caf50' : '#f44336' }}>
                                        Winner: {winnerName}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                    ID: {game.matchId} | {game.timestamp && game.timestamp > 0 ? new Date(game.timestamp * 1000).toLocaleDateString() : 'N/A'} | {Math.floor(game.duration / 60)}:{String(Math.floor(game.duration) % 60).padStart(2, '0')}
                                </div>
                            </div>
                        );
                    })}

                    {(!series.games || series.games.length === 0) && !series.realMatchId && (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Nema detaljnih podataka o mečevima za ovu seriju.</p>
                    )}
                </div>
            )
            }
        </div >
    );
};

const Results = () => {
    const { tournaments, matchHistory, teams } = useTournament();
    const [expandedSeries, setExpandedSeries] = useState(null);

    // Filter matches that are NOT part of any tournament (Scrims)
    const getScrimMatches = () => {
        // Collect all match IDs that are linked in brackets
        const linkedMatchIds = new Set();
        tournaments.forEach(t => {
            if (t.bracket_data) {
                t.bracket_data.forEach(m => {
                    if (m.realMatchId) linkedMatchIds.add(m.realMatchId.toString());
                    if (m.games) m.games.forEach(g => linkedMatchIds.add(g.matchId.toString()));
                });
            }
        });

        return matchHistory.filter(m => !linkedMatchIds.has(m.matchId.toString()));
    };

    const scrimMatches = getScrimMatches();

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ marginBottom: '3rem', textAlign: 'center', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px' }}>Rezultati & Arhiva</h1>

            {/* 1. Active Tournaments */}
            {tournaments.filter(t => t.status === 'active').map(tournament => (
                <div key={tournament.id} style={{ marginBottom: '4rem' }}>
                    <h2 style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                        U Toku: {tournament.name}
                    </h2>

                    {tournament.bracket_data
                        .filter(m => (m.team1Score > 0 || m.team2Score > 0 || m.winner))
                        .map((series) => (
                            <SeriesCard
                                key={series.matchId}
                                series={series}
                                teams={teams}
                                expanded={expandedSeries === series.matchId}
                                onExpand={() => setExpandedSeries(expandedSeries === series.matchId ? null : series.matchId)}
                            />
                        ))}
                    {tournament.bracket_data.filter(m => (m.team1Score > 0 || m.team2Score > 0 || m.winner)).length === 0 && (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Nema odigranih mečeva u ovom turniru.</p>
                    )}
                </div>
            ))}

            {/* 2. Archived Tournaments */}
            {tournaments.filter(t => t.status === 'archived').map(tournament => (
                <div key={tournament.id} style={{ marginBottom: '4rem' }}>
                    <h2 style={{ borderBottom: '2px solid #666', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#aaa' }}>
                        Arhiva: {tournament.name}
                    </h2>
                    {tournament.bracket_data
                        .filter(m => (m.team1Score > 0 || m.team2Score > 0 || m.winner))
                        .map((series) => (
                            <SeriesCard
                                key={series.matchId}
                                series={series}
                                teams={teams}
                                expanded={expandedSeries === series.matchId}
                                onExpand={() => setExpandedSeries(expandedSeries === series.matchId ? null : series.matchId)}
                            />
                        ))}
                </div>
            ))}

            {/* 3. Scrims / Friendly Matches */}
            <div style={{ marginTop: '4rem' }}>
                <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#888' }}>
                    Prijateljski Mečevi / Scrims
                </h2>
                {scrimMatches.length === 0 ? <p style={{ color: '#666' }}>Nema prijateljskih mečeva.</p> : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {scrimMatches.map(match => {
                            const winnerName = match.winner === 'Radiant' ? (match.radiantTeamName || 'Radiant') : (match.direTeamName || 'Dire');
                            const dateStr = new Date(match.timestamp).toLocaleDateString();

                            return (
                                <div key={match.matchId} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{match.radiantTeamName || 'Radiant'} vs {match.direTeamName || 'Dire'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{dateStr}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#4caf50', fontWeight: 'bold' }}>Pobednik: {winnerName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>ID: {match.matchId}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Results;
