import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';

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

    const handleSave = () => {
        if (!parsedData) return;

        // Inject mapped IDs
        const finalPlayers = parsedData.players.map(p => {
            const registeredId = playerMapping[p.steamId || p.name];
            return {
                ...p,
                tournamentPlayerId: registeredId || null
            };
        });

        const finalMatch = {
            ...parsedData,
            radiantTeamId,
            direTeamId,
            players: finalPlayers
        };

        dispatch({ type: 'ADD_MATCH', payload: finalMatch });
        navigate('/results'); // Go to results to see it
    };

    // Helper to get players of selected team
    const getTeamPlayers = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team ? team.players : [];
    };

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
                                        {getTeamPlayers(radiantTeamId).map(tp => (
                                            <option key={tp.id} value={tp.id}>{tp.nickname} ({tp.role})</option>
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
                                        {getTeamPlayers(direTeamId).map(tp => (
                                            <option key={tp.id} value={tp.id}>{tp.nickname} ({tp.role})</option>
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
