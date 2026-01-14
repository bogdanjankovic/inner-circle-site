import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { fetchPlayerData, POSITION_NAMES } from '../services/dotaApi';
import RankDisplay from '../components/ui/RankDisplay';
import ImageUpload from '../components/ui/ImageUpload';
import { HeroImage } from '../components/ui/HeroTooltip';
import emailjs from '@emailjs/browser';

const Registration = () => {
    // ... imports

    // ... (rest of code)

    const navigate = useNavigate();
    const { registerTeam } = useTournament();

    const [step, setStep] = useState(1);
    const [teamName, setTeamName] = useState('');
    const [teamLogo, setTeamLogo] = useState('');

    // Position data with icons
    const positions = [
        { id: 1, name: POSITION_NAMES[1], icon: 'https://i.imgur.com/rL1ZwZ4.png' },
        { id: 2, name: POSITION_NAMES[2], icon: 'https://i.imgur.com/7oAbbDo.png' },
        { id: 3, name: POSITION_NAMES[3], icon: 'https://i.imgur.com/ThXJQ0n.png' },
        { id: 4, name: POSITION_NAMES[4], icon: 'https://i.imgur.com/NkAmIjB.png' },
        { id: 5, name: POSITION_NAMES[5], icon: 'https://i.imgur.com/TGv7onk.png' }
    ];

    // 5 Players slots
    const [players, setPlayers] = useState([
        { id: 1, steamId: '', data: null, loading: false, error: null, isCaptain: true, position: 1 },
        { id: 2, steamId: '', data: null, loading: false, error: null, isCaptain: false, position: 2 },
        { id: 3, steamId: '', data: null, loading: false, error: null, isCaptain: false, position: 3 },
        { id: 4, steamId: '', data: null, loading: false, error: null, isCaptain: false, position: 4 },
        { id: 5, steamId: '', data: null, loading: false, error: null, isCaptain: false, position: 5 },
    ]);

    const handleCheckPlayer = async (index) => {
        const player = players[index];
        if (!player.steamId) return;

        const newPlayers = [...players];
        newPlayers[index].loading = true;
        newPlayers[index].error = null;
        setPlayers(newPlayers);

        const result = await fetchPlayerData(player.steamId, player.position);

        const updatedPlayers = [...players];
        updatedPlayers[index].loading = false;

        if (result.valid) {
            updatedPlayers[index].data = result;
        } else {
            updatedPlayers[index].error = "Igrač nije pronađen ili je profil privatan.";
        }
        setPlayers(updatedPlayers);
    };

    const handleSteamIdChange = (index, value) => {
        const newPlayers = [...players];
        newPlayers[index].steamId = value;
        // Reset data if they change ID
        if (newPlayers[index].data) {
            newPlayers[index].data = null;
        }
        setPlayers(newPlayers);
    };

    const handlePositionChange = async (index, positionId) => {
        const newPlayers = [...players];
        newPlayers[index].position = parseInt(positionId);
        setPlayers(newPlayers);

        // If player data exists, refetch to get position-specific heroes
        const player = newPlayers[index];
        if (player.steamId && player.data) {
            newPlayers[index].loading = true;
            setPlayers(newPlayers);

            try {
                const result = await fetchPlayerData(player.steamId, parseInt(positionId));
                const updatedPlayers = [...newPlayers];
                updatedPlayers[index].loading = false;
                
                if (result.valid) {
                    updatedPlayers[index].data = result;
                }
                setPlayers(updatedPlayers);
            } catch (error) {
                const updatedPlayers = [...newPlayers];
                updatedPlayers[index].loading = false;
                setPlayers(updatedPlayers);
            }
        }
    };

    const setCaptain = (index) => {
        const newPlayers = players.map((p, i) => ({ ...p, isCaptain: i === index }));
        setPlayers(newPlayers);
    };

    const handleSubmit = () => {
        // Validation
        if (!teamName) return alert("Unesite ime tima!");
        const validPlayers = players.filter(p => p.data);
        if (validPlayers.length < 5) return alert("Morate uneti 5 validnih igrača!");

        const teamData = {
            name: teamName,
            logo: teamLogo,
            captainId: players.find(p => p.isCaptain)?.data?.accountId,
            players: players.map(p => ({
                steamId: p.steamId,
                ...p.data,
                isCaptain: p.isCaptain,
                position: p.position
            }))
        };

        const captainName = teamData.players.find(p => p.isCaptain)?.personaName || 'Unknown';

        // Register in Supabase (Context)
        registerTeam(teamData);

        // Email Notification
        emailjs.send(
            'service_raks9ru',
            'template_hiqp7a7',
            {
                team_name: teamName,
                captain_name: captainName,
            },
            'LkypNxLC7y1iwLqa1'
        ).then(
            () => {
                console.log('Admin notified via email.');
            },
            (error) => {
                console.error('Email notification failed:', error);
            }
        );

        alert('Tim je uspešno registrovan! Vaš tim čeka odobrenje administratora pre nego što postane vidljiv.');
        navigate('/teams');
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--accent)' }}>Prijava Tima</h1>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Ime Tima</label>
                    <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="npr. Team Secret"
                        style={{ fontSize: '1.2rem' }}
                    />
                </div>

                <div style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Logo Tima (Opciono)</label>
                        <ImageUpload
                            onImageSelect={(base64) => setTeamLogo(base64)}
                            initialImage={teamLogo}
                            size="120px"
                            placeholder="Logo"
                        />
                    </div>
                </div>

                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    Sastav Tima (Igrači)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {players.map((player, index) => (
                        <div key={player.id} style={{
                            padding: '1rem',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            border: player.isCaptain ? '1px solid var(--accent)' : '1px solid transparent'
                        }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: 'bold', width: '30px' }}>#{index + 1}</span>
                                <input
                                    type="text"
                                    placeholder="SteamID / Prijateljski kod"
                                    value={player.steamId}
                                    onChange={(e) => handleSteamIdChange(index, e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    className="btn"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                    onClick={() => handleCheckPlayer(index)}
                                    disabled={player.loading}
                                >
                                    {player.loading ? '...' : 'Proveri'}
                                </button>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="captain"
                                        checked={player.isCaptain}
                                        onChange={() => setCaptain(index)}
                                    /> Kapiten
                                </label>
                            </div>

                            {player.error && (
                                <div style={{ color: '#ff4444', fontSize: '0.9rem' }}>{player.error}</div>
                            )}

                            {player.data && (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--bg-main)', padding: '0.5rem', borderRadius: '4px' }}>
                                    <ImageUpload
                                        onImageSelect={(b64) => {
                                            const newP = [...players];
                                            if (newP[index].data) newP[index].data.avatar = b64;
                                            setPlayers(newP);
                                        }}
                                        initialImage={player.data.avatar}
                                        size="48px"
                                        round={true}
                                        placeholder="Foto"
                                    />
                                    <div style={{ marginRight: 'auto' }}>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{player.data.personaName}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            WR: {player.data.winrate}%
                                        </div>
                                    </div>

                                    {/* Position Selector */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                        <label style={{ fontSize: '0.7rem', color: '#888' }}>
                                            Pozicija {player.position && player.data && '(🔄 osveženo)'}
                                        </label>
                                        <select
                                            value={player.position}
                                            onChange={(e) => handlePositionChange(index, e.target.value)}
                                            disabled={player.loading}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border)',
                                                background: player.loading ? '#555' : 'var(--bg-secondary)',
                                                color: 'var(--text-main)',
                                                fontSize: '0.8rem',
                                                opacity: player.loading ? 0.6 : 1
                                            }}
                                        >
                                            {positions.map(pos => (
                                                <option key={pos.id} value={pos.id}>
                                                    {pos.name} [{pos.id}]
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Rank Medal */}
                                    <RankDisplay
                                        rankTier={player.data.rankTier}
                                        leaderboardRank={player.data.leaderboardRank}
                                        width="48px"
                                    />

                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#ccc', marginLeft: '1rem' }}>
                                        <div>GPM: {player.data.stats.gpm}</div>
                                        <div>XPM: {player.data.stats.xpm}</div>
                                    </div>
                                    {/* Top Heroes by Position */}
                                    <div style={{ marginLeft: '1rem', fontSize: '0.7rem', color: '#888' }}>
                                        {player.position ? (
                                            <div>
                                                <div style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>
                                                    Top {positions.find(p => p.id === player.position)?.name} Heroes:
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {player.data.topHeroes?.map((h, i) => (
                                                        <div key={i} style={{ textAlign: 'center' }}>
                                                            <HeroImage heroId={h.heroId} style={{ width: '24px', height: '24px' }} />
                                                            <div style={{ fontSize: '0.6rem' }}>{h.games}g</div>
                                                            <div style={{ fontSize: '0.6rem', color: h.winrate >= 55 ? '#4caf50' : h.winrate >= 50 ? '#ff9800' : '#f44336' }}>
                                                                {h.winrate}%
                                                            </div>
                                                        </div>
                                                    )) || <span>None</span>}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ marginBottom: '0.25rem', fontWeight: 'bold' }}>
                                                    Top Heroes (All Time):
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {player.data.topHeroes?.map((h, i) => (
                                                        <div key={i} style={{ textAlign: 'center' }}>
                                                            <HeroImage heroId={h.heroId} style={{ width: '24px', height: '24px' }} />
                                                            <div style={{ fontSize: '0.6rem' }}>{h.games}g</div>
                                                            <div style={{ fontSize: '0.6rem', color: h.winrate >= 55 ? '#4caf50' : h.winrate >= 50 ? '#ff9800' : '#f44336' }}>
                                                                {h.winrate}%
                                                            </div>
                                                        </div>
                                                    )) || <span>None</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <button className="btn" style={{ width: '100%', fontSize: '1.2rem' }} onClick={handleSubmit}>
                        Registruj Tim
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                        *Podaci se automatski povlače sa OpenDota API. Proverite da li su profili igrača javni (Public Match Data Exposed).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Registration;
