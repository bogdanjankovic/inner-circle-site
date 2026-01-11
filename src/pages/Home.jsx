import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div>
            {/* Hero Section */}
            <section style={{
                minHeight: '600px',
                display: 'flex',
                alignItems: 'center',
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota2_social.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>
                        <span style={{ color: 'var(--accent)' }}>Dokaži se</span> na bojnom polju
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '2rem', maxWidth: '700px', margin: '0 auto 2rem' }}>
                        Prijavi svoj tim za najveću regionalnu Dota 2 ligu. Prati rezultate, statistiku i osvoji vredne nagrade.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/register" className="btn" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
                            Prijavi ekipu
                        </Link>
                        <Link to="/tournaments" className="btn" style={{ background: 'var(--bg-card)', borderColor: '#fff' }}>
                            Gledaj turnire
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features / Info Grid */}
            <section className="container" style={{ padding: '4rem 1rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '3rem', color: '#fff' }}>Aktuelno</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div className="card">
                        <h3 style={{ color: 'var(--accent)' }}>Sezona 1</h3>
                        <p>Prijave su otvorene za prvu sezonu naše lige. Fond nagrada 1000€.</p>
                        <Link to="/tournaments" style={{ marginTop: '1rem', display: 'inline-block', color: 'var(--accent)' }}>Saznaj više &rarr;</Link>
                    </div>
                    <div className="card">
                        <h3>Najbolji Timovi</h3>
                        <p>Pogledaj rang listu najboljih ekipa u regionu i njihovu statistiku.</p>
                        <Link to="/teams" style={{ marginTop: '1rem', display: 'inline-block', color: 'var(--accent)' }}>Pogledaj rang listu &rarr;</Link>
                    </div>
                    <div className="card">
                        <h3>Fantasy liga</h3>
                        <p>Uskoro! Napravi svoj tim od igrača iz lige i osvoji poene.</p>
                        <span style={{ marginTop: '1rem', display: 'inline-block', color: '#666' }}>Uskoro...</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
