import React from 'react';

/**
 * Displays the Dota 2 Rank Medal.
 * @param {Object} props
 * @param {number} props.rankTier - The rank_tier from OpenDota (e.g. 11-75, 80).
 * @param {number} props.leaderboardRank - The leaderboard_rank from OpenDota (for Immortals).
 * @param {string} props.width - CSS width (default '48px').
 */
const RankDisplay = ({ rankTier, leaderboardRank, width = '48px' }) => {
    if (!rankTier) {
        return <span style={{ color: '#666', fontSize: '0.8rem' }}>Unranked</span>;
    }

    const rank = Math.floor(rankTier / 10);
    const stars = rankTier % 10;

    // OpenDota assets are more reliable for rank_tier mapping
    const medalUrl = `https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_${rank}.png`;
    const starUrl = `https://www.opendota.com/assets/images/dota2/rank_icons/rank_star_${stars}.png`;

    // Immortal Logic (Rank 8)
    const isImmortal = rank === 8;

    // Determine Top Rank Variant if needed (Optional polish: 8b for top 1000, 8c for top 100)
    // For now base 8 is fine, usually leaderboard_rank is just overlayed.

    return (
        <div style={{ position: 'relative', width: width, height: width, display: 'inline-block' }}>
            {/* Base Medal */}
            <img
                src={medalUrl}
                alt={`Rank ${rank}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain', dropShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                onError={(e) => { e.target.style.display = 'none'; }}
            />

            {/* Stars (Only for non-immortal) */}
            {!isImmortal && stars > 0 && (
                <img
                    src={starUrl}
                    alt={`${stars} stars`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                />
            )}

            {/* Immortal Rank Number */}
            {isImmortal && leaderboardRank && (
                <div style={{
                    position: 'absolute',
                    bottom: '0%', // Adjust based on medal image layout
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    textAlign: 'center',
                    color: '#fffcd3', // Goldish text
                    textShadow: '0 0 2px #ff0000, 0 0 4px #000, 1px 1px 2px black',
                    fontWeight: 'bold',
                    fontSize: '0.9rem', // Scale relative to width?
                    fontFamily: 'sans-serif',
                    lineHeight: 1
                }}>
                    {leaderboardRank}
                </div>
            )}
        </div>
    );
};

export default RankDisplay;
