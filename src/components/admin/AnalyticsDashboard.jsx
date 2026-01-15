import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const AnalyticsDashboard = () => {
    const [stats, setStats] = useState({ totalVisits: 0, uniqueVisitors: 0, avgDuration: 0 });
    const [recentVisits, setRecentVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // 1. Get recent visits for table
            const { data: visits, error: visitError } = await supabase
                .from('analytics_visits')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (visitError) throw visitError;

            setRecentVisits(visits || []);

            // 2. Get aggregate stats (simplified for performance)
            // Note: In a large app, use dedicated RPC/view or dedicated stats table. 
            // Fetching all count might be expensive if millions of rows.
            const { count: totalCount, error: countError } = await supabase
                .from('analytics_visits')
                .select('*', { count: 'exact', head: true });

            if (countError) throw countError;

            // Calculate unique visitors (client-side approximation for now or distinct query)
            // Supabase simpler unique query:
            // const { data: uniqueData } = await supabase.rpc('count_unique_visitors'); 
            // We'll stick to a simple estimation from the recent batch or separate query if possible.
            // For now, let's just use the recent visits uniqueness as a proxy or fetch a larger simplified dataset.

            // Getting AVG duration
            const { data: durationData, error: durationError } = await supabase
                .from('analytics_visits')
                .select('duration')
                .gt('duration', 0)
                .limit(1000); // Sample

            let avg = 0;
            if (durationData && durationData.length > 0) {
                const total = durationData.reduce((acc, curr) => acc + (curr.duration || 0), 0);
                avg = Math.round(total / durationData.length);
            }

            setStats({
                totalVisits: totalCount || 0,
                uniqueVisitors: 'N/A', // Requires distinct query
                avgDuration: avg
            });

        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = async () => {
        try {
            const { data, error } = await supabase
                .from('analytics_visits')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) {
                alert("No data to export");
                return;
            }

            // Convert to CSV
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
            const csvContent = "data:text/csv;charset=utf-8," + headers + '\n' + rows;

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `analytics_export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            alert('Export failed: ' + err.message);
        }
    };

    if (error) {
        return (
            <div className="card" style={{ padding: '2rem', border: '1px solid #f44336' }}>
                <h3 style={{ color: '#f44336' }}>Analytics Error</h3>
                <p>Could not load analytics data. Possible reasons:</p>
                <ul>
                    <li>Table <code>analytics_visits</code> does not exist.</li>
                    <li>Supabase credentials are invalid.</li>
                </ul>
                <p>Error details: {error}</p>
                <div style={{ marginTop: '1rem', background: '#333', padding: '1rem', borderRadius: '4px' }}>
                    <strong>Setup Instructions:</strong>
                    <p>Run the generated SQL script in your Supabase SQL Editor to create the table.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Visitor Analytics</h2>
                <button className="btn" style={{ background: '#4caf50' }} onClick={downloadCSV}>
                    📥 Export CSV
                </button>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>Total Visits</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalVisits}</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>Avg Time on Page</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{Math.floor(stats.avgDuration / 60)}m {stats.avgDuration % 60}s</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>Sample Size</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{recentVisits.length}</div>
                </div>
            </div>

            {/* Recent Visits Table */}
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ background: '#222', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Time</th>
                            <th style={{ padding: '1rem' }}>Page</th>
                            <th style={{ padding: '1rem' }}>Duration</th>
                            <th style={{ padding: '1rem' }}>Device</th>
                            <th style={{ padding: '1rem' }}>Screen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentVisits.map(v => (
                            <tr key={v.id} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '1rem' }}>{new Date(v.created_at).toLocaleString()}</td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#4caf50' }}>{v.path}</td>
                                <td style={{ padding: '1rem' }}>{v.duration}s</td>
                                <td style={{ padding: '1rem' }}>{v.device_type}</td>
                                <td style={{ padding: '1rem' }}>{v.screen_width}px</td>
                            </tr>
                        ))}
                        {recentVisits.length === 0 && !loading && (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
