import React, { useMemo } from 'react';
import './Bracket.css';

// Recursive Node for a single branch (Left or Right side)
// direction: 'left' (flows L->R) or 'right' (flows R->L)
const BracketNode = ({ match, sourcesMap, direction = 'left' }) => {
    if (!match) return <div className="bracket-gap"></div>;

    const sources = sourcesMap[match.matchId] || [];
    // If we have sources, render them first (further out)

    return (
        <div className={`bracket-node ${direction}`}>
            {sources.length > 0 && (
                <div className="node-children">
                    {sources.map(src => (
                        <BracketNode
                            key={src.matchId}
                            match={src}
                            sourcesMap={sourcesMap}
                            direction={direction}
                        />
                    ))}
                </div>
            )}

            {/* Connector Lines (only if we have children and not Final) */}
            {sources.length > 0 && (
                <div className="node-connector-wrapper">
                    <div className="connector-vertical"></div>
                    <div className="connector-horizontal"></div>
                </div>
            )}

            <div className={`match-card ${match.winner ? 'finished' : ''}`}>
                {/* Team 1 */}
                <div className={`team-row ${match.winner === match.team1?.id ? 'win' : ''} ${!match.team1 ? 'placeholder' : ''}`}>
                    <span className="team-name">{match.team1?.name || 'TBD'}</span>
                    {(match.team1Score !== undefined || (match.team1 && match.team2)) && (
                        <span className="score" style={{ float: 'right', fontWeight: 'bold', color: match.winner === match.team1?.id ? '#4caf50' : '#888' }}>
                            {match.team1Score || 0}
                        </span>
                    )}
                </div>
                {/* Team 2 */}
                <div className={`team-row ${match.winner === match.team2?.id ? 'win' : ''} ${!match.team2 ? 'placeholder' : ''}`}>
                    <span className="team-name">{match.team2?.name || 'TBD'}</span>
                    {(match.team2Score !== undefined || (match.team1 && match.team2)) && (
                        <span className="score" style={{ float: 'right', fontWeight: 'bold', color: match.winner === match.team2?.id ? '#4caf50' : '#888' }}>
                            {match.team2Score || 0}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const Bracket = ({ matches }) => {

    const { finalMatch, sourcesMap } = useMemo(() => {
        if (!matches || matches.length === 0) return { finalMatch: null, sourcesMap: {} };

        // Map: Which matches feed into KEY?
        // We look reliably at 'nextMatchId'. 
        const srcMap = {};
        let maxRound = 0;
        let final = null;

        matches.forEach(m => {
            if (m.round > maxRound) maxRound = m.round;
            if (m.nextMatchId) {
                if (!srcMap[m.nextMatchId]) srcMap[m.nextMatchId] = [];
                srcMap[m.nextMatchId].push(m);
            }
        });

        // Find the Final (No next match and highest round)
        final = matches.find(m => !m.nextMatchId && m.round === maxRound);

        // Sort sources
        Object.keys(srcMap).forEach(key => {
            srcMap[key].sort((a, b) => a.matchId - b.matchId);
        });

        return { finalMatch: final, sourcesMap: srcMap };
    }, [matches]);

    if (!finalMatch) {
        // Fallback for flat lists (legacy or early debug)
        return <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Bracket requires a valid Tournament Tree structure.</div>;
    }

    const semiFinals = sourcesMap[finalMatch.matchId] || [];

    // Split inputs: Top seed tree on Left, Bottom seed tree on Right
    // If we have 2 semis, semi[0] is Left, semi[1] is Right
    const leftBranchRoot = semiFinals[0];
    const rightBranchRoot = semiFinals[1];

    return (
        <div className="bracket-centered-container">
            {/* Left Side Tree (Flows Left -> Right) */}
            <div className="bracket-side left-side">
                {leftBranchRoot && (
                    <BracketNode
                        match={leftBranchRoot}
                        sourcesMap={sourcesMap}
                        direction="left"
                    />
                )}
            </div>

            {/* The Final Match (Center) */}
            <div className="bracket-center">
                <div className="finals-connector-left"></div>
                <div className="match-card final-card">
                    <div style={{ fontSize: '0.8rem', color: '#ffd700', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '2px' }}>Grand Final</div>
                    <div className={`team-row ${finalMatch.winner === finalMatch.team1?.id ? 'win' : ''}`}>
                        {finalMatch.team1?.name || 'TBD'}
                        {(finalMatch.team1Score !== undefined || (finalMatch.team1 && finalMatch.team2)) && (
                            <span className="score" style={{ float: 'right', fontWeight: 'bold', color: finalMatch.winner === finalMatch.team1?.id ? '#4caf50' : '#888' }}>
                                {finalMatch.team1Score || 0}
                            </span>
                        )}
                    </div>

                    <div className="vs-badge">VS</div>

                    <div className={`team-row ${finalMatch.winner === finalMatch.team2?.id ? 'win' : ''}`}>
                        {finalMatch.team2?.name || 'TBD'}
                        {(finalMatch.team2Score !== undefined || (finalMatch.team1 && finalMatch.team2)) && (
                            <span className="score" style={{ float: 'right', fontWeight: 'bold', color: finalMatch.winner === finalMatch.team2?.id ? '#4caf50' : '#888' }}>
                                {finalMatch.team2Score || 0}
                            </span>
                        )}
                    </div>
                    {finalMatch.winner && <div className="winner-trophy">🏆</div>}
                </div>
                <div className="finals-connector-right"></div>
            </div>

            {/* Right Side Tree (Flows Right -> Left) */}
            <div className="bracket-side right-side">
                {rightBranchRoot && (
                    <BracketNode
                        match={rightBranchRoot}
                        sourcesMap={sourcesMap}
                        direction="right"
                    />
                )}
            </div>
        </div>
    );
};

export default Bracket;
