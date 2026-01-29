import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { sendDiscordWebhook, formatMatchResultEmbed } from '../services/discordService';

const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_RESULTS || import.meta.env.VITE_DISCORD_WEBHOOK_URL;

const TestAdminUpload = () => {
    const [stage, setStage] = useState('json');
    const [jsonInput, setJsonInput] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState(null);

    const { dispatch, teams, activeTournament, linkMatchToTournament, processMatchStats } = useTournament();
    const navigate = useNavigate();

    const [radiantTeamId, setRadiantTeamId] = useState('');
    const [direTeamId, setDireTeamId] = useState('');
    const [playerMapping, setPlayerMapping] = useState({});
    const [bracketMatchId, setBracketMatchId] = useState('');

    const handleParse = () => {
        try {
            const data = JSON.parse(jsonInput);
            if (!data.matchId || !data.players) throw new Error("Invalid format. Missing matchId or players.");
            setParsedData(data);
            setStage('mapping');
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSave = async () => {
        if (!parsedData) return;

        const finalPlayers = parsedData.players.map(p => ({
            ...p,
            tournamentPlayerId: playerMapping[p.steamId || p.name] || null
        }));

        const finalMatch = {
            ...parsedData,
            radiantTeamId,
            direTeamId,
            players: finalPlayers,
            isTestVersion: true // Mark as test for the UI to know
        };

        if (bracketMatchId && activeTournament) {
            await processMatchStats(finalMatch, true);
            await linkMatchToTournament(activeTournament.id, bracketMatchId, finalMatch);
        } else {
            await processMatchStats(finalMatch, false);
        }

        // Discord Notification
        if (DISCORD_WEBHOOK_URL) {
            const team1Name = teams.find(t => t.id === radiantTeamId)?.name || 'Radiant';
            const team2Name = teams.find(t => t.id === direTeamId)?.name || 'Dire';
            const winnerName = finalMatch.winner === 'Radiant' ? team1Name : team2Name;

            const embed = formatMatchResultEmbed({
                ...finalMatch,
                team1Score: finalMatch.radiantScore || 0,
                team2Score: finalMatch.direScore || 0
            }, team1Name, team2Name, winnerName, `${window.location.origin}/test-match/${finalMatch.matchId}`);

            sendDiscordWebhook(DISCORD_WEBHOOK_URL, `🧪 **TEST MEČ DODAT (ODOTA FORMAT)**`, embed);
        }

        navigate('/results');
    };

    const getTeamPlayers = (teamId) => teams.find(t => t.id === teamId)?.players || [];
    const availableBracketMatches = activeTournament ? activeTournament.bracket_data.filter(m => !m.winner) : [];

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '1000px' }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center', color: '#00d2ff' }}>
                Test Admin Upload (Odota Format)
            </h1>

            {error && <div className="alert alert-danger">{error}</div>}

            {stage === 'json' ? (
                <div className="card">
                    <p style={{ color: '#aaa', marginBottom: '1rem' }}>Paste the output from <code>OdotaParser.java</code> here.</p>
                    <textarea
                        value={jsonInput}
                        onChange={e => setJsonInput(e.target.value)}
                        style={{ width: '100%', height: '400px', background: '#0a0a0a', color: '#00d2ff', border: '1px solid #1a1a1a', padding: '1rem', fontFamily: 'monospace' }}
                    />
                    <button onClick={handleParse} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Next: Map Players</button>
                </div>
            ) : (
                <div className="card">
                    {activeTournament && (
                        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #00d2ff', background: 'rgba(0, 210, 255, 0.05)' }}>
                            <h3 style={{ color: '#00d2ff' }}>Link to Bracket (Testing)</h3>
                            <select
                                value={bracketMatchId}
                                onChange={e => {
                                    setBracketMatchId(e.target.value);
                                    const match = availableBracketMatches.find(m => m.matchId.toString() === e.target.value);
                                    if (match) {
                                        setRadiantTeamId(match.team1?.id || '');
                                        setDireTeamId(match.team2?.id || '');
                                    }
                                }}
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                            >
                                <option value="">-- No Bracket Link --</option>
                                {availableBracketMatches.map(m => (
                                    <option key={m.matchId} value={m.matchId}>{m.team1?.name} vs {m.team2?.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ color: '#4caf50' }}>Radiant Team</h3>
                            <select value={radiantTeamId} onChange={e => setRadiantTeamId(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
                                <option value="">Select Team...</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ color: '#f44336' }}>Dire Team</h3>
                            <select value={direTeamId} onChange={e => setDireTeamId(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
                                <option value="">Select Team...</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h4>Radiant Mapping</h4>
                            {parsedData.players.filter(p => p.team === 'Radiant').map((p, idx) => (
                                <div key={idx} style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(76, 175, 80, 0.1)' }}>
                                    <div>{p.name} ({p.heroName})</div>
                                    <select
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                        onChange={(e) => setPlayerMapping({ ...playerMapping, [p.steamId || p.name]: e.target.value })}
                                    >
                                        <option value="">-- Registered Player --</option>
                                        {getTeamPlayers(radiantTeamId).map(tp => (
                                            <option key={tp.steamId} value={tp.steamId}>{tp.personaName || tp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4>Dire Mapping</h4>
                            {parsedData.players.filter(p => p.team === 'Dire').map((p, idx) => (
                                <div key={idx} style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(244, 67, 54, 0.1)' }}>
                                    <div>{p.name} ({p.heroName})</div>
                                    <select
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                        onChange={(e) => setPlayerMapping({ ...playerMapping, [p.steamId || p.name]: e.target.value })}
                                    >
                                        <option value="">-- Registered Player --</option>
                                        {getTeamPlayers(direTeamId).map(tp => (
                                            <option key={tp.steamId} value={tp.steamId}>{tp.personaName || tp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: '2rem', width: '100%', padding: '1rem' }}>
                        SAVE TEST MATCH
                    </button>
                </div>
            )}
        </div>
    );
};

export default TestAdminUpload;
