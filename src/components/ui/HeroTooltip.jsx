import { useState, useEffect } from 'react';
import { fetchHeroConstants } from '../../services/dotaApi';

// Cache constants in module scope so we don't re-fetch for every tooltip/image instance
let cachedHeroes = null;

const useHeroMap = () => {
    const [heroMap, setHeroMap] = useState(cachedHeroes || {});

    useEffect(() => {
        // If we don't have cached heroes, or the cache is empty/invalid (retry mechanism)
        if (!cachedHeroes || Object.keys(cachedHeroes).length === 0) {
            fetchHeroConstants().then(data => {
                if (data) {
                    cachedHeroes = data;
                    setHeroMap(data);
                }
            });
        } else {
            // If we already have cache but state is empty (rare case), sync it
            if (Object.keys(heroMap).length === 0) {
                setHeroMap(cachedHeroes);
            }
        }
    }, [heroMap]);

    return heroMap;
};

export const HeroImage = ({ heroId, style }) => {
    const heroMap = useHeroMap();
    
    console.log(`[HeroImage] Looking for hero ID ${heroId}. Map size: ${Object.keys(heroMap).length}`);
    
    if (!heroId) return null;
    
    const hero = heroMap[heroId];
    if (!hero) {
        // Only log warning for unique hero IDs to reduce spam
        if (!window.loggedHeroWarnings) window.loggedHeroWarnings = new Set();
        if (!window.loggedHeroWarnings.has(heroId)) {
            console.warn(`[HeroImage] Hero ID ${heroId} not found in map. Map size: ${Object.keys(heroMap).length}`);
            window.loggedHeroWarnings.add(heroId);
        }
        return null;
    }
    if (hero && !hero.img) {
        console.warn(`[HeroImage] Hero ID ${heroId} found but missing 'img' property.`, hero);
    }

    // OpenDota constants provide paths like "/apps/dota2/images/dota_react/heroes/icons/antimage.png?"
    // We downloaded them to /assets/images/dota/heroes/{heroName}.png
    // We need to derive the clean name from hero.name (npc_dota_hero_antimage)

    let localImgPath = null;
    if (hero && hero.name) {
        const cleanName = hero.name.replace('npc_dota_hero_', '');
        localImgPath = `/assets/images/dota/heroes/${cleanName}.png`;
    }

    const imgSrc = localImgPath || null;

    if (imgSrc) {
        return (
            <img
                src={imgSrc}
                alt={hero?.localized_name || heroId}
                title={hero?.localized_name}
                style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', backgroundColor: '#222', ...style }}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
        );
    }

    // Safety check: if heroId is undefined/null, render empty spacer
    if (!heroId) {
        return <div style={{ width: '40px', height: '40px', background: 'transparent', ...style }}></div>;
    }

    if (!imgSrc) {
        // console.log(`Missing icon for hero ${heroId}. Map size: ${Object.keys(heroMap).length}`);
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
