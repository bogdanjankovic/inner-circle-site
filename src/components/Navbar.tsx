'use client';

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import GlitchText from "@/components/GlitchText";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const navLinks = ['Hardware', 'Industry', 'Reviews', 'Guides'];

    return (
        <nav className="w-full h-auto py-6 border-b border-white/10 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 bg-black transition-all">
            {/* Logo Area */}
            <Link href="/" className="flex items-center gap-4 group z-50" onClick={closeMenu}>
                <div className="relative h-16 w-auto transition-opacity duration-300 hover:opacity-80">
                    <img src="/logo.png" alt="BLEXOUT" className="h-full w-auto object-contain" />
                </div>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
                {navLinks.map((item) => (
                    <Link key={item} href="/" className="text-[10px] font-mono font-medium uppercase tracking-widest text-gray-400 hover:text-green-500 transition-colors">
                        <GlitchText text={item} />
                    </Link>
                ))}
            </div>

            {/* Mobile Menu Toggle */}
            <button onClick={toggleMenu} className="md:hidden z-[70] group relative px-4 py-2 bg-black/50 border border-green-500/30 hover:border-green-500 hover:bg-green-500/10 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                        <span className={`block w-1 h-1 bg-green-500 rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
                        <span className={`block w-1 h-1 bg-green-500 rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100 delay-75'}`} />
                        <span className={`block w-1 h-1 bg-green-500 rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100 delay-100'}`} />
                    </div>
                    <span className="font-mono text-xs font-bold text-green-500 tracking-widest uppercase">
                        {isOpen ? 'CLOSE ::' : 'MENU ::'}
                    </span>
                    {/* X Icon overlay for open state */}
                    {isOpen && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4">
                            <span className="absolute top-1/2 left-0 w-full h-0.5 bg-green-500 rotate-45 transform origin-center" />
                            <span className="absolute top-1/2 left-0 w-full h-0.5 bg-green-500 -rotate-45 transform origin-center" />
                        </div>
                    )}
                </div>
            </button>

            {/* Mobile Overlay */}
            <div className={`absolute top-full left-0 w-full bg-black border-b border-green-500/20 shadow-2xl z-[60] flex flex-col items-center gap-6 py-8 transition-all duration-300 md:hidden origin-top mt-2 ${isOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible'}`}>
                {navLinks.map((item) => (
                    <Link
                        key={item}
                        href="/"
                        onClick={closeMenu}
                        className="text-lg font-mono font-bold uppercase tracking-widest text-white hover:text-green-500 transition-colors"
                    >
                        {item}
                    </Link>
                ))}
            </div>

            {/* CTA (Desktop) */}
            <div className="hidden md:flex items-center gap-6">
                <button className="bg-white text-black px-6 py-2 border border-white hover:bg-black hover:text-white hover:border-green-500 text-[10px] font-bold font-mono tracking-widest transition-all duration-300">
                    <GlitchText text="ACCESS" />
                </button>
            </div>
        </nav>
    );
}
