import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { fetchPlayerData } from '../services/dotaApi';
import RankDisplay from '../components/ui/RankDisplay';
import ImageUpload from '../components/ui/ImageUpload';
import emailjs from '@emailjs/browser';

const Registration = () => {
    // ... imports

    // ... (rest of code)

    const navigate = useNavigate();
    const { registerTeam } = useTournament();

    const [step, setStep] = useState(1);
    const [teamName, setTeamName] = useState('');
    const [teamLogo, setTeamLogo] = useState('');

    // 5 Players slots
    const [players, setPlayers] = useState([
        { id: 1, steamId: '', data: null, loading: false, error: null, isCaptain: true },
        { id: 2, steamId: '', data: null, loading: false, error: null, isCaptain: false },
        { id: 3, steamId: '', data: null, loading: false, error: null, isCaptain: false },
        { id: 4, steamId: '', data: null, loading: false, error: null, isCaptain: false },
        { id: 5, steamId: '', data: null, loading: false, error: null, isCaptain: false },
    ]);

    const handleCheckPlayer = async (index) => {
        const player = players[index];
        if (!player.steamId) return;

        const newPlayers = [...players];
        newPlayers[index].loading = true;
        newPlayers[index].error = null;
        setPlayers(newPlayers);

        const result = await fetchPlayerData(player.steamId);

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
                isCaptain: p.isCaptain
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
                                    {/* Debug/Preview Top Heroes */}
                                    <div style={{ marginLeft: '1rem', fontSize: '0.7rem', color: '#888' }}>
                                        Best: {player.data.topHeroes?.map(h => h.heroId).join(', ') || 'None'}
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
