import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPlayerData, POSITION_NAMES } from '../services/dotaApi';
import RankDisplay from '../components/ui/RankDisplay';
import { HeroImage } from '../components/ui/HeroTooltip';
import { supabase } from '../lib/supabase';
import SEOHead from '../components/seo/SEOHead';
import { getApprovedShufflePlayers, getConfirmedShuffleTeams, getShuffleTrophiesMap } from '../services/shuffleService';

// Position data with icons
const positions = [
    { id: 1, name: 'Carry', icon: 'https://i.imgur.com/rL1ZwZ4.png' },
    { id: 2, name: 'Midlane', icon: 'https://i.imgur.com/7oAbbDo.png' },
    { id: 3, name: 'Offlaner', icon: 'https://i.imgur.com/ThXJQ0n.png' },
    { id: 4, name: 'Soft Support', icon: 'https://i.imgur.com/NkAmIjB.png' },
    { id: 5, name: 'Hard Support', icon: 'https://i.imgur.com/TGv7onk.png' }
];

const BlueTrophy = ({ trophies }) => {
    if (!trophies || trophies.length === 0) return null;

    return (
        <div style={{ display: 'flex', gap: '4px', marginLeft: '5px' }}>
            {trophies.map((t, i) => (
                <Link
                    key={i}
                    to={`/tournaments#tournament-${t.tournamentId}`}
                    title={`Pobednik shuffle turnira: ${t.tournamentName}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#2196f3" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 2px rgba(33, 150, 243, 0.5))' }}>
                        <path d="M5 2H19C19.5523 2 20 2.44772 20 3V6C20 6.55228 19.5523 7 19 7H18V10C18 13.3137 15.3137 16 12 16C8.68629 16 6 13.3137 6 10V7H5C4.44772 7 4 6.55228 4 6V3C4 2.44772 4.44772 2 5 2ZM16 7V10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10V7H16ZM12 18C13.5 18 14.85 18.25 15.5 18.75V20H8.5V18.75C9.15 18.25 10.5 18 12 18Z" />
                    </svg>
                </Link>
            ))}
        </div>
    );
};

const ShuffleRegistration = () => {
    const navigate = useNavigate();
    const [steamId, setSteamId] = useState('');
    const [playerData, setPlayerData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPositions, setSelectedPositions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [approvedPlayers, setApprovedPlayers] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);
    const [confirmedTeams, setConfirmedTeams] = useState(null);
    const [trophiesMap, setTrophiesMap] = useState({});
    const [existingTrophies, setExistingTrophies] = useState(null);
    const [discordId, setDiscordId] = useState('');

    // Fetch approved players and confirmed teams on mount
    useEffect(() => {
        const loadData = async () => {
            const [players, teams, trophies] = await Promise.all([
                getApprovedShufflePlayers(),
                getConfirmedShuffleTeams(),
                getShuffleTrophiesMap()
            ]);
            setApprovedPlayers(players);
            setConfirmedTeams(teams);
            setTrophiesMap(trophies);
            setLoadingPlayers(false);
        };
        loadData();
    }, [submitted]); // Refresh after submit

    const handleCheckPlayer = async () => {
        if (!steamId.trim()) {
            setError('Unesite Steam ID');
            return;
        }

        setLoading(true);
        setError(null);
        setPlayerData(null);

        try {
            const result = await fetchPlayerData(steamId);
            if (result.valid) {
                setPlayerData(result);

                // Also check if they have medals/trophies from before
                const { data: existing } = await supabase
                    .from('shuffle_players')
                    .select('trophies, preferred_positions, discord_id')
                    .eq('steam_id', steamId.toString())
                    .maybeSingle();

                if (existing && existing.trophies && existing.trophies.length > 0) {
                    setExistingTrophies(existing.trophies);
                } else {
                    setExistingTrophies(null);
                }

                // If they exist, pre-fill their previous positions and Discord ID
                if (existing) {
                    if (existing.preferred_positions) setSelectedPositions(existing.preferred_positions);
                    if (existing.discord_id) setDiscordId(existing.discord_id);
                }

                setError(null);
            } else {
                setError('Igrač nije pronađen ili je profil privatan.');
            }
        } catch (err) {
            setError('Greška pri proveri igrača: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const togglePosition = (posId) => {
        setSelectedPositions(prev => {
            if (prev.includes(posId)) {
                return prev.filter(p => p !== posId);
            } else {
                return [...prev, posId].sort((a, b) => a - b);
            }
        });
    };

    const handleSubmit = async () => {
        if (!playerData) {
            setError('Potrebno je prvo proveriti igrača');
            return;
        }

        if (selectedPositions.length === 0) {
            setError('Izaberite bar jednu poziciju');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Check if player already registered
            const { data: existing } = await supabase
                .from('shuffle_players')
                .select('id, status')
                .eq('steam_id', steamId.toString())
                .maybeSingle();

            if (existing) {
                if (existing.status === 'idle') {
                    // Update existing idle player
                    const { error: updateError } = await supabase
                        .from('shuffle_players')
                        .update({
                            steam_account_id: playerData.accountId,
                            persona_name: playerData.personaName,
                            avatar: playerData.avatar,
                            rank_tier: playerData.rankTier,
                            winrate: parseFloat(playerData.winrate) || null,
                            preferred_positions: selectedPositions,
                            discord_id: discordId || null,
                            status: 'pending' // Send back for approval
                        })
                        .eq('id', existing.id);

                    if (updateError) throw updateError;
                    setSubmitted(true);
                    return;
                } else {
                    // Block other active statuses
                    if (existing.status === 'pending') {
                        setError('Već ste prijavljeni i čekate odobrenje.');
                    } else if (existing.status === 'approved') {
                        setError('Već ste odobreni za shuffle turnir.');
                    } else if (existing.status === 'assigned') {
                        setError('Već ste raspoređeni u tim.');
                    }
                    setSubmitting(false);
                    return;
                }
            }

            // Insert new player
            const { error: insertError } = await supabase
                .from('shuffle_players')
                .insert([{
                    steam_id: steamId,
                    steam_account_id: playerData.accountId,
                    persona_name: playerData.personaName,
                    avatar: playerData.avatar,
                    rank_tier: playerData.rankTier,
                    winrate: parseFloat(playerData.winrate) || null,
                    preferred_positions: selectedPositions,
                    discord_id: discordId || null,
                    status: 'pending'
                }]);

            if (insertError) {
                throw insertError;
            }

            setSubmitted(true);
        } catch (err) {
            setError('Greška pri prijavi: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="container" style={{ padding: '6rem 0 4rem 0', textAlign: 'center' }}>
                <SEOHead title="Prijava Uspešna" description="Uspešno ste se prijavili za shuffle turnir." />
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h1 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Prijava Uspešna!</h1>
                    <p style={{ color: '#888', marginBottom: '2rem' }}>
                        Vaša prijava je primljena i čeka odobrenje admina.
                        Kada budete odobreni, dobićete obaveštenje na Discord kanalu.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-primary"
                        style={{ padding: '1rem 2rem' }}
                    >
                        Nazad na početnu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '6rem 0 4rem 0' }}>
            <SEOHead
                title="Prijava za Shuffle Turnir"
                description="Prijavite se za shuffle turnir gde ćete biti upareni sa drugim igračima u balansirani tim."
            />

            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <h1 style={{
                    textAlign: 'center',
                    marginBottom: '0.5rem',
                    background: 'linear-gradient(135deg, var(--accent) 0%, #ffa500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    🎲 Shuffle Turnir
                </h1>
                <p style={{ textAlign: 'center', color: '#888', marginBottom: '2rem' }}>
                    Prijavite se i mi ćemo vas upariti sa drugim igračima u balansirani tim!
                </p>

                {/* Confirmed Teams Section */}
                {confirmedTeams && confirmedTeams.length > 0 && (
                    <div className="card" style={{
                        marginBottom: '2rem',
                        background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(0,0,0,0) 100%)',
                        border: '2px solid #4caf50'
                    }}>
                        <h3 style={{ color: '#4caf50', marginBottom: '1.5rem', textAlign: 'center' }}>
                            🎮 FORMIRANI TIMOVI
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {confirmedTeams.map(team => (
                                <div key={team.id} style={{
                                    padding: '1rem',
                                    background: '#1a1a1a',
                                    borderRadius: '8px',
                                    border: '1px solid #333'
                                }}>
                                    <div style={{
                                        textAlign: 'center',
                                        marginBottom: '1rem',
                                        padding: '0.5rem',
                                        background: '#222',
                                        borderRadius: '4px'
                                    }}>
                                        <strong style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>{team.name}</strong>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {[1, 2, 3, 4, 5].map(pos => {
                                            const player = team.positions[pos];
                                            const posInfo = positions.find(p => p.id === pos);
                                            return (
                                                <div key={pos} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.4rem 0.6rem',
                                                    background: '#222',
                                                    borderRadius: '4px'
                                                }}>
                                                    <img src={posInfo?.icon} style={{ width: '18px', height: '18px' }} />
                                                    {player ? (
                                                        <>
                                                            <img src={player.avatar} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                                            <span style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                                                {player.persona_name}
                                                                <BlueTrophy trophies={trophiesMap[player.steam_id || player.steam_account_id]} />
                                                            </span>
                                                            <RankDisplay rankTier={player.rank_tier} width="18px" />
                                                        </>
                                                    ) : (
                                                        <span style={{ color: '#666' }}>Prazno</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Overview Section */}
                <div className="card" style={{
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, rgba(255,165,0,0.1) 0%, rgba(0,0,0,0) 100%)',
                    border: '1px solid #ffa50040'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#ffa500', margin: 0 }}>👥 Prijavljeni igrači</h3>
                        <div style={{
                            background: approvedPlayers.length >= 10 ? '#4caf50' : '#ffa500',
                            padding: '0.3rem 1rem',
                            borderRadius: '20px',
                            fontWeight: 'bold'
                        }}>
                            {approvedPlayers.length}/10 minimum
                        </div>
                    </div>

                    {loadingPlayers ? (
                        <p style={{ color: '#888' }}>⏳ Učitavanje...</p>
                    ) : approvedPlayers.length === 0 ? (
                        <p style={{ color: '#888' }}>Nema još prijavljenih igrača. Budi prvi! 🚀</p>
                    ) : (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1rem'
                            }}>
                                {approvedPlayers.map(p => (
                                    <div key={p.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.8rem',
                                        padding: '0.8rem',
                                        background: '#1a1a1a',
                                        borderRadius: '8px',
                                        border: '1px solid #333'
                                    }}>
                                        <img src={p.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center' }}>
                                                {p.persona_name}
                                                <BlueTrophy trophies={trophiesMap[p.steam_id]} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                                <RankDisplay rankTier={p.rank_tier} width="22px" />
                                                <span style={{ color: '#888', fontSize: '0.8rem' }}>
                                                    WR: {p.winrate ? `${p.winrate}%` : 'N/A'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                <span style={{ color: '#888', fontSize: '0.75rem' }}>Preferirane role:</span>
                                                {p.preferred_positions?.map(posId => {
                                                    const pos = positions.find(x => x.id === posId);
                                                    return pos ? (
                                                        <div key={posId} title={pos.name} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.2rem',
                                                            padding: '0.2rem 0.4rem',
                                                            background: '#333',
                                                            borderRadius: '4px',
                                                            fontSize: '0.7rem'
                                                        }}>
                                                            <img src={pos.icon} style={{ width: '14px', height: '14px' }} />
                                                            <span style={{ color: '#ccc' }}>{posId}</span>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                        <a
                                            href={`https://steamcommunity.com/profiles/${BigInt(p.steam_account_id) + BigInt('76561197960265728')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '0.5rem',
                                                background: '#1b2838',
                                                borderRadius: '6px',
                                                transition: 'all 0.2s',
                                                textDecoration: 'none',
                                                minWidth: '70px'
                                            }}
                                            title="Otvori Steam profil"
                                            onMouseEnter={e => e.currentTarget.style.background = '#2a475e'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#1b2838'}
                                        >
                                            <svg viewBox="0 0 256 259" width="20" height="20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                                                <path d="M 127.778656,0 C 60.4203791,0 5.24816518,52.0552043 0,118.903983 l 68.6584023,28.3997 c 5.8208997,-3.97584 12.8435507,-6.30366 20.4243987,-6.30366 0.6834,0 1.3606,0.0228 2.0316,0.0658 L 121.968799,99.3966003 c 0,-0.35378 0.01,-0.70538 0.01,-1.05698 0,-33.0815997 26.91832,-59.9833977 59.98988,-59.9833977 33.09412,0 59.99636,26.901798 59.99636,59.9833977 0,33.0879997 -26.90224,59.9961997 -59.99636,59.9961997 -0.7862,0 -1.56268,-0.0285 -2.33048,-0.0696 L 138.73336,189.25584 c 0.0314,0.5748 0.0486,1.15402 0.0486,1.7389 0,25.00984 -20.35104,45.34396 -45.36664,45.34396 -21.6652803,0 -39.7597203,-15.24456 -44.1591203,-35.55934 L 2.47594004,182.09826 C 19.0809139,226.40488 62.2104019,258.339 113.26824,258.339 c 70.89652,0 128.39508,-57.49466 128.39508,-128.39142 C 241.66332,58.501 184.67476,0 127.778656,0" fill="#fff" />
                                            </svg>
                                            <span style={{ fontSize: '0.6rem', color: '#ccc', marginTop: '0.2rem', textAlign: 'center' }}>
                                                Steam profil
                                            </span>
                                        </a>
                                    </div>
                                ))}
                            </div>
                            {approvedPlayers.length < 10 && (
                                <div style={{
                                    padding: '0.8rem',
                                    background: 'rgba(255,165,0,0.15)',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    ⚠️ Potrebno još <strong>{10 - approvedPlayers.length}</strong> igrača za start shuffle turnira!
                                </div>
                            )}
                            {approvedPlayers.length >= 10 && (
                                <div style={{
                                    padding: '0.8rem',
                                    background: 'rgba(76,175,80,0.15)',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    color: '#4caf50'
                                }}>
                                    ✅ Ima dovoljno igrača! Turnir može uskoro početi.
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Step 1: OpenDota ID Input */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>
                        1. Unesite vaš OpenDota ID
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            value={steamId}
                            onChange={(e) => setSteamId(e.target.value)}
                            placeholder="OpenDota ID (npr. 99892653)"
                            style={{
                                flex: 1,
                                padding: '0.8rem 1rem',
                                background: '#222',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleCheckPlayer()}
                        />
                        <button
                            onClick={handleCheckPlayer}
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ padding: '0.8rem 1.5rem' }}
                        >
                            {loading ? '⏳ Proveravam...' : '🔍 Proveri'}
                        </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                        Ponađite vaš ID na <a href="https://www.opendota.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>opendota.com</a> u URL-u vašeg profila (npr. opendota.com/players/<strong>99892653</strong>)
                    </p>

                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                        <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }}>
                            Discord ID (Opciono - za voice kanale)
                        </h4>
                        <input
                            type="text"
                            value={discordId}
                            onChange={(e) => setDiscordId(e.target.value)}
                            placeholder="Vaš 18-cifreni Discord ID"
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                background: '#222',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '1rem'
                            }}
                        />
                        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                            Desni klik na tvoje ime u Discordu {" > "} <strong>Copy User ID</strong>.
                            (Ako nema ove opcije, uključi <em>Developer Mode</em> u Discord Settings {" > "} Advanced)
                        </p>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div style={{
                        background: 'rgba(244, 67, 54, 0.1)',
                        border: '1px solid #f44336',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        color: '#f44336'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Step 2: Player Info Display */}
                {playerData && (
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>
                            2. Vaš profil
                        </h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: '#1a1a1a',
                            borderRadius: '8px'
                        }}>
                            <img
                                src={playerData.avatar}
                                alt={playerData.personaName}
                                style={{ width: '64px', height: '64px', borderRadius: '50%' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {playerData.personaName}
                                    <BlueTrophy trophies={existingTrophies} />
                                </div>
                                {existingTrophies && (
                                    <div style={{
                                        fontSize: '0.9rem',
                                        color: '#2196f3',
                                        fontWeight: 'bold',
                                        marginTop: '4px',
                                        background: 'rgba(33, 150, 243, 0.1)',
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        display: 'inline-block'
                                    }}>
                                        🏆 Dobrodošli nazad, šampione!
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                    <RankDisplay rankTier={playerData.rankTier} width="40px" />
                                    <span style={{ color: '#888' }}>
                                        Winrate: {playerData.winrate}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Top Heroes */}
                        {playerData.topHeroes && playerData.topHeroes.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem' }}>Top Heroji:</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {playerData.topHeroes.slice(0, 5).map((hero, idx) => (
                                        <HeroImage key={idx} heroId={hero.heroId} size="40px" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Position Selection */}
                {playerData && (
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>
                            3. Izaberite pozicije koje možete igrati
                        </h3>
                        <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Označite sve pozicije na kojima biste mogli igrati.
                            Što više pozicija označite, veća je šansa za brzo pronalaženje tima!
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '0.8rem'
                        }}>
                            {positions.map(pos => (
                                <div
                                    key={pos.id}
                                    onClick={() => togglePosition(pos.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.8rem',
                                        padding: '1rem',
                                        background: selectedPositions.includes(pos.id)
                                            ? 'rgba(76, 175, 80, 0.2)'
                                            : '#222',
                                        border: selectedPositions.includes(pos.id)
                                            ? '2px solid #4caf50'
                                            : '2px solid #444',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <img
                                        src={pos.icon}
                                        alt={pos.name}
                                        style={{ width: '28px', height: '28px' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{pos.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Pozicija {pos.id}</div>
                                    </div>
                                    {selectedPositions.includes(pos.id) && (
                                        <span style={{ marginLeft: 'auto', color: '#4caf50', fontSize: '1.2rem' }}>✓</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        {selectedPositions.length > 0 && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.5rem 1rem',
                                background: 'rgba(76, 175, 80, 0.1)',
                                borderRadius: '4px',
                                fontSize: '0.9rem'
                            }}>
                                Izabrane pozicije: <strong>{selectedPositions.map(p => positions.find(pos => pos.id === p)?.name).join(', ')}</strong>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                {playerData && (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || selectedPositions.length === 0}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '1.2rem',
                            fontSize: '1.2rem',
                            background: selectedPositions.length === 0 ? '#444' : undefined,
                            cursor: selectedPositions.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {submitting ? '⏳ Prijavljujem...' : '🎯 Prijavi se za Shuffle Turnir'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ShuffleRegistration;
