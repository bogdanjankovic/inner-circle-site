import { useState, useEffect } from 'react';
import { fetchHeroConstants } from '../../services/dotaApi';

// Cache constants in module scope so we don't re-fetch for every tooltip/image instance
let cachedHeroes = null;

const useHeroMap = () => {
    const [heroMap, setHeroMap] = useState(cachedHeroes || {});

    useEffect(() => {
        if (!cachedHeroes) {
            fetchHeroConstants().then(data => {
                cachedHeroes = data;
                setHeroMap(data);
            });
        }
    }, []);

    return heroMap;
};

export const HeroImage = ({ heroId, style }) => {
    const heroMap = useHeroMap();
    const heroData = heroMap[heroId];

    // OpenDota constants provide paths like "/apps/dota2/images/dota_react/heroes/icons/antimage.png?"
    const imgSrc = heroData?.icon
        ? `https://cdn.cloudflare.steamstatic.com${heroData.icon}`
        : null;

    if (imgSrc) {
        return (
            <img
                src={imgSrc}
                alt={heroData?.localized_name || heroId}
                title={heroData?.localized_name}
                style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', backgroundColor: '#222', ...style }}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
        );
    }

    // Safety check: if heroId is undefined/null, render empty spacer
    if (!heroId) {
        return <div style={{ width: '40px', height: '40px', background: 'transparent', ...style }}></div>;
    }

    return (
        <div style={{ width: '40px', height: '40px', background: '#555', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', ...style }}>
            ID:{heroId}
        </div>
    );
};

const HeroTooltip = ({ heroes }) => {
    const heroMap = useHeroMap();

    if (!heroes || heroes.length === 0) return null;

    return (
        <div className="hero-tooltip">
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>Top 3 Heroja</h4>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {heroes.map((h, i) => {
                    return (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <HeroImage heroId={h.heroId} />
                            <div style={{ display: 'none' }}>H{h.heroId}</div>
                            <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>{h.winrate}% WR</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HeroTooltip;
