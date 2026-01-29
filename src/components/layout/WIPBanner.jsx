import React from 'react';

const WIPBanner = () => {
    return (
        <div style={{
            background: 'repeating-linear-gradient(45deg, #a3331b, #a3331b 20px, #7a2210 20px, #7a2210 40px)',
            color: '#fff',
            textAlign: 'center',
            padding: '8px 20px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            borderBottom: '2px solid #551608',
            position: 'relative',
            zIndex: 1100,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
            <span style={{ fontSize: '1.2rem' }}>🚧</span>
            <span style={{ animation: 'pulse 2s infinite' }}>
                Sajt je u fazi izrade (Work In Progress) - Neke funkcije mogu biti nestabilne
            </span>
            <span style={{ fontSize: '1.2rem' }}>🚧</span>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.8; }
                    50% { opacity: 1; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
                    100% { opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

export default WIPBanner;
