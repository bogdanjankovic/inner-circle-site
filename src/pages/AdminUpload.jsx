import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';

const AdminUpload = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState(null);
    const { dispatch } = useTournament();
    const navigate = useNavigate();

    const handleUpload = () => {
        try {
            const matchData = JSON.parse(jsonInput);

            // Basic validation
            if (!matchData.matchId && !matchData.players) {
                throw new Error("Invalid match data format. Missing matchId or players.");
            }

            // Dispatch to context
            dispatch({ type: 'ADD_MATCH', payload: matchData });

            alert("Match uploaded successfully!");
            navigate('/matches');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem', color: 'var(--accent)' }}>Admin: Upload Match Stats (Local)</h1>

            <div className="card" style={{ padding: '2rem' }}>
                <p style={{ marginBottom: '1rem', color: '#ccc' }}>
                    Paste the JSON output from your local parser script here.
                </p>

                {error && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(255, 0, 0, 0.1)',
                        border: '1px solid red',
                        color: '#ff6b6b',
                        marginBottom: '1rem',
                        borderRadius: '4px'
                    }}>
                        Error: {error}
                    </div>
                )}

                <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='{ "matchId": 123, "winner": "Radiant", "players": [...] }'
                    style={{
                        width: '100%',
                        height: '300px',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        backgroundColor: '#111',
                        color: '#0f0',
                        border: '1px solid #333',
                        padding: '1rem',
                        marginBottom: '1rem'
                    }}
                />

                <button onClick={handleUpload} className="btn btn-primary" style={{ width: '100%' }}>
                    Save Match Data
                </button>
            </div>
        </div>
    );
};

export default AdminUpload;
