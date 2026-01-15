import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { getMatchDetails, getHeroConstants } from '../services/dotaApi';

const AdminUpload = () => {
    const [stage, setStage] = useState('json'); // 'json' | 'mapping'
    const [jsonInput, setJsonInput] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState(null);

    // Context
    const { dispatch, teams } = useTournament();
    const navigate = useNavigate();

    // Mapping State
    const [radiantTeamId, setRadiantTeamId] = useState('');
    const [direTeamId, setDireTeamId] = useState('');
    const [playerMapping, setPlayerMapping] = useState({}); // { steamId: registeredId }

    // Facet data and hero mapping
    const [heroFacets, setHeroFacets] = useState({}); // { heroName: { facetIndex: { title, icon } } }
    const [heroIdToName, setHeroIdToName] = useState({}); // { heroId: heroName }
    const [loadingFacets, setLoadingFacets] = useState(false);

    // Load hero facets from GitHub hero_abilities.json and heroes.json for mapping
    useEffect(() => {
        const loadHeroFacets = async () => {
            try {
                setLoadingFacets(true);

                // Load hero abilities (facets)
                const abilitiesResponse = await fetch('https://raw.githubusercontent.com/odota/dotaconstants/master/build/hero_abilities.json');
                const heroAbilities = await abilitiesResponse.json();

                // Load heroes for ID to name mapping
                const heroesResponse = await fetch('https://raw.githubusercontent.com/odota/dotaconstants/master/build/heroes.json');
                const heroes = await heroesResponse.json();

                const facets = {};
                const heroIdToName = {};

                // Create hero ID to name mapping
                Object.values(heroes).forEach(hero => {
                    if (hero.id && hero.name) {
                        heroIdToName[hero.id] = hero.name;
                    }
                });

                // Process facets
                Object.entries(heroAbilities).forEach(([heroKey, heroData]) => {
                    if (heroData.facets && Array.isArray(heroData.facets)) {
                        facets[heroKey] = {};
                        heroData.facets.forEach((facet, index) => {
                            // Index starts from 0, but facet ID from .dem starts from 1
                            facets[heroKey][index] = {
                                title: facet.title || `Facet ${index}`,
                                description: facet.description || '',
                                icon: facet.icon || ''
                            };
                        });
                    }
                });

                setHeroFacets(facets);
                setHeroIdToName(heroIdToName);
                console.log('Loaded hero facets from hero_abilities.json:', facets);
                console.log('Hero ID to name mapping:', heroIdToName);
            } catch (err) {
                console.error('Error loading hero facets:', err);
            } finally {
                setLoadingFacets(false);
            }
        };

        loadHeroFacets();
    }, []);

    const handleParse = () => {
        try {
            const data = JSON.parse(jsonInput);
            if (!data.matchId || !data.players) throw new Error("Invalid format");
            setParsedData(data);
            setStage('mapping');
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // Link to Tournament Stats
    const { activeTournament, linkMatchToTournament, processMatchStats } = useTournament();
    const [bracketMatchId, setBracketMatchId] = useState('');

    // Get facet info for a hero
    const getFacetInfo = (heroId, facetId) => {
        // ... (elided)
        // If facetId is 0 or null, return empty
        if (!facetId || facetId === 0) {
            return { title: '', icon: '' };
        }

        // Get hero name from heroId
        const heroName = heroIdToName[heroId];
        if (!heroName) {
            return { title: `Facet ${facetId}`, icon: '' };
        }

        // Convert facetId from .dem (1-based) to array index (0-based)
        const facetIndex = facetId - 1;

        // Get facet info for this hero
        const heroFacetsData = heroFacets[heroName];
        if (!heroFacetsData || !heroFacetsData[facetIndex]) {
            return { title: `Facet ${facetId}`, icon: '' };
        }

        return heroFacetsData[facetIndex];
    };

    const handleSave = async () => {
        if (!parsedData) return;

        // Wait for facets to load
        if (loadingFacets) {
            alert('Molimo sačekajte da se podaci o facetima učitaju...');
            return;
        }

        // Inject mapped IDs and facet info
        const finalPlayers = parsedData.players.map(p => {
            const registeredId = playerMapping[p.steamId || p.name];
            const facetInfo = getFacetInfo(p.heroId, p.facet || 0);

            return {
                ...p,
                tournamentPlayerId: registeredId || null,
                facetTitle: facetInfo.title,
                facetIcon: facetInfo.icon
            };
        });

        const finalMatch = {
            ...parsedData,
            timestamp: parsedData.timestamp || parsedData.start_time || Math.floor(Date.now() / 1000), // Normalize timestamp
            duration: parsedData.duration || 0,
            radiantTeamId,
            direTeamId,
            players: finalPlayers
        };

        // If bracket match selected, link it. Otherwise just add standard match
        if (bracketMatchId && activeTournament) {
            // We know the bracket match explicitly. 
            // 1. Save stats but SKIP auto-link (to avoid double count)
            await processMatchStats(finalMatch, true);

            // 2. Link Explicitly
            await linkMatchToTournament(activeTournament.id, bracketMatchId, finalMatch);
            alert("Match linked to Tournament Bracket!");
        } else {
            // Just add match. If it happens to match a bracket node by teams, 
            // processMatchStats (default false) will auto-link it.
            await processMatchStats(finalMatch, false);
        }

        navigate('/results'); // Go to results to see it
    };

    // Helper to get players of selected team
    const getTeamPlayers = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.players : [];
    };

    // Get unplayed matches from active tournament
    const availableBracketMatches = activeTournament ? activeTournament.bracket_data.filter(m => !m.winner) : [];

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '1000px' }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>
                {stage === 'json' ? 'Upload Match JSON' : 'Map Players to Teams'}
            </h1>

            {error && <div className="alert alert-danger">{error}</div>}

            {stage === 'json' ? (
                <div className="card">
                    <p style={{ color: '#aaa', marginBottom: '1rem' }}>Paste the output from <code>parse_replay.js</code> here.</p>
                    <textarea
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                        style={{ width: '100%', height: '400px', background: '#111', color: '#0f0', border: '1px solid #333', padding: '1rem', fontFamily: 'monospace' }}
                    />
                    <button onClick={handleParse} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Next: Map Players</button>
                </div>
            ) : (
                <div className="card">
                    {activeTournament && (
                        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--accent)', background: 'rgba(255,255,255,0.05)' }}>
                            <h3 style={{ color: 'var(--accent)' }}>Links to Tournament: {activeTournament.name}</h3>
                            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Select which tournament slot this match belongs to (optional). This will auto-select teams.</p>
                            <select
                                value={bracketMatchId}
                                onChange={e => {
                                    const mId = e.target.value;
                                    setBracketMatchId(mId);
                                    if (mId) {
                                        const match = availableBracketMatches.find(m => m.matchId.toString() === mId.toString());
                                        if (match) {
                                            if (match.team1) setRadiantTeamId(match.team1.id);
                                            if (match.team2) setDireTeamId(match.team2.id);
                                        }
                                    }
                                }}
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            >
                                <option value="">-- Just a Regular Match (No Bracket Link) --</option>
                                {availableBracketMatches.map(m => {
                                    const t1 = m.team1 ? m.team1.name : 'TBD';
                                    const t2 = m.team2 ? m.team2.name : 'TBD';
                                    return <option key={m.matchId} value={m.matchId}>{t1} vs {t2} (ID: {m.matchId})</option>
                                })}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ color: '#4caf50' }}>Radiant Team</h3>
                            <select
                                value={radiantTeamId}
                                onChange={e => setRadiantTeamId(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', background: '#222', color: 'white', border: '1px solid #444' }}
                            >
                                <option value="">Select Team...</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ color: '#f44336' }}>Dire Team</h3>
                            <select
                                value={direTeamId}
                                onChange={e => setDireTeamId(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', background: '#222', color: 'white', border: '1px solid #444' }}
                            >
                                <option value="">Select Team...</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Radiant Players Mapping */}
                        <div>
                            <h4 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Radiant Replay Players</h4>
                            {parsedData.players.filter(p => p.team === 'Radiant').map((p, idx) => (
                                <div key={idx} style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(76, 175, 80, 0.1)' }}>
                                    <div style={{ fontWeight: 'bold' }}>{p.name} <span style={{ fontSize: '0.8rem', color: '#888' }}>({p.heroId})</span></div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{p.steamId}</div>
                                    <select
                                        style={{ width: '100%', marginTop: '0.5rem', padding: '0.3rem', background: '#222', color: 'white' }}
                                        onChange={(e) => setPlayerMapping({ ...playerMapping, [p.steamId || p.name]: e.target.value })}
                                    >
                                        <option value="">-- Map to Registered Player --</option>
                                        {getTeamPlayers(radiantTeamId).map((tp, i) => (
                                            <option key={tp.steamId || i} value={tp.steamId}>
                                                {tp.personaName || tp.name || 'Unknown'} {tp.isCaptain ? '(C)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* Dire Players Mapping */}
                        <div>
                            <h4 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Dire Replay Players</h4>
                            {parsedData.players.filter(p => p.team === 'Dire').map((p, idx) => (
                                <div key={idx} style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(244, 67, 54, 0.1)' }}>
                                    <div style={{ fontWeight: 'bold' }}>{p.name} <span style={{ fontSize: '0.8rem', color: '#888' }}>({p.heroId})</span></div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{p.steamId}</div>
                                    <select
                                        style={{ width: '100%', marginTop: '0.5rem', padding: '0.3rem', background: '#222', color: 'white' }}
                                        onChange={(e) => setPlayerMapping({ ...playerMapping, [p.steamId || p.name]: e.target.value })}
                                    >
                                        <option value="">-- Map to Registered Player --</option>
                                        {getTeamPlayers(direTeamId).map((tp, i) => (
                                            <option key={tp.steamId || i} value={tp.steamId}>
                                                {tp.personaName || tp.name || 'Unknown'} {tp.isCaptain ? '(C)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: '2rem', width: '100%', padding: '1rem', fontSize: '1.2rem' }}>
                        CONFIRM & SAVE MATCH
                    </button>
                    <button onClick={() => setStage('json')} style={{ marginTop: '1rem', width: '100%', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>Back</button>
                </div>
            )}
        </div>
    );
};

export default AdminUpload;
