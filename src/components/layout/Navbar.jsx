import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { name: 'Početna', path: '/' },
        { name: 'Turniri', path: '/tournaments' },
        { name: 'Timovi', path: '/teams' },
        { name: 'Igrači', path: '/players' },
        { name: 'Mečevi', path: '/matches' },
        { name: 'Rezultati', path: '/results' },
        { name: '🎲 Shuffle', path: '/shuffle', isOrange: true },
        { name: 'Prijava', path: '/register', isHighlight: true },
    ];

    const isActive = (path) => {
        return location.pathname === path ? { color: 'var(--accent)' } : {};
    };

    return (
        <nav style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', zIndex: 1000 }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>

                {/* Logo */}
                <Link to="/" style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', fontWeight: 'bold', letterSpacing: '2px' }}>
                    <span style={{ color: '#fff' }}>DOTA</span><span style={{ color: 'var(--accent)' }}>SRBIJA</span>
                </Link>

                {/* Desktop Menu */}
                <div className="desktop-menu">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={link.isHighlight ? 'btn' : 'nav-link'}
                            style={{
                                ...(!link.isHighlight && !link.isOrange ? isActive(link.path) : {}),
                                ...(link.isOrange ? { color: '#ffa500', fontWeight: 'bold' } : {})
                            }}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Mobile Toggle */}
                <div className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X color="white" /> : <Menu color="white" />}
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '1rem' }} className="mobile-menu">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            className={link.isHighlight ? 'btn' : 'nav-link'}
                            style={{ display: 'block', margin: '0.5rem 0', textAlign: 'center', ...(!link.isHighlight ? isActive(link.path) : {}) }}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
            )}

            {/* Inline Styles for simplicity in this file for responsive overrides */}
            <style>{`
        .desktop-menu { display: flex; gap: 1.5rem; align-items: center; height: 100%; }
        .mobile-toggle { display: none; cursor: pointer; }
        .nav-link { 
            font-weight: 600; 
            text-transform: uppercase; 
            font-size: 0.9rem; 
            letter-spacing: 0.5px; 
            display: flex;
            align-items: center;
            height: 100%;
        }
        .nav-link:hover { color: var(--accent); }

        @media (max-width: 968px) {
          .desktop-menu { display: none; }
          .mobile-toggle { display: block; }
        }
      `}</style>
        </nav>
    );
};

export default Navbar;
