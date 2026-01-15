import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';


const Home = () => {
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY;
            const bg = document.querySelector('.parallax-bg');
            if (bg) {
                bg.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div>
            <SEOHead title="Home" description="Dobrodošli na DotaSrbija turnire. Prijavite svoj tim, pratite rezultate i statistiku." />
            {/* Hero Section */}
            {/* Hero Section with Parallax */}
            <section
                style={{
                    position: 'relative',
                    height: '80vh',
                    minHeight: '600px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginTop: '-64px' // Pull behind transparent navbar if needed
                }}
            >
                {/* Parallax Background */}
                <div
                    className="parallax-bg"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: 'url("https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/home/radiant_dire5.jpg")', // Reliable official CDN image
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: -1,
                        willChange: 'transform'
                    }}
                />

                {/* Gradient Overlay for Readability */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 50%, #000 100%)',
                    zIndex: 0
                }} />

                <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '5rem',
                        marginBottom: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '4px',
                        textShadow: '0 0 30px rgba(163, 51, 27, 0.6), 0 0 10px #000'
                    }}>
                        <span style={{ color: '#fff', display: 'block', fontSize: '2rem', letterSpacing: '8px', marginBottom: '0.5rem' }}>Dobrodošli u</span>
                        <span style={{
                            background: 'linear-gradient(to bottom, #fff 0%, #ccc 50%, #666 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.8))'
                        }}>Battleground</span>
                    </h1>

                    <div style={{ width: '100px', height: '4px', background: 'var(--dota-red)', margin: '2rem auto', boxShadow: '0 0 10px var(--dota-red)' }}></div>

                    <p style={{
                        fontSize: '1.4rem',
                        color: '#ddd',
                        marginBottom: '3rem',
                        maxWidth: '800px',
                        margin: '0 auto 3rem',
                        textShadow: '0 2px 4px #000'
                    }}>
                        Pridruži se eliti. Prijavi tim, dominiraj ligom i osvoji titulu šampiona regiona.
                    </p>

                    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
                        {/* Team Registration */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            width: '320px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <p style={{ fontSize: '1rem', color: '#ccc', marginBottom: '1rem' }}>Prijavljuješ se za turnir sa ekipom?</p>
                            <Link to="/register" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                                PRIJAVI EKIPU
                            </Link>
                        </div>

                        {/* Solo Registration */}
                        <div style={{
                            background: 'rgba(255, 165, 0, 0.05)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 165, 0, 0.2)',
                            backdropFilter: 'blur(10px)',
                            width: '320px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <p style={{ fontSize: '1rem', color: '#ccc', marginBottom: '1rem' }}>Prijavljuješ se solo za shuffle?</p>
                            <Link to="/shuffle" className="btn" style={{
                                width: '100%',
                                padding: '0.8rem',
                                background: 'linear-gradient(135deg, #ffa500, #ff6600)',
                                color: '#fff'
                            }}>
                                🎲 PRIJAVI SE SOLO
                            </Link>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <Link to="/tournaments" className="btn btn-secondary" style={{ opacity: 0.8 }}>
                            Gledaj turnire
                        </Link>
                    </div>
                </div>
            </section>

            {/* Floating Discord Button */}
            <a
                href="https://discord.gg/h9WpJHGG"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    zIndex: 1000,
                    background: '#5865f2',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(88, 101, 242, 0.4)',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
                className="discord-float-btn"
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(88, 101, 242, 0.6)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(88, 101, 242, 0.4)';
                }}
            >
                <span style={{ fontSize: '1.5rem' }}>💬</span>
                <span>PRIDRUŽI NAM SE NA DISKORDU!</span>
            </a>

            {/* Features / Info Grid */}
            <section className="container" style={{ padding: '4rem 1rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '3rem', color: '#fff' }}>Aktuelno</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
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
