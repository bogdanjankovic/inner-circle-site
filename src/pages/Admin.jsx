
import { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { HeroImage } from '../components/ui/HeroTooltip';
import RankDisplay from '../components/ui/RankDisplay';
import ImageUpload from '../components/ui/ImageUpload';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// Position data
const positions = [
    { id: 1, name: 'Carry', icon: '🗡️' },
    { id: 2, name: 'Midlane', icon: '⚡' },
    { id: 3, name: 'Offlaner', icon: '🛡️' },
    { id: 4, name: 'Soft Support', icon: '💊' },
    { id: 5, name: 'Hard Support', icon: '🔧' }
];

const EditTeamModal = ({ team, onClose, onSave }) => {
    const [name, setName] = useState(team.name);
    const [logo, setLogo] = useState(team.logo);
    const [players, setPlayers] = useState(JSON.parse(JSON.stringify(team.players)));

    const handlePlayerChange = (idx, field, value) => {
        const newPlayers = [...players];
        if (field === 'personaName') newPlayers[idx].personaName = value;
        if (field === 'position') newPlayers[idx].position = parseInt(value);
        setPlayers(newPlayers);
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
                                        {pos.icon} {pos.name} [{pos.id}]
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

const EditMatchModal = ({ match, onClose, onSave }) => {
    const [winner, setWinner] = useState(match.winner || 'Radiant');

    const handleSave = () => {
        onSave({ ...match, winner });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <button className="close-modal" onClick={onClose}>&times;</button>
                <h2>Edit Match Result</h2>
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ marginBottom: '0.5rem', color: '#888' }}>Match ID: {match.matchId}</p>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Winner</label>
                    <select
                        value={winner}
                        onChange={(e) => setWinner(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', background: '#333', color: 'white', border: '1px solid #555' }}
                    >
                        <option value="Radiant">Radiant</option>
                        <option value="Dire">Dire</option>
                    </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} className="btn" style={{ background: '#666' }}>Cancel</button>
                    <button onClick={handleSave} className="btn" style={{ background: '#4caf50' }}>Save Changes</button>
                </div>
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

    const handleApprove = (id) => {
        if (window.confirm('Da li ste sigurni da želite da odobrite ovaj tim?')) {
            approveTeam(id);
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
            .update({ winner: updatedMatch.winner })
            .eq('match_id', updatedMatch.matchId.toString());

        if (error) {
            alert("Error updating match: " + error.message);
        } else {
            alert("Match updated! Refreshing...");
            window.location.reload();
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ marginBottom: '2rem' }}>Admin Panel</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #333' }}>
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
                                                                    borderRadius: '2px' 
                                                                }}>
                                                                    {positions.find(pos => pos.id === p.position)?.icon} [{p.position}]
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
                                        <div style={{ display: 'flex', gap: '1rem' }}>
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
                                                                borderRadius: '2px' 
                                                            }}>
                                                                {positions.find(pos => pos.id === p.position)?.icon} [{p.position}]
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
                                        <span style={{ color: m.winner === 'Radiant' ? '#4caf50' : '#fff' }}>Radiant</span> vs <span style={{ color: m.winner === 'Dire' ? '#f44336' : '#fff' }}>Dire</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                        ID: {m.matchId} | Pobednik: <span style={{ fontWeight: 'bold' }}>{m.winner}</span> | {new Date(m.timestamp).toLocaleString()}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>

                    {/* LEFT COLUMN: Create & Drafts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Create New Tournament */}
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', fontSize: '1.2rem', marginBottom: '1rem' }}>Napravi Turnir</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Ime Turnira"
                                    id="newTourneyName"
                                    style={{ padding: '0.8rem', background: '#222', border: '1px solid #333', color: 'white' }}
                                />
                                <button className="btn btn-primary" onClick={() => {
                                    const name = document.getElementById('newTourneyName').value;
                                    if (!name) return alert("Enter a name");
                                    if (teams.length < 2) return alert("Need at least 2 teams!");

                                    const getTeamMMR = (team) => {
                                        let total = 0, count = 0;
                                        if (!team.players) return 0;
                                        team.players.forEach(p => { if (p.rankTier) { total += p.rankTier; count++; } });
                                        return count > 0 ? total / count : 0;
                                    };
                                    const sortedTeams = [...teams].sort((a, b) => getTeamMMR(b) - getTeamMMR(a));
                                    const round1 = [];
                                    const pool = [...sortedTeams];
                                    while (pool.length >= 2) {
                                        const strong = pool.shift();
                                        const weak = pool.pop();
                                        round1.push({
                                            matchId: Date.now() + Math.random(),
                                            team1: strong,
                                            team2: weak,
                                            winner: null,
                                            isPlaceholder: false
                                        });
                                    }
                                    createTournament(name, round1);
                                }}>Generiši Žreb</button>
                            </div>
                        </div>

                        {/* Drafts List */}
                        <div className="card">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#aaa' }}>Nacrti i Istorija</h3>
                            {tournaments.length === 0 ? <p style={{ color: '#666' }}>Nema pronađenih turnira.</p> : (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {tournaments.map(t => (
                                        <li key={t.id} style={{
                                            padding: '1rem',
                                            border: '1px solid #333',
                                            marginBottom: '0.5rem',
                                            background: '#1a1a1a',
                                            borderRadius: '4px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <strong style={{ color: 'white' }}>{t.name}</strong>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: t.status === 'active' ? '#4caf50' : '#444',
                                                    color: 'white'
                                                }}>{t.status.toUpperCase()}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>
                                                {new Date(t.created_at).toLocaleDateString('en-GB')}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                <button className="btn" onClick={() => setViewingTournament(t)} style={{ background: '#2196f3', fontSize: '0.8rem', padding: '0.5rem' }}>
                                                    Upravljaj
                                                </button>
                                                {t.status === 'draft' ? (
                                                    <button className="btn" onClick={() => publishTournament(t.id)} style={{ fontSize: '0.8rem', padding: '0.5rem' }}>Objavi</button>
                                                ) : (
                                                    <button className="btn" disabled style={{ background: 'transparent', border: '1px solid #444', color: '#444', fontSize: '0.8rem' }}>Aktivan</button>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => deleteTournament(t.id)}
                                                style={{ width: '100%', marginTop: '0.5rem', background: 'transparent', border: 'none', color: '#f44336', fontSize: '0.8rem', cursor: 'pointer' }}
                                            >
                                                Obriši Turnir
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Active Tournament Details (or Placeholder) */}
                    <div>
                        {activeTournament ? (
                            <div className="card" style={{ borderTop: '4px solid #4caf50' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div>
                                        <h2 style={{ color: '#4caf50', margin: 0 }}>ACTIVE: {activeTournament.name}</h2>
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Live on public site</span>
                                    </div>
                                    <button className="btn" onClick={() => deleteTournament(activeTournament.id)} style={{ background: '#f44336' }}>Delete Active</button>
                                </div>

                                {/* Quick Bracket Preview */}
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {activeTournament.bracket_data?.map((m, i) => (
                                        <div key={i} style={{ padding: '0.5rem', background: '#222', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{m.team1?.name || 'TBD'} vs {m.team2?.name || 'TBD'}</span>
                                            <span style={{ color: m.winner ? '#4caf50' : '#888' }}>{m.winner ? 'Finished' : 'Pending'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#666', border: '2px dashed #333' }}>
                                <h2>No Active Tournament</h2>
                                <p>Select a draft from the left and click "Publish" to go live.</p>
                            </div>
                        )}
                    </div>

                    {/* Tournament Editor / Details Modal or Section */}
                    {viewingTournament && (
                        <div className="modal-overlay" style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.9)', zIndex: 1000, overflowY: 'auto', padding: '2rem'
                        }}>
                            <div className="card" style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
                                <button
                                    onClick={() => setViewingTournament(null)}
                                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
                                >
                                    &times;
                                </button>

                                <h2 style={{ color: 'var(--accent)' }}>Manage Tournament</h2>

                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem' }}>Tournament Name</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <input
                                            type="text"
                                            value={viewingTournament.name}
                                            onChange={(e) => setViewingTournament({ ...viewingTournament, name: e.target.value })}
                                            style={{ flex: 1, padding: '0.5rem' }}
                                        />
                                        <button className="btn" onClick={() => updateTournament(viewingTournament.id, { name: viewingTournament.name })}>Save Name</button>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h3>Bracket & Matches</h3>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {viewingTournament.bracket_data?.map((match, idx) => (
                                            <div key={match.matchId} style={{
                                                display: 'grid', gridTemplateColumns: '1fr auto 1fr auto auto', gap: '1rem', alignItems: 'center',
                                                padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'
                                            }}>
                                                {/* Team 1 Selector */}
                                                <select
                                                    value={match.team1?.id || ''}
                                                    onChange={(e) => {
                                                        const newTeam = teams.find(t => t.id === e.target.value) || null;
                                                        const newBracket = [...viewingTournament.bracket_data];
                                                        newBracket[idx] = { ...newBracket[idx], team1: newTeam };
                                                        setViewingTournament({ ...viewingTournament, bracket_data: newBracket });
                                                    }}
                                                    style={{ padding: '0.3rem', background: '#222', color: 'white', border: '1px solid #444', maxWidth: '200px' }}
                                                >
                                                    <option value="">TBD / Slot</option>
                                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>

                                                <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>VS</span>

                                                {/* Team 2 Selector */}
                                                <select
                                                    value={match.team2?.id || ''}
                                                    onChange={(e) => {
                                                        const newTeam = teams.find(t => t.id === e.target.value) || null;
                                                        const newBracket = [...viewingTournament.bracket_data];
                                                        newBracket[idx] = { ...newBracket[idx], team2: newTeam };
                                                        setViewingTournament({ ...viewingTournament, bracket_data: newBracket });
                                                    }}
                                                    style={{ padding: '0.3rem', background: '#222', color: 'white', border: '1px solid #444', maxWidth: '200px' }}
                                                >
                                                    <option value="">TBD / Slot</option>
                                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>

                                                {/* Schedule Picker */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                    <label style={{ fontSize: '0.7rem', color: '#888' }}>Schedule Time:</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={match.scheduledTime || ''}
                                                        onChange={(e) => {
                                                            const newBracket = [...viewingTournament.bracket_data];
                                                            newBracket[idx] = { ...newBracket[idx], scheduledTime: e.target.value };
                                                            setViewingTournament({ ...viewingTournament, bracket_data: newBracket });
                                                        }}
                                                        style={{
                                                            padding: '0.3rem',
                                                            background: '#222',
                                                            color: 'white',
                                                            border: '1px solid #444',
                                                            fontSize: '0.8rem',
                                                            fontFamily: 'inherit'
                                                        }}
                                                    />
                                                </div>

                                                {/* Status / Actions */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem', color: '#888' }}>
                                                    <span>{match.winner ? 'Finished' : 'Pending'}</span>
                                                    {match.winner && <span style={{ color: '#4caf50' }}>Winner: {match.winner === match.team1?.id ? match.team1?.name : match.team2?.name}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ marginTop: '1rem', width: '100%' }}
                                        onClick={() => {
                                            updateTournament(viewingTournament.id, { bracket_data: viewingTournament.bracket_data });
                                            alert("Bracket updated!");
                                        }}
                                    >
                                        Save Changes to Bracket
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Admin;
