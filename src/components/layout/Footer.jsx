import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '3rem 0', marginTop: 'auto' }}>
            <div className="container" style={{ textAlign: 'center' }}>
                <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Dota Srbija Liga</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
                    Najveća amaterska i profesionalna Dota 2 zajednica u regionu. Prijavi se, takmiči se i osvoji vredne nagrade.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <Link to="/about" style={{ color: 'var(--text-muted)' }}>O nama</Link>
                    <Link to="/rules" style={{ color: 'var(--text-muted)' }}>Pravila</Link>
                    <Link to="/organization" style={{ color: 'var(--text-muted)' }}>Organizacija</Link>
                    <a href="#" style={{ color: 'var(--text-muted)' }}>Kontakt</a>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#555' }}>
                    &copy; {new Date().getFullYear()} Dota Srbija. Not affiliated with Valve Corp.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
