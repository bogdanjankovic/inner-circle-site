import { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { HeroImage } from '../components/ui/HeroTooltip';
import RankDisplay from '../components/ui/RankDisplay';
import ImageUpload from '../components/ui/ImageUpload';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// ... EditTeamModal code remains same, skipping for brevity ...
const EditTeamModal = ({ team, onClose, onSave }) => {
    // ... (unchanged)
    const [name, setName] = useState(team.name);
    const [logo, setLogo] = useState(team.logo);
    // Deep copy players to avoid mutating context directly before save
    const [players, setPlayers] = useState(JSON.parse(JSON.stringify(team.players)));

    const handlePlayerChange = (idx, field, value) => {
        const newPlayers = [...players];
        if (field === 'personaName') newPlayers[idx].personaName = value;
        // Allows simple text editing for now. Full SteamID fetch in edit mode is complex, keeping it simple.
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

const Admin = () => {
    const { pendingTeams, approveTeam, rejectTeam, teams, deleteTeam, updateTeam, matchHistory, deleteMatch } = useTournament();
    const [editingTeam, setEditingTeam] = useState(null);
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

    if (!session) {
        return null; // Or a loading spinner
    }

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

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 style={{ marginBottom: '2rem' }}>Admin Panel</h1>

            {/* Admin Navigation Tabs */}
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
            </div>

            {editingTeam && (
                <EditTeamModal
                    team={editingTeam}
                    onClose={() => setEditingTeam(null)}
                    onSave={(updated) => updateTeam(updated.id, updated)}
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
                                                    <small style={{ color: '#aaa' }}>Registrovan: {new Date(team.registeredAt).toLocaleString()}</small>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button onClick={() => handleApprove(team.id)} className="btn" style={{ backgroundColor: '#4caf50', padding: '0.5rem 1.5rem' }}>Odobri</button>
                                                <button onClick={() => handleReject(team.id)} className="btn" style={{ backgroundColor: '#f44336', padding: '0.5rem 1.5rem' }}>Odbij</button>
                                            </div>
                                        </div>
                                        {/* Roster display simplified for brevity in this view if needed, keeping original complexity is fine */}
                                        <h4 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #444' }}>Roster</h4>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            {team.players.map((p, idx) => (
                                                <div key={idx} style={{ background: '#222', padding: '0.5rem', borderRadius: '4px', width: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <img src={p.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.personaName}</div>
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
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {teams.map(t => (
                                <li key={t.id} style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.02)',
                                    marginBottom: '0.5rem',
                                    borderRadius: '4px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <img src={t.logo} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{t.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button onClick={() => setEditingTeam(t)} className="btn" style={{ fontSize: '0.9rem', padding: '0.3rem 1rem' }}>Edit</button>
                                        <button onClick={() => handleDelete(t.id)} className="btn" style={{ fontSize: '0.9rem', padding: '0.3rem 1rem', background: '#f44336' }}>Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}

            {activeTab === 'results' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ color: 'var(--accent)', margin: 0 }}>Istorija Mečeva ({matchHistory.length})</h2>
                        <a href="/admin/upload" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ Upload New Match</a>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {matchHistory.length === 0 ? <p style={{ color: '#888' }}>No matches recorded yet.</p> : matchHistory.map((m, idx) => (
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
                                        ID: {m.matchId} | Winner: <span style={{ fontWeight: 'bold' }}>{m.winner}</span> | {new Date(m.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteMatch(m.matchId)}
                                    className="btn"
                                    style={{ fontSize: '0.9rem', padding: '0.3rem 1rem', background: '#f44336' }}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Admin;
