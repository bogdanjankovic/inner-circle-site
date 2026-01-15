
import { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { HeroImage } from '../components/ui/HeroTooltip';
import RankDisplay from '../components/ui/RankDisplay';

import ImageUpload from '../components/ui/ImageUpload';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

import { fetchPlayerData, forceRefreshTeamPlayers } from '../services/dotaApi';
import { sendDiscordWebhook, formatMatchResultEmbed, formatTournamentWinEmbed } from '../services/discordService';
import { getApprovedShufflePlayers, getPendingShufflePlayers, approveShufflePlayer, rejectShufflePlayer, generateBalancedTeams, confirmShuffleTeams, getConfirmedShuffleTeams, registerShuffleTeam, resetShuffleState } from '../services/shuffleService';

const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
const DISCORD_WEBHOOK_TOURNAMENTS = import.meta.env.VITE_DISCORD_WEBHOOK_TOURNAMENTS || DISCORD_WEBHOOK_URL;
const DISCORD_WEBHOOK_SCHEDULE = import.meta.env.VITE_DISCORD_WEBHOOK_SCHEDULE || DISCORD_WEBHOOK_URL;
const DISCORD_WEBHOOK_RESULTS = import.meta.env.VITE_DISCORD_WEBHOOK_RESULTS || DISCORD_WEBHOOK_URL;

// Position data
const positions = [
    { id: 1, name: 'Carry', icon: 'https://i.imgur.com/rL1ZwZ4.png' },
    { id: 2, name: 'Midlane', icon: 'https://i.imgur.com/7oAbbDo.png' },
    { id: 3, name: 'Offlaner', icon: 'https://i.imgur.com/ThXJQ0n.png' },
    { id: 4, name: 'Soft Support', icon: 'https://i.imgur.com/NkAmIjB.png' },
    { id: 5, name: 'Hard Support', icon: 'https://i.imgur.com/TGv7onk.png' }
];

const EditTeamModal = ({ team, onClose, onSave }) => {
    const [name, setName] = useState(team.name);
    const [logo, setLogo] = useState(team.logo);
    const [players, setPlayers] = useState(JSON.parse(JSON.stringify(team.players)));

    const handlePlayerChange = async (idx, field, value) => {
        const newPlayers = [...players];
        if (field === 'personaName') newPlayers[idx].personaName = value;
        if (field === 'position') newPlayers[idx].position = parseInt(value);
        if (field === 'discord_id') newPlayers[idx].discord_id = value;
        setPlayers(newPlayers);

        // If position changed and player has steamId, refetch heroes
        if (field === 'position' && newPlayers[idx].steamId) {
            try {
                const result = await fetchPlayerData(newPlayers[idx].steamId, parseInt(value));
                if (result.valid) {
                    const updatedPlayers = [...newPlayers];
                    updatedPlayers[idx].topHeroes = result.topHeroes;
                    setPlayers(updatedPlayers);
                }
            } catch (error) {
                console.error('Failed to fetch position-specific heroes:', error);
            }
        }
    };

    const handleRemovePlayer = (idx) => {
        if (confirm("Remove this player?")) {
            setPlayers(players.filter((_, i) => i !== idx));
        }
    };

    const handleSave = () => {
        onSave({ ...team, name, logo, players });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <button className="close-modal" onClick={onClose}>&times;</button>
                <h2>Edit Team</h2>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Team Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Logo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={logo} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                        <ImageUpload onImageSelect={setLogo} size="50px" placeholder="Change" />
                    </div>
                </div>

                <h3>Roster</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    {players.map((p, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', background: '#222', padding: '0.5rem' }}>
                            <img src={p.avatar} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                            <input
                                value={p.personaName}
                                onChange={(e) => handlePlayerChange(i, 'personaName', e.target.value)}
                                style={{ flex: 1, padding: '0.2rem' }}
                            />
                            <input
                                placeholder="Discord ID"
                                value={p.discord_id || ''}
                                onChange={(e) => handlePlayerChange(i, 'discord_id', e.target.value)}
                                style={{ width: '150px', padding: '0.2rem' }}
                            />
                            <select
                                value={p.position || ''}
                                onChange={(e) => handlePlayerChange(i, 'position', e.target.value)}
                                style={{
                                    padding: '0.2rem',
                                    background: '#333',
                                    color: 'white',
                                    border: '1px solid #555',
                                    minWidth: '120px'
                                }}
                            >
                                <option value="">Pozicija</option>
                                {positions.map(pos => (
                                    <option key={pos.id} value={pos.id}>
                                        {pos.name} [{pos.id}]
                                    </option>
                                ))}
                            </select>
                            <button onClick={() => handleRemovePlayer(i)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>X</button>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} className="btn" style={{ background: '#666' }}>Cancel</button>
                    <button onClick={handleSave} className="btn" style={{ background: '#4caf50' }}>Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const EditMatchModal = ({ match, onClose, onSave, teams }) => {
    const [winner, setWinner] = useState(match.winner || 'Radiant');
    const [radiantTeamId, setRadiantTeamId] = useState(match.radiantTeamId || match.radiant_team_id || '');
    const [direTeamId, setDireTeamId] = useState(match.direTeamId || match.dire_team_id || '');

    const handleSave = () => {
        onSave({
            ...match,
            winner,
            radiantTeamId: radiantTeamId || null,
            direTeamId: direTeamId || null,
            radiant_team_id: radiantTeamId || null,
            dire_team_id: direTeamId || null
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <button className="close-modal" onClick={onClose}>&times;</button>
                <h2>Edit Match Details</h2>

                <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>

                    {/* Radiant Team */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.3rem', color: '#4caf50' }}>Radiant Team</label>
                        <select
                            value={radiantTeamId}
                            onChange={(e) => setRadiantTeamId(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#333', color: 'white', border: '1px solid #555' }}
                        >
                            <option value="">-- No Team Linked --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    {/* Dire Team */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.3rem', color: '#f44336' }}>Dire Team</label>
                        <select
                            value={direTeamId}
                            onChange={(e) => setDireTeamId(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#333', color: 'white', border: '1px solid #555' }}
                        >
                            <option value="">-- No Team Linked --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    {/* Winner */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.3rem' }}>Winner</label>
                        <select
                            value={winner}
                            onChange={(e) => setWinner(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', background: '#333', color: 'white', border: '1px solid #555' }}
                        >
                            <option value="Radiant">Radiant Faction</option>
                            <option value="Dire">Dire Faction</option>
                            {radiantTeamId && <option value={radiantTeamId}>Radiant Team (ID: {radiantTeamId})</option>}
                            {direTeamId && <option value={direTeamId}>Dire Team (ID: {direTeamId})</option>}
                        </select>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>Note: Selecting Faction is safer unless specific logic requires ID.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} className="btn" style={{ background: '#666' }}>Cancel</button>
                    <button onClick={handleSave} className="btn" style={{ background: '#4caf50' }}>Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// Sub-component for clean management
const ManageTournament = ({ tournament, teams, onMatchUpdate }) => {
    const { finishTournament, matchHistory, processMatchStats, linkMatchToTournament } = useTournament();
    const [winnerId, setWinnerId] = useState('');
    const [sendToDiscord, setSendToDiscord] = useState(true);

    // Find unique teams in this tournament
    const participantIds = new Set();
    if (tournament.bracket_data) {
        tournament.bracket_data.forEach(m => {
            if (m.team1) {
                // Handle both object and ID ref just in case
                participantIds.add(typeof m.team1 === 'object' ? m.team1.id : m.team1);
            }
            if (m.team2) {
                participantIds.add(typeof m.team2 === 'object' ? m.team2.id : m.team2);
            }
        });
    }
    const participants = teams.filter(t => participantIds.has(t.id));

    // Helper to update score
    const updateScore = (m, teamKey) => {
        const newBracket = [...tournament.bracket_data];
        const matchIdx = newBracket.findIndex(x => x.matchId === m.matchId);
        if (matchIdx !== -1) {
            const currentMatch = newBracket[matchIdx];
            const currentScore = currentMatch[`${teamKey}Score`] || 0;
            const newScore = currentScore + 1;
            currentMatch[`${teamKey}Score`] = newScore;

            // Auto-Check Win Condition
            const format = m.format || 'bo1';
            const winsNeeded = format === 'bo3' ? 2 : (format === 'bo5' ? 3 : 1);

            if (newScore >= winsNeeded) {
                const teamName = m[teamKey].name;
                if (confirm(`${teamName} has reached ${newScore} wins. End Series and advance info next round?`)) {
                    currentMatch.winner = m[teamKey].id;

                    // DISCORD NOTIFICATION
                    if (sendToDiscord && DISCORD_WEBHOOK_URL) {
                        const winner = teams.find(t => t.id === currentMatch.winner)?.name || 'Unknown Team';
                        const loser = teams.find(t => t.id === (currentMatch.winner === m.team1.id ? m.team2.id : m.team1.id))?.name || 'Unknown Team';

                        const embed = formatMatchResultEmbed({
                            ...currentMatch,
                            team1Score: currentMatch.team1Score,
                            team2Score: currentMatch.team2Score
                        }, m.team1.name, m.team2.name, winner);

                        sendDiscordWebhook(DISCORD_WEBHOOK_URL, `🏁 **REZULTAT MEČA**`, embed);
                    }

                    // Advance helper
                    const nextMatchId = currentMatch.nextMatchId;
                    if (nextMatchId) {
                        const nextIdx = newBracket.findIndex(x => x.matchId === nextMatchId);
                        if (nextIdx !== -1) {
                            if (!newBracket[nextIdx].team1) newBracket[nextIdx].team1 = m[teamKey];
                            else if (!newBracket[nextIdx].team2) newBracket[nextIdx].team2 = m[teamKey];
                        }
                    }
                }
            }
            onMatchUpdate(tournament.id, { bracket_data: newBracket });
        }
    };

    // Helper to handle completion
    const handleFinishTournament = async (winId) => {
        if (!winId && !winnerId) return alert("Izaberite pobednika!");
        const finalId = winId || winnerId;
        const winnerName = participants.find(p => p.id == finalId)?.name;
        if (confirm(`Da li ste sigurni da je ${winnerName} OSVOJIO turnir? Ovo ce arhivirati turnir.`)) {
            finishTournament(tournament.id, finalId);

            // DISCORD NOTIFICATION
            // DISCORD NOTIFICATION
            if (sendToDiscord && DISCORD_WEBHOOK_TOURNAMENTS) {
                const { sendDiscordWebhook, formatTournamentWinEmbed, DISCORD_AVATARS } = await import('../services/discordService');
                const embed = formatTournamentWinEmbed(tournament.name, winnerName, `${window.location.origin}/tournaments`);
                sendDiscordWebhook(DISCORD_WEBHOOK_TOURNAMENTS, "@everyone 🏆 **KRAJ TURNIRA**", embed, DISCORD_AVATARS.WINNER);
            }
        }
    };

    // Group matches by round
    const rounds = [];
    if (tournament.bracket_data) {
        const maxRound = Math.max(...tournament.bracket_data.map(m => m.round || 1));
        for (let i = 1; i <= maxRound; i++) {
            rounds.push(tournament.bracket_data.filter(m => m.round === i));
        }
    }

    return (
        <div className="card">
            {/* Header / Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                <div>
                    <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '2rem' }}>{tournament.name}</h2>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: '#888', background: '#222', padding: '2px 8px', borderRadius: '4px' }}>{tournament.status.toUpperCase()}</span>
                        <span style={{ fontSize: '0.9rem', color: '#888' }}>{tournament.format?.toUpperCase()} • {tournament.type === 'single_elimination' ? 'Single Elimination' : 'Round Robin'}</span>
                    </div>
                </div>

                {/* Discord Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(88, 101, 242, 0.1)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #5865F2' }}>
                    <input
                        type="checkbox"
                        checked={sendToDiscord}
                        onChange={e => setSendToDiscord(e.target.checked)}
                    />
                    <span style={{ color: '#5865F2', fontSize: '0.9rem', fontWeight: 'bold' }}>📢 Send to Discord</span>
                </label>

                {/* Finish Controls */}
                {tournament.status !== 'completed' ? (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#1a1a1a', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
                        <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Završi Turnir:</span>
                        <select
                            value={winnerId}
                            onChange={e => setWinnerId(e.target.value)}
                            style={{ padding: '0.5rem', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
                        >
                            <option value="">-- Izaberi Pobednika --</option>
                            {participants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button className="btn" style={{ background: '#ffd700', color: '#000', fontWeight: 'bold' }} onClick={() => handleFinishTournament()}>
                            🏆 ZAVRŠI
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#ffd700', background: '#222', padding: '1rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '1.5rem' }}>🏆</span>
                        <span style={{ fontWeight: 'bold' }}>Winner: {teams.find(t => t.id == tournament.winner)?.name || 'Unknown'}</span>
                    </div>
                )}
            </div>

            {/* Bracket Render */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {rounds.map((roundMatches, rIdx) => {
                    // Determine Round Name Context
                    const totalRounds = rounds.length;
                    let roundName = `RUNDA ${rIdx + 1}`;
                    if (tournament.type === 'single_elimination') {
                        if (rIdx === totalRounds - 1) roundName = "FINALE (GRAND FINALS)";
                        else if (rIdx === totalRounds - 2) roundName = "POLUFINALE (SEMI FINALS)";
                        else if (rIdx === totalRounds - 3) roundName = "ČETVRTFINALE (QUARTER FINALS)";
                    }

                    return (
                        <div key={rIdx}>
                            <h3 style={{
                                borderBottom: '1px solid #333',
                                paddingBottom: '0.5rem',
                                marginBottom: '1.5rem',
                                color: '#aaa',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <span style={{ background: '#333', color: 'white', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem' }}>{rIdx + 1}</span>
                                {roundName}
                            </h3>

                            <div className="match-card-grid">
                                {roundMatches.map((m) => (
                                    <div key={m.matchId} style={{
                                        background: m.winner ? 'linear-gradient(145deg, rgba(76, 175, 80, 0.05) 0%, rgba(0,0,0,0) 100%)' : '#1e1e1e',
                                        border: m.winner ? '1px solid #4CAF50' : '1px solid #444',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                        transition: 'transform 0.2s',
                                        position: 'relative'
                                    }}>
                                        {/* Match Header */}
                                        <div style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.75rem',
                                            color: '#666',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            background: 'rgba(0,0,0,0.2)',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <span>MATCH #{m.matchId}</span>
                                            <span>{m.format ? `BO${m.format === 'bo3' ? 3 : m.format === 'bo5' ? 5 : 1}` : 'BO1'}</span>
                                        </div>

                                        <div className="match-card-content">
                                            {/* Team 1 */}
                                            <div style={{ textAlign: 'center', opacity: m.winner && m.winner !== m.team1?.id ? 0.5 : 1 }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: m.winner === m.team1?.id ? '#4caf50' : 'white', marginBottom: '0.5rem', textShadow: m.winner === m.team1?.id ? '0 0 10px rgba(76,175,80,0.5)' : 'none' }}>
                                                    {m.team1 ? m.team1.name : 'TBD'}
                                                </div>
                                                {m.team1 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
                                                        <span style={{ fontSize: '2rem', fontWeight: '900', color: m.winner === m.team1?.id ? '#4caf50' : '#ccc' }}>{m.team1Score || 0}</span>
                                                        {!m.winner && (
                                                            <button
                                                                onClick={() => updateScore(m, 'team1')}
                                                                style={{ background: '#333', border: '1px solid #444', color: '#4caf50', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                                title="Add Win"
                                                                onMouseEnter={e => e.target.style.background = '#444'}
                                                                onMouseLeave={e => e.target.style.background = '#333'}
                                                            >+</button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Center / VS */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ color: '#444', fontSize: '1.5rem', fontWeight: '900', fontStyle: 'italic' }}>VS</div>

                                                {/* Date Picker (Compact) */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <input
                                                        type="datetime-local"
                                                        value={m.scheduledTime ? new Date(m.scheduledTime).toISOString().slice(0, 16) : ''}
                                                        onChange={(e) => {
                                                            const newTime = new Date(e.target.value).getTime();
                                                            const newBracket = [...tournament.bracket_data];
                                                            const idx = newBracket.findIndex(x => x.matchId === m.matchId);
                                                            newBracket[idx].scheduledTime = newTime;
                                                            onMatchUpdate(tournament.id, { bracket_data: newBracket });
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#888',
                                                            fontSize: '0.7rem',
                                                            textAlign: 'center',
                                                            cursor: 'pointer',
                                                            width: '110px'
                                                        }}
                                                    />
                                                    {m.scheduledTime && (
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`Objaviti termin meča (${new Date(m.scheduledTime).toLocaleString()}) na Discordu?`)) {
                                                                    const { sendDiscordWebhook, formatMatchScheduledEmbed, DISCORD_AVATARS } = await import('../services/discordService');
                                                                    // Determine names
                                                                    const t1Name = m.team1 ? m.team1.name : 'TBD';
                                                                    const t2Name = m.team2 ? m.team2.name : 'TBD';
                                                                    const embed = formatMatchScheduledEmbed(t1Name, t2Name, m.scheduledTime, `${window.location.origin}/matches/${m.matchId || ''}`); // bracket matchId might not point to real match page yet? 
                                                                    // Actually bracket matches often don't have a real match page until played? 
                                                                    // If matchId exists in real matches, link it. If not, link to bracket.
                                                                    // For now linking to /tournaments is safer if match not played.
                                                                    // But user asked for "link na sajt".
                                                                    // Let's use /tournaments as fallback.
                                                                    sendDiscordWebhook(DISCORD_WEBHOOK_SCHEDULE, `📅 **NOVI TERMIN**`, embed, DISCORD_AVATARS.SCHEDULE);
                                                                    alert("Objavljeno!");
                                                                }
                                                            }}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                                            title="Announce on Discord"
                                                        >
                                                            🔔
                                                        </button>
                                                    )}
                                                </div>

                                                {/* JSON Upload Button (Icon style) */}
                                                {!m.winner && (
                                                    <label
                                                        className="btn"
                                                        style={{
                                                            background: 'rgba(76, 175, 80, 0.1)',
                                                            color: '#4caf50',
                                                            border: '1px dashed #4caf50',
                                                            padding: '0.4rem 0.8rem',
                                                            fontSize: '0.75rem',
                                                            marginTop: '0.5rem',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.3rem',
                                                            borderRadius: '4px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(76, 175, 80, 0.2)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(76, 175, 80, 0.1)'}
                                                    >
                                                        <span>📤 Upload Result</span>
                                                        <input
                                                            type="file"
                                                            accept=".json"
                                                            style={{ display: 'none' }}
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (!file) return;

                                                                const reader = new FileReader();
                                                                reader.onload = async (ev) => {
                                                                    try {
                                                                        const json = JSON.parse(ev.target.result);
                                                                        if (!json.matchId) throw new Error("Invalid JSON: Missing matchId");

                                                                        // 1. Save Stats (Skip Auto Link to avoid double)
                                                                        await processMatchStats(json, true);

                                                                        // 2. Link to Tournament (Updates Score & Series)
                                                                        await linkMatchToTournament(tournament.id, m.matchId, json);

                                                                        alert("Meč uspešno učitan i bracket ažuriran!");
                                                                    } catch (err) {
                                                                        alert("Error parsing JSON: " + err.message);
                                                                        console.error(err);
                                                                    }
                                                                };
                                                                reader.readAsText(file);
                                                                // Reset value
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>

                                            {/* Team 2 */}
                                            <div style={{ textAlign: 'center', opacity: m.winner && m.winner !== m.team2?.id ? 0.5 : 1 }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: m.winner === m.team2?.id ? '#4caf50' : 'white', marginBottom: '0.5rem', textShadow: m.winner === m.team2?.id ? '0 0 10px rgba(76,175,80,0.5)' : 'none' }}>
                                                    {m.team2 ? m.team2.name : 'TBD'}
                                                </div>
                                                {m.team2 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
                                                        {!m.winner && (
                                                            <button
                                                                onClick={() => updateScore(m, 'team2')}
                                                                style={{ background: '#333', border: '1px solid #444', color: '#4caf50', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                                title="Add Win"
                                                                onMouseEnter={e => e.target.style.background = '#444'}
                                                                onMouseLeave={e => e.target.style.background = '#333'}
                                                            >+</button>
                                                        )}
                                                        <span style={{ fontSize: '2rem', fontWeight: '900', color: m.winner === m.team2?.id ? '#4caf50' : '#ccc' }}>{m.team2Score || 0}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Admin Controls (Force Win) */}
                                        <details style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <summary style={{ padding: '0.5rem', cursor: 'pointer', fontSize: '0.7rem', color: '#555', textAlign: 'center', background: '#151515', listStyle: 'none', userSelect: 'none' }} onMouseEnter={e => e.target.style.color = '#888'} onMouseLeave={e => e.target.style.color = '#555'}>
                                                ⚙️ Manage Result / Override
                                            </summary>
                                            <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', background: '#111' }}>
                                                {m.team1 && <button
                                                    onClick={() => {
                                                        const confirmWin = confirm(`Set ${m.team1.name} as winner?`);
                                                        if (!confirmWin) return;
                                                        const newBracket = [...tournament.bracket_data];
                                                        const matchIdx = newBracket.findIndex(x => x.matchId === m.matchId);
                                                        const currentMatch = newBracket[matchIdx];
                                                        currentMatch.winner = m.team1.id;

                                                        // DISCORD NOTIFICATION (Force Win)
                                                        if (sendToDiscord && DISCORD_WEBHOOK_RESULTS) {
                                                            const winner = m.team1.name;
                                                            const loser = m.team2 ? m.team2.name : 'Unknown';
                                                            const embed = formatMatchResultEmbed({
                                                                ...currentMatch,
                                                                team1Score: currentMatch.team1Score || 0, // Override logic often lacks score, use 0 or current
                                                                team2Score: currentMatch.team2Score || 0
                                                            }, m.team1.name, m.team2 ? m.team2.name : 'TBD', winner, `${window.location.origin}/matches/${currentMatch.realMatchId || ''}`);
                                                            sendDiscordWebhook(DISCORD_WEBHOOK_RESULTS, `👮 **ADMIN OVERRIDE: MEČ ZAVRŠEN**`, embed);
                                                        }

                                                        if (currentMatch.nextMatchId) {
                                                            const nextIdx = newBracket.findIndex(x => x.matchId === currentMatch.nextMatchId);
                                                            if (nextIdx !== -1) {
                                                                if (!newBracket[nextIdx].team1) newBracket[nextIdx].team1 = m.team1;
                                                                else if (!newBracket[nextIdx].team2) newBracket[nextIdx].team2 = m.team1;
                                                            }
                                                        }
                                                        onMatchUpdate(tournament.id, { bracket_data: newBracket });
                                                    }}
                                                    style={{ flex: 1, background: '#333', border: '1px solid #444', color: '#ccc', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                                >
                                                    Force Win: {m.team1.name}
                                                </button>}
                                                {m.team2 && <button
                                                    onClick={() => {
                                                        const confirmWin = confirm(`Set ${m.team2.name} as winner?`);
                                                        if (!confirmWin) return;
                                                        const newBracket = [...tournament.bracket_data];
                                                        const matchIdx = newBracket.findIndex(x => x.matchId === m.matchId);
                                                        const currentMatch = newBracket[matchIdx];
                                                        currentMatch.winner = m.team2.id;

                                                        // DISCORD NOTIFICATION (Force Win)
                                                        if (sendToDiscord && DISCORD_WEBHOOK_RESULTS) {
                                                            const winner = m.team2.name;
                                                            const loser = m.team1 ? m.team1.name : 'Unknown';
                                                            const embed = formatMatchResultEmbed({
                                                                ...currentMatch,
                                                                team1Score: currentMatch.team1Score || 0,
                                                                team2Score: currentMatch.team2Score || 0
                                                            }, m.team1 ? m.team1.name : 'TBD', m.team2.name, winner, `${window.location.origin}/matches/${currentMatch.realMatchId || ''}`);
                                                            sendDiscordWebhook(DISCORD_WEBHOOK_RESULTS, `👮 **ADMIN OVERRIDE: MEČ ZAVRŠEN**`, embed);
                                                        }

                                                        if (currentMatch.nextMatchId) {
                                                            const nextIdx = newBracket.findIndex(x => x.matchId === currentMatch.nextMatchId);
                                                            if (nextIdx !== -1) {
                                                                if (!newBracket[nextIdx].team1) newBracket[nextIdx].team1 = m.team2;
                                                                else if (!newBracket[nextIdx].team2) newBracket[nextIdx].team2 = m.team2;
                                                            }
                                                        }
                                                        onMatchUpdate(tournament.id, { bracket_data: newBracket });
                                                    }}
                                                    style={{ flex: 1, background: '#333', border: '1px solid #444', color: '#ccc', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                                >
                                                    Force Win: {m.team2.name}
                                                </button>}
                                            </div>
                                        </details>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}


            </div>
        </div>
    );
};

const Admin = () => {
    const { pendingTeams, approveTeam, rejectTeam, teams, deleteTeam, updateTeam, matchHistory, deleteMatch, createTournament, tournaments, activeTournament, deleteTournament, publishTournament, updateTournament } = useTournament();
    const [editingTeam, setEditingTeam] = useState(null);
    const [editingMatch, setEditingMatch] = useState(null);
    const [viewingTournament, setViewingTournament] = useState(null);
    const [activeTab, setActiveTab] = useState('teams');
    const [session, setSession] = useState(null);
    const [refreshingTeamId, setRefreshingTeamId] = useState(null);

    // Tournament Config State
    const [newTourneyName, setNewTourneyName] = useState('');
    const [tourneyType, setTourneyType] = useState('single_elimination'); // 'single_elimination' | 'round_robin'
    const [matchFormat, setMatchFormat] = useState('bo1'); // 'bo1' | 'bo2' | 'bo3' | 'bo5'
    const [selectedTeamIds, setSelectedTeamIds] = useState([]);

    // Shuffle Tournament Integration
    const [teamSource, setTeamSource] = useState('regular'); // 'regular' | 'shuffle'
    const [shuffleTeams, setShuffleTeams] = useState([]);
    const [loadingShuffleTeams, setLoadingShuffleTeams] = useState(false);

    // Initialize selected teams when teams load
    useEffect(() => {
        if (teamSource === 'regular') {
            setSelectedTeamIds(teams.map(t => t.id));
        }
    }, [teams, teamSource]);

    // Fetch shuffle teams when source changes
    useEffect(() => {
        if (teamSource === 'shuffle') {
            loadShuffleTeams();
        }
    }, [teamSource]);

    const loadShuffleTeams = async () => {
        setLoadingShuffleTeams(true);
        try {
            const confirmedTeams = await getConfirmedShuffleTeams();
            if (confirmedTeams) {
                setShuffleTeams(confirmedTeams);
                // Auto-select all shuffle teams by default (they are identified by their index/ID in the shuffle result)
                setSelectedTeamIds(confirmedTeams.map(t => t.id));
            } else {
                setShuffleTeams([]);
                setSelectedTeamIds([]);
            }
        } catch (error) {
            console.error('Error loading shuffle teams:', error);
        } finally {
            setLoadingShuffleTeams(false);
        }
    };
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) navigate('/login');
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) navigate('/login');
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    if (!session) return null;

    const handleApprove = async (id) => {
        if (window.confirm('Da li ste sigurni da želite da odobrite ovaj tim?')) {
            // Find the team being approved for Discord notification
            const teamToApprove = pendingTeams.find(t => t.id === id);

            // Approve the team first
            approveTeam(id);

            // Send Discord notification after approval
            if (teamToApprove) {
                const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_TEAMS || import.meta.env.VITE_DISCORD_WEBHOOK_URL;
                if (DISCORD_WEBHOOK_URL) {
                    // Calculate Team Strength
                    let totalRank = 0;
                    let rankCount = 0;
                    teamToApprove.players.forEach(p => {
                        if (p.rankTier) {
                            totalRank += p.rankTier;
                            rankCount++;
                        }
                    });
                    const teamAvgRank = rankCount > 0 ? totalRank / rankCount : 0;

                    // Calculate Relative Rank (including the newly approved team)
                    const allTeamsStrengths = [...teams, teamToApprove].map(t => {
                        let tTotal = 0;
                        let tCount = 0;
                        if (t.players) {
                            t.players.forEach(p => {
                                if (p.rankTier) {
                                    tTotal += p.rankTier;
                                    tCount++;
                                }
                            });
                        }
                        return tCount > 0 ? tTotal / tCount : 0;
                    });

                    allTeamsStrengths.sort((a, b) => b - a);
                    const rankPosition = allTeamsStrengths.indexOf(teamAvgRank) + 1;
                    const totalTeamsCount = allTeamsStrengths.length;

                    try {
                        const { sendDiscordWebhook, formatNewTeamEmbed, DISCORD_AVATARS } = await import('../services/discordService');
                        const embed = formatNewTeamEmbed(teamToApprove, teamToApprove.players.length, teamAvgRank);
                        // Enhance embed with Relative Rank info
                        const powerRankField = embed.fields.find(f => f.name === "Power Rank");
                        if (powerRankField) {
                            powerRankField.value += `\n(Rank #${rankPosition} od ${totalTeamsCount})`;
                        }

                        sendDiscordWebhook(DISCORD_WEBHOOK_URL, `✅ **TIM ODOBREN**`, embed, DISCORD_AVATARS.NEW_TEAM);
                    } catch (error) {
                        console.error('Error sending Discord notification:', error);
                    }
                }
            }
        }
    };

    const handleReject = (id) => {
        if (window.confirm('Da li ste sigurni da želite da odbijete ovaj tim? Ova akcija je nepovratna.')) {
            rejectTeam(id);
        }
    };

    const handleDelete = (id) => deleteTeam(id);
    const handleDeleteMatch = (id) => deleteMatch(id);

    const handleUpdateMatch = async (updatedMatch) => {
        const { error } = await supabase
            .from('matches')
            .update({
                winner: updatedMatch.winner,
                radiant_team_id: updatedMatch.radiantTeamId,
                dire_team_id: updatedMatch.direTeamId
            })
            .eq('match_id', updatedMatch.matchId.toString());

        if (error) {
            alert("Error updating match: " + error.message);
        } else {
            alert("Match updated! Refreshing...");
            window.location.reload();
        }
    };

    return (
        <div className="container" style={{ padding: '6rem 0 4rem 0' }}>
            <h1 style={{ marginBottom: '2rem' }}>Admin Panel</h1>

            <div className="admin-tabs">
                <button
                    onClick={() => setActiveTab('teams')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'teams' ? '2px solid var(--accent)' : 'none',
                        color: activeTab === 'teams' ? 'var(--accent)' : '#888',
                        padding: '1rem',
                        fontSize: '1.2rem',
                        cursor: 'pointer'
                    }}
                >
                    Timovi (Teams)
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'results' ? '2px solid var(--accent)' : 'none',
                        color: activeTab === 'results' ? 'var(--accent)' : '#888',
                        padding: '1rem',
                        fontSize: '1.2rem',
                        cursor: 'pointer'
                    }}
                >
                    Rezultati (Matches)
                </button>
                <button
                    onClick={() => setActiveTab('tournaments')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'tournaments' ? '2px solid var(--accent)' : 'none',
                        color: activeTab === 'tournaments' ? 'var(--accent)' : '#888',
                        padding: '1rem',
                        fontSize: '1.2rem',
                        cursor: 'pointer'
                    }}
                >
                    Turniri (Manage)
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'analytics' ? '2px solid var(--accent)' : 'none',
                        color: activeTab === 'analytics' ? 'var(--accent)' : '#888',
                        padding: '1rem',
                        fontSize: '1.2rem',
                        cursor: 'pointer'
                    }}
                >
                    Analitika
                </button>
                <button
                    onClick={() => setActiveTab('shuffle')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'shuffle' ? '2px solid #ffa500' : 'none',
                        color: activeTab === 'shuffle' ? '#ffa500' : '#888',
                        padding: '1rem',
                        fontSize: '1.2rem',
                        cursor: 'pointer'
                    }}
                >
                    🎲 Shuffle
                </button>
            </div>

            {editingTeam && (
                <EditTeamModal
                    team={editingTeam}
                    onClose={() => setEditingTeam(null)}
                    onSave={(updated) => updateTeam(updated.id, updated)}
                />
            )}

            {editingMatch && (
                <EditMatchModal
                    match={editingMatch}
                    onClose={() => setEditingMatch(null)}
                    onSave={handleUpdateMatch}
                    teams={teams}
                />
            )}

            {activeTab === 'teams' && (
                <>
                    <div className="card" style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Zahtevi za Registraciju ({pendingTeams.length})</h2>
                        {pendingTeams.length === 0 ? (
                            <p style={{ color: '#888' }}>Nema timova na čekanju.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '2rem' }}>
                                {pendingTeams.map(team => (
                                    <div key={team.id} style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '1.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <img src={team.logo} alt={team.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                                                <div>
                                                    <h3 style={{ margin: 0 }}>{team.name}</h3>
                                                    <small style={{ color: '#aaa' }}>Registrovan: {new Date(team.registeredAt || Date.now()).toLocaleString()}</small>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button onClick={() => handleApprove(team.id)} className="btn" style={{ backgroundColor: '#4caf50', padding: '0.5rem 1.5rem' }}>Odobri</button>
                                                <button onClick={() => handleReject(team.id)} className="btn" style={{ backgroundColor: '#f44336', padding: '0.5rem 1.5rem' }}>Odbij</button>
                                            </div>
                                        </div>
                                        <h4 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #444' }}>Roster</h4>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            {team.players.map((p, idx) => (
                                                <div key={idx} style={{ background: '#222', padding: '0.5rem', borderRadius: '4px', width: '220px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <img src={p.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                            {p.personaName}
                                                            {p.position && (
                                                                <span style={{
                                                                    marginLeft: '0.5rem',
                                                                    fontSize: '0.7rem',
                                                                    background: '#444',
                                                                    padding: '0.1rem 0.3rem',
                                                                    borderRadius: '2px',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.2rem'
                                                                }}>
                                                                    <img
                                                                        src={positions.find(pos => pos.id === p.position)?.icon}
                                                                        alt={positions.find(pos => pos.id === p.position)?.name}
                                                                        style={{
                                                                            width: '12px',
                                                                            height: '12px',
                                                                            objectFit: 'contain'
                                                                        }}
                                                                    />
                                                                    [{p.position}]
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <RankDisplay rankTier={p.rankTier} width="24px" />
                                                            <span style={{ fontSize: '0.8rem', color: '#888' }}>WR: {p.winrate}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Trenutno Aktivni Timovi ({teams.length})</h2>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {teams.map(t => (
                                <div key={t.id} style={{
                                    padding: '1.5rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <img src={t.logo} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                                            <span style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{t.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={async () => {
                                                    if (refreshingTeamId === t.id) return;
                                                    setRefreshingTeamId(t.id);
                                                    try {
                                                        const result = await forceRefreshTeamPlayers(t.players);
                                                        alert(`Osveženo ${result.success} igrača. Greške: ${result.errors}`);
                                                        window.location.reload();
                                                    } catch (error) {
                                                        alert('Greška pri osvežavanju: ' + error.message);
                                                    } finally {
                                                        setRefreshingTeamId(null);
                                                    }
                                                }}
                                                className="btn"
                                                style={{
                                                    fontSize: '0.9rem',
                                                    padding: '0.3rem 0.8rem',
                                                    background: refreshingTeamId === t.id ? '#666' : '#2196F3',
                                                    cursor: refreshingTeamId === t.id ? 'wait' : 'pointer'
                                                }}
                                                disabled={refreshingTeamId === t.id}
                                            >
                                                {refreshingTeamId === t.id ? '⏳ Osvežavam...' : '🔄 Refresh Igrača'}
                                            </button>
                                            <button onClick={() => setEditingTeam(t)} className="btn" style={{ fontSize: '0.9rem', padding: '0.3rem 1rem' }}>Edit</button>
                                            <button onClick={() => handleDelete(t.id)} className="btn" style={{ fontSize: '0.9rem', padding: '0.3rem 1rem', background: '#f44336' }}>Delete</button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {t.players.map((p, idx) => (
                                            <div key={idx} style={{ background: '#222', padding: '0.5rem', borderRadius: '4px', width: '220px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <img src={p.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                        {p.personaName}
                                                        {p.position && (
                                                            <span style={{
                                                                marginLeft: '0.5rem',
                                                                fontSize: '0.7rem',
                                                                background: '#444',
                                                                padding: '0.1rem 0.3rem',
                                                                borderRadius: '2px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.2rem'
                                                            }}>
                                                                <img
                                                                    src={positions.find(pos => pos.id === p.position)?.icon}
                                                                    alt={positions.find(pos => pos.id === p.position)?.name}
                                                                    style={{
                                                                        width: '12px',
                                                                        height: '12px',
                                                                        objectFit: 'contain'
                                                                    }}
                                                                />
                                                                [{p.position}]
                                                            </span>
                                                        )}
                                                        {p.isCaptain && <span style={{ marginLeft: '0.5rem', color: 'var(--accent)' }}>♔</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <RankDisplay rankTier={p.rankTier} width="24px" />
                                                        <span style={{ fontSize: '0.8rem', color: '#888' }}>WR: {p.winrate}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'results' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ color: 'var(--accent)', margin: 0 }}>Istorija Mečeva ({matchHistory.length})</h2>
                        <a href="/admin/upload" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ Otpremi Novi Meč</a>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {matchHistory.length === 0 ? <p style={{ color: '#888' }}>Nema zabeleženih mečeva.</p> : matchHistory.map((m, idx) => (
                            <li key={m.matchId || idx} style={{
                                padding: '1rem',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.02)',
                                marginBottom: '0.5rem',
                                borderRadius: '4px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                                        <span style={{ color: (m.winner === 'Radiant' || m.winner == m.radiantTeamId) ? '#4caf50' : '#fff' }}>Radiant</span> vs <span style={{ color: (m.winner === 'Dire' || m.winner == m.direTeamId) ? '#f44336' : '#fff' }}>Dire</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                        ID: {m.matchId} | Pobednik: <span style={{ fontWeight: 'bold' }}>{teams.find(t => t.id == m.winner)?.name || m.winner}</span> | {new Date(m.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => setEditingMatch(m)}
                                        className="btn"
                                        style={{ fontSize: '0.9rem', padding: '0.3rem 1rem' }}
                                    >
                                        Izmeni
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMatch(m.matchId)}
                                        className="btn"
                                        style={{ fontSize: '0.9rem', padding: '0.3rem 1rem', background: '#f44336' }}
                                    >
                                        Obriši
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {activeTab === 'tournaments' && (
                <div className="admin-tournaments-grid">

                    {/* LEFT COLUMN: Create & Drafts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Create New Tournament */}
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', fontSize: '1.2rem', marginBottom: '1rem' }}>Napravi Turnir</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Name */}
                                <div>
                                    <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Ime Turnira</label>
                                    <input
                                        type="text"
                                        placeholder="npr. Winter Cup 2025"
                                        value={newTourneyName}
                                        onChange={(e) => setNewTourneyName(e.target.value)}
                                        style={{ width: '100%', padding: '0.8rem', background: '#222', border: '1px solid #333', color: 'white' }}
                                    />
                                </div>

                                {/* Configuration */}
                                <div className="admin-config-grid">
                                    <div>
                                        <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Format Takmičenja</label>
                                        <select
                                            value={tourneyType}
                                            onChange={(e) => setTourneyType(e.target.value)}
                                            style={{ width: '100%', padding: '0.8rem', background: '#222', border: '1px solid #333', color: 'white' }}
                                        >
                                            <option value="single_elimination">Single Elimination (Knockout)</option>
                                            <option value="round_robin">Round Robin (Svi protiv svih)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Format Meča</label>
                                        <select
                                            value={matchFormat}
                                            onChange={(e) => setMatchFormat(e.target.value)}
                                            style={{ width: '100%', padding: '0.8rem', background: '#222', border: '1px solid #333', color: 'white' }}
                                        >
                                            <option value="bo1">Best of 1</option>
                                            <option value="bo2">Best of 2</option>
                                            <option value="bo3">Best of 3</option>
                                            <option value="bo5">Best of 5</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>Izvor Timova</label>
                                        <select
                                            value={teamSource}
                                            onChange={(e) => setTeamSource(e.target.value)}
                                            style={{ width: '100%', padding: '0.8rem', background: '#222', border: '1px solid #333', color: 'white' }}
                                        >
                                            <option value="regular">Regularni (Prijavljeni timovi)</option>
                                            <option value="shuffle">Shuffle (Formirani timovi)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Team Selection */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                        <label style={{ color: '#888', fontSize: '0.8rem' }}>Učesnici ({selectedTeamIds.length})</label>
                                        <div>
                                            <button
                                                onClick={() => {
                                                    const allIds = teamSource === 'regular' ? teams.map(t => t.id) : shuffleTeams.map(t => t.id);
                                                    setSelectedTeamIds(allIds);
                                                }}
                                                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.7rem', cursor: 'pointer', marginRight: '0.5rem' }}
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={() => setSelectedTeamIds([])}
                                                style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.7rem', cursor: 'pointer' }}
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto', background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '0.5rem' }}>
                                        {teamSource === 'regular' ? (
                                            teams.map(t => {
                                                // Calculate strength for all teams first to sort
                                                let total = 0, count = 0;
                                                if (t.players) t.players.forEach(p => { if (p.rankTier) { total += p.rankTier; count++; } });
                                                t.strengthScore = count > 0 ? total / count : 0;
                                                return t;
                                            })
                                                .sort((a, b) => b.strengthScore - a.strengthScore)
                                                .map((team, index) => {
                                                    const isSelected = selectedTeamIds.includes(team.id);

                                                    // Color code top 3
                                                    let rankColor = '#666';
                                                    if (index === 0) rankColor = '#ffd700'; // Gold
                                                    if (index === 1) rankColor = '#c0c0c0'; // Silver
                                                    if (index === 2) rankColor = '#cd7f32'; // Bronze

                                                    return (
                                                        <div
                                                            key={team.id}
                                                            onClick={() => {
                                                                if (isSelected) setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id));
                                                                else setSelectedTeamIds([...selectedTeamIds, team.id]);
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '0.8rem 0.5rem',
                                                                borderBottom: '1px solid #2a2a2a',
                                                                cursor: 'pointer',
                                                                background: isSelected ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                                                                transition: 'background 0.2s',
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = isSelected ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255,255,255,0.05)'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = isSelected ? 'rgba(33, 150, 243, 0.1)' : 'transparent'}
                                                        >
                                                            {/* Checkbox Column */}
                                                            <div style={{ width: '50px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    readOnly
                                                                    style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                                                                />
                                                            </div>

                                                            <div style={{ width: '70px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                                                <img
                                                                    src={team.logo}
                                                                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #333' }}
                                                                    alt={team.name}
                                                                />
                                                            </div>

                                                            <div style={{ flex: 1, paddingLeft: '1rem' }}>
                                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white', lineHeight: '1.2' }}>{team.name}</div>
                                                                <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.2rem' }}>
                                                                    {team.players?.length || 0} igrača
                                                                </div>
                                                            </div>

                                                            <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: rankColor }}>#{index + 1}</div>
                                                                <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>Power Rank</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            shuffleTeams.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                                                    {loadingShuffleTeams ? '⏳ Učitavam shuffle timove...' : '❌ Nema potvrđenih shuffle timova. Prvo ih formirajte u Shuffle tabu.'}
                                                </div>
                                            ) : (
                                                shuffleTeams.map((team, index) => {
                                                    const isSelected = selectedTeamIds.includes(team.id);
                                                    return (
                                                        <div
                                                            key={team.id}
                                                            onClick={() => {
                                                                if (isSelected) setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id));
                                                                else setSelectedTeamIds([...selectedTeamIds, team.id]);
                                                            }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '0.8rem 0.5rem',
                                                                borderBottom: '1px solid #2a2a2a',
                                                                cursor: 'pointer',
                                                                background: isSelected ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                                                transition: 'background 0.2s',
                                                            }}
                                                        >
                                                            <div style={{ width: '50px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    readOnly
                                                                    style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                                                                />
                                                            </div>

                                                            <div style={{ width: '70px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                                                <img
                                                                    src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/meepo.png"
                                                                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #4caf50' }}
                                                                    alt={team.name}
                                                                />
                                                            </div>

                                                            <div style={{ flex: 1, paddingLeft: '1rem' }}>
                                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{team.name}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                                                    Shuffle tim • {Object.values(team.positions).filter(Boolean).length} igrača
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )
                                        )}
                                    </div>
                                </div>

                                <button className="btn btn-primary" onClick={async () => {
                                    if (!newTourneyName) return alert("Morate uneti ime turnira!");

                                    let participatingTeams = [];

                                    if (teamSource === 'regular') {
                                        participatingTeams = teams.filter(t => selectedTeamIds.includes(t.id));
                                    } else {
                                        // Handle Shuffle Teams conversion
                                        const selectedShuffleTeams = shuffleTeams.filter(t => selectedTeamIds.includes(t.id));
                                        if (selectedShuffleTeams.length === 0) return alert("Izaberite bar 2 shuffle tima!");

                                        if (!window.confirm(`Sistem će automatski registrovati ${selectedShuffleTeams.length} shuffle tima kao regularne timove. Nastavi?`)) return;

                                        try {
                                            const registeredResults = await Promise.all(selectedShuffleTeams.map(t => registerShuffleTeam(t)));
                                            participatingTeams = registeredResults;
                                            // We don't need to refresh the whole state here because createTournament will use these objects
                                        } catch (error) {
                                            return alert("Greška pri registraciji shuffle timova: " + error.message);
                                        }
                                    }

                                    if (participatingTeams.length < 2) return alert("Potrebno je bar 2 tima za turnir!");

                                    // 1. Calculate Strength for Sorting
                                    const getTeamMMR = (team) => {
                                        let total = 0, count = 0;
                                        if (!team.players) return 0;
                                        team.players.forEach(p => { if (p.rankTier) { total += p.rankTier; count++; } });
                                        return count > 0 ? total / count : 0;
                                    };

                                    // Sort strong to weak
                                    const sortedTeams = [...participatingTeams].sort((a, b) => getTeamMMR(b) - getTeamMMR(a));
                                    const matches = [];

                                    if (tourneyType === 'single_elimination') {
                                        // A. Generate Round 1 (Seeded)
                                        const pool = [...sortedTeams];
                                        const initialPairs = [];

                                        while (pool.length >= 2) {
                                            const strong = pool.shift();
                                            const weak = pool.pop();
                                            initialPairs.push({ strong, weak });
                                        }

                                        let orderedPairs = initialPairs;
                                        if (initialPairs.length === 4) {
                                            orderedPairs = [initialPairs[0], initialPairs[3], initialPairs[1], initialPairs[2]];
                                        }

                                        // Creating Match Objects for Round 1
                                        let currentRoundMatches = orderedPairs.map(p => ({
                                            matchId: Date.now() + Math.random(),
                                            team1: p.strong,
                                            team2: p.weak,
                                            winner: null,
                                            round: 1,
                                            format: matchFormat
                                        }));

                                        matches.push(...currentRoundMatches);

                                        // B. Generate Subsequent Rounds
                                        let roundNum = 2;
                                        while (currentRoundMatches.length > 1) {
                                            const nextRoundMatches = [];
                                            for (let i = 0; i < currentRoundMatches.length; i += 2) {
                                                const m1 = currentRoundMatches[i];
                                                const m2 = currentRoundMatches[i + 1];

                                                if (!m2) continue;

                                                const nextMatch = {
                                                    matchId: Date.now() + Math.random(),
                                                    team1: null,
                                                    team2: null,
                                                    winner: null,
                                                    round: roundNum,
                                                    format: matchFormat,
                                                    placeholder: true
                                                };

                                                m1.nextMatchId = nextMatch.matchId;
                                                m2.nextMatchId = nextMatch.matchId;

                                                nextRoundMatches.push(nextMatch);
                                                matches.push(nextMatch);
                                            }
                                            currentRoundMatches = nextRoundMatches;
                                            roundNum++;
                                        }
                                    } else if (tourneyType === 'round_robin') {
                                        // All vs All
                                        for (let i = 0; i < sortedTeams.length; i++) {
                                            for (let j = i + 1; j < sortedTeams.length; j++) {
                                                matches.push({
                                                    matchId: Date.now() + Math.random(),
                                                    team1: sortedTeams[i],
                                                    team2: sortedTeams[j],
                                                    winner: null,
                                                    isPlaceholder: false,
                                                    format: matchFormat
                                                });
                                            }
                                        }
                                    }

                                    try {
                                        await createTournament(newTourneyName, matches, teamSource === 'shuffle');
                                        setNewTourneyName('');
                                        alert("✅ Turnir uspešno kreiran!");
                                        if (teamSource === 'shuffle') window.location.reload();
                                    } catch (err) {
                                        alert("Greška: " + err.message);
                                    }
                                }}>
                                    🚀 Kreiraj Turnir
                                </button>
                            </div>
                        </div>

                        {/* Drafts List */}
                        <div className="card">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#aaa' }}>Nacrti i Istorija</h3>
                            {tournaments.length === 0 ? <p style={{ color: '#666' }}>Nema pronađenih turnira.</p> : (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {tournaments.map(t => (
                                        <li key={t.id} style={{ marginBottom: '0.8rem', padding: '0.5rem', border: '1px solid #333', borderRadius: '4px', background: t.status === 'active' ? 'rgba(33, 150, 243, 0.1)' : 'transparent' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: t.status === 'active' ? 'bold' : 'normal', color: t.status === 'active' ? '#2196f3' : '#fff' }}>
                                                    {t.name} {t.status === 'active' && '(Aktivni)'}
                                                    {t.status === 'archived' && <span style={{ fontSize: '0.8rem', color: '#aaa' }}> (Arhiviran: {teams.find(tm => tm.id == t.winner)?.name})</span>}
                                                </span>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <button onClick={() => setViewingTournament(t)} className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>Otvori</button>
                                                    {t.status === 'draft' && <button onClick={async () => {
                                                        await publishTournament(t.id);
                                                        // Discord Notification
                                                        if (DISCORD_WEBHOOK_TOURNAMENTS) {
                                                            const { sendDiscordWebhook, formatNewTournamentEmbed, DISCORD_AVATARS } = await import('../services/discordService');
                                                            const embed = formatNewTournamentEmbed(t);
                                                            sendDiscordWebhook(DISCORD_WEBHOOK_TOURNAMENTS, "@everyone 🏆 **NOVI TURNIR JE POČEO!**", embed, DISCORD_AVATARS.NEW_TOURNAMENT);
                                                        }
                                                        alert("Turnir aktiviran i objavljen na Discordu!");
                                                    }} className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#4caf50' }}>Aktiviraj</button>}
                                                    <button onClick={() => deleteTournament(t.id)} className="btn" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#f44336' }}>X</button>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>{new Date(t.created_at).toLocaleDateString()}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Active Tournament Details */}
                    <div>
                        {viewingTournament || activeTournament ? (
                            <ManageTournament
                                tournament={viewingTournament || activeTournament}
                                teams={teams}
                                onMatchUpdate={updateTournament}
                            />
                        ) : (
                            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                <p>Izaberite turnir za pregled ili napravite novi.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <AnalyticsDashboard />
            )}

            {activeTab === 'shuffle' && (
                <ShuffleAdminSection teams={teams} />
            )}
        </div>
    );
};

// Shuffle Admin Section Component
const ShuffleAdminSection = ({ teams }) => {
    const [pendingPlayers, setPendingPlayers] = useState([]);
    const [approvedPlayers, setApprovedPlayers] = useState([]);
    const [generatedTeams, setGeneratedTeams] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    // Position names mapping
    const positionNames = { 1: 'Carry', 2: 'Mid', 3: 'Offlane', 4: 'Soft Sup', 5: 'Hard Sup' };

    useEffect(() => {
        loadPlayers();
    }, []);

    const loadPlayers = async () => {
        setLoading(true);
        const [pending, approved] = await Promise.all([
            getPendingShufflePlayers(),
            getApprovedShufflePlayers()
        ]);
        setPendingPlayers(pending);
        setApprovedPlayers(approved);
        setLoading(false);
    };

    const handleApprove = async (playerId) => {
        try {
            await approveShufflePlayer(playerId);
            await loadPlayers();
        } catch (error) {
            alert('Greška: ' + error.message);
        }
    };

    const handleReject = async (playerId) => {
        if (confirm('Odbiti ovog igrača?')) {
            try {
                await rejectShufflePlayer(playerId);
                await loadPlayers();
            } catch (error) {
                alert('Greška: ' + error.message);
            }
        }
    };

    const handleGenerateTeams = () => {
        if (approvedPlayers.length < 10) {
            alert('Potrebno je minimum 10 odobrenih igrača za generisanje timova.');
            return;
        }
        setGenerating(true);
        setConfirmed(false);
        const result = generateBalancedTeams(approvedPlayers, 2);
        setGeneratedTeams(result);
        setGenerating(false);
    };

    const handleConfirmTeams = async () => {
        if (!generatedTeams?.teams?.length) return;

        if (!confirm('⚠️ Da li ste sigurni da želite potvrditi ove timove? Ovo će poslati obaveštenje na Discord.')) return;

        setConfirming(true);
        try {
            await confirmShuffleTeams(generatedTeams.teams);
            setConfirmed(true);
            alert('✅ Timovi su potvrđeni i Discord obaveštenje je poslano!');
            await loadPlayers();
        } catch (error) {
            alert('Greška: ' + error.message);
        } finally {
            setConfirming(false);
        }
    };

    const handleResetShuffle = async () => {
        if (!confirm('⚠️ Da li ste sigurni da želite resetovati shuffle status? Ovo će raspustiti sve timove i vratiti igrače u pool za sledeći turnir. Trofeji će biti sačuvani.')) return;

        setLoading(true);
        try {
            await resetShuffleState();
            setGeneratedTeams(null);
            setConfirmed(false);
            alert('✅ Shuffle sistem je resetovan!');
            await loadPlayers();
        } catch (error) {
            alert('Greška: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>⏳ Učitavanje...</div>;
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* LEFT: Players */}
            <div>
                {/* Pending Players */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#ffa500', marginBottom: '1rem' }}>
                        ⏳ Čekaju Odobrenje ({pendingPlayers.length})
                    </h3>
                    {pendingPlayers.length === 0 ? (
                        <p style={{ color: '#666' }}>Nema igrača na čekanju.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {pendingPlayers.map(p => (
                                <div key={p.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    padding: '0.8rem',
                                    background: '#1a1a1a',
                                    borderRadius: '8px'
                                }}>
                                    <img src={p.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{p.persona_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                            Pozicije: {p.preferred_positions.map(pos => positionNames[pos]).join(', ')}
                                        </div>
                                    </div>
                                    <input
                                        placeholder="Discord ID"
                                        value={p.discord_id || ''}
                                        onChange={async (e) => {
                                            const val = e.target.value;
                                            const { error } = await supabase.from('shuffle_players').update({ discord_id: val }).eq('id', p.id);
                                            if (!error) loadPlayers();
                                        }}
                                        style={{ width: '140px', background: '#333', border: '1px solid #444', color: 'white', padding: '0.2rem', fontSize: '0.8rem' }}
                                    />
                                    <span style={{ color: '#888', fontSize: '0.9rem' }}>Tier {p.rank_tier || '?'}</span>
                                    <button onClick={() => handleApprove(p.id)} className="btn" style={{ background: '#4caf50', padding: '0.3rem 0.8rem' }}>✓</button>
                                    <button onClick={() => handleReject(p.id)} className="btn" style={{ background: '#f44336', padding: '0.3rem 0.8rem' }}>X</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Approved Players */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#4caf50', margin: 0 }}>✅ Odobreni ({approvedPlayers.length})</h3>
                        <button
                            onClick={handleGenerateTeams}
                            disabled={approvedPlayers.length < 10 || generating}
                            className="btn"
                            style={{
                                background: approvedPlayers.length < 10 ? '#444' : 'linear-gradient(135deg, #ffa500, #ff6600)',
                                padding: '0.5rem 1rem'
                            }}
                        >
                            {generating ? '⏳...' : '🎲 Generiši Timove'}
                        </button>
                        <button
                            onClick={handleResetShuffle}
                            className="btn"
                            style={{
                                background: '#333',
                                border: '1px solid #f44336',
                                color: '#f44336',
                                padding: '0.5rem 1rem'
                            }}
                        >
                            🔄 Reset Shuffle
                        </button>
                    </div>
                    {approvedPlayers.length === 0 ? (
                        <p style={{ color: '#666' }}>Nema odobrenih igrača.</p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {approvedPlayers.map(p => (
                                <div key={p.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 0.8rem',
                                    background: '#222',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem'
                                }}>
                                    <img src={p.avatar} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                    <span>{p.persona_name}</span>
                                    <input
                                        title="Izmeni Discord ID"
                                        value={p.discord_id || ''}
                                        onChange={async (e) => {
                                            const val = e.target.value;
                                            await supabase.from('shuffle_players').update({ discord_id: val }).eq('id', p.id);
                                            // No reload here to avoid flickering in the small badges list, but maybe it's better to update state locally?
                                            // For now just background update.
                                        }}
                                        style={{ width: '120px', background: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#888', padding: '0', fontSize: '0.7rem' }}
                                    />
                                    <span style={{ color: '#888', fontSize: '0.75rem' }}>
                                        [{p.preferred_positions.join(',')}]
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    {approvedPlayers.length > 0 && approvedPlayers.length < 10 && (
                        <p style={{ color: '#ffa500', marginTop: '1rem', fontSize: '0.9rem' }}>
                            ⚠️ Potrebno još {10 - approvedPlayers.length} igrača za minimum 2 tima.
                        </p>
                    )}
                </div>
            </div>

            {/* RIGHT: Generated Teams */}
            <div className="card">
                <h3 style={{ color: '#ffa500', marginBottom: '1rem' }}>🎲 Generisani Timovi</h3>
                {!generatedTeams ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
                        <p>Kliknite "Generiši Timove" kada imate dovoljno igrača.</p>
                    </div>
                ) : generatedTeams.error ? (
                    <div style={{ color: '#f44336', padding: '1rem', background: 'rgba(244,67,54,0.1)', borderRadius: '8px' }}>
                        {generatedTeams.error}
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#222', borderRadius: '4px', fontSize: '0.9rem' }}>
                            Kompletni timovi: {generatedTeams.stats.completeTeams} |
                            Avg Rank: {generatedTeams.stats.avgTeamRank} |
                            Nerasporedi: {generatedTeams.unassigned.length}
                        </div>
                        {generatedTeams.teams.map(team => (
                            <div key={team.id} style={{
                                marginBottom: '1.5rem',
                                padding: '1rem',
                                background: '#1a1a1a',
                                borderRadius: '8px',
                                border: '1px solid #333'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                    <strong style={{ color: 'var(--accent)' }}>{team.name}</strong>
                                    <span style={{ color: '#888' }}>Total Rank: {team.totalRank}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    {[1, 2, 3, 4, 5].map(pos => (
                                        <div key={pos} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.3rem 0.5rem',
                                            background: team.positions[pos] ? '#222' : 'rgba(244,67,54,0.1)',
                                            borderRadius: '4px'
                                        }}>
                                            <span style={{ width: '80px', fontSize: '0.8rem', color: '#888' }}>
                                                {positionNames[pos]}
                                            </span>
                                            {team.positions[pos] ? (
                                                <>
                                                    <img src={team.positions[pos].avatar} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                                    <span>{team.positions[pos].persona_name}</span>
                                                    <span style={{ color: '#888', marginLeft: 'auto' }}>T{team.positions[pos].rank_tier || '?'}</span>
                                                </>
                                            ) : (
                                                <span style={{ color: '#f44336' }}>Nije popunjeno</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {generatedTeams.unassigned.length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,165,0,0.1)', borderRadius: '8px' }}>
                                <strong style={{ color: '#ffa500' }}>Nerasporedeni igrači:</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {generatedTeams.unassigned.map(p => (
                                        <span key={p.id} style={{ background: '#333', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                                            {p.persona_name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirm Teams Button */}
                        {generatedTeams.teams.length > 0 && !confirmed && (
                            <button
                                onClick={handleConfirmTeams}
                                disabled={confirming}
                                className="btn"
                                style={{
                                    width: '100%',
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                                    fontSize: '1.1rem'
                                }}
                            >
                                {confirming ? '⏳ Potvrđujem...' : '✅ Potvrdi Timove i Pošalji na Discord'}
                            </button>
                        )}

                        {confirmed && (
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: 'rgba(76,175,80,0.2)',
                                borderRadius: '8px',
                                textAlign: 'center',
                                color: '#4caf50'
                            }}>
                                ✅ Timovi su potvrđeni! Discord obaveštenje je poslano.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
