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

                    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                        <Link to="/register" className="btn btn-primary" style={{ transform: 'scale(1.1)' }}>
                            Prijavi ekipu
                        </Link>
                        <Link to="/tournaments" className="btn btn-secondary">
                            Gledaj turnire
                        </Link>
                    </div>
                </div>
            </section>

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
