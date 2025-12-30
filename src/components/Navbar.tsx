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
        <nav className="w-full h-auto py-6 border-b border-white/10 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 bg-black/80 backdrop-blur-md transition-all">
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
            <button onClick={toggleMenu} className="md:hidden z-[70] text-white p-2 relative">
                <div className="w-6 flex flex-col items-end gap-1.5">
                    <span className={`h-0.5 bg-white transition-all duration-300 ${isOpen ? 'w-6 rotate-45 translate-y-2' : 'w-6'}`} />
                    <span className={`h-0.5 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : 'w-4'}`} />
                    <span className={`h-0.5 bg-white transition-all duration-300 ${isOpen ? 'w-6 -rotate-45 -translate-y-2' : 'w-2'}`} />
                </div>
            </button>

            {/* Mobile Overlay */}
            <div className={`fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                {navLinks.map((item) => (
                    <Link
                        key={item}
                        href="/"
                        onClick={closeMenu}
                        className="text-2xl font-mono font-bold uppercase tracking-widest text-white hover:text-green-500 transition-colors"
                    >
                        {item}
                    </Link>
                ))}
                <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="mt-8 px-8 py-4 border border-green-500 text-green-500 font-mono text-sm tracking-widest uppercase hover:bg-green-500 hover:text-black transition-all"
                >
                    Admin Access
                </Link>
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
