'use client';

import Link from "next/link";
import { useState } from "react";
import GlitchText from "@/components/GlitchText";
import { Article } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
    articles?: Article[];
}

export default function Navbar({ articles = [] }: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const navLinks = ['Hardware', 'Industry', 'Reviews', 'Guides'];

    // Filter articles for the hovered category
    const relevantArticles = hoveredCategory
        ? articles.filter(a => a.tags?.some(tag => tag.toLowerCase() === hoveredCategory.toLowerCase())).slice(0, 3)
        : [];

    return (
        <nav
            className="w-full h-auto py-5 border-b border-white/10 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 bg-black/90 backdrop-blur-md transition-all group/nav"
            onMouseLeave={() => setHoveredCategory(null)}
        >
            {/* Logo Area */}
            <Link href="/" className="flex items-center gap-4 z-50 relative" onClick={closeMenu}>
                <div className="relative h-12 w-auto transition-opacity duration-300 hover:opacity-80">
                    <img src="/logo.png" alt="BLEXOUT" className="h-full w-auto object-contain" />
                </div>
            </Link>

            {/* Desktop Links with Mega Menu Hook */}
            <div className="hidden md:flex items-center h-full">
                {navLinks.map((item) => (
                    <div
                        key={item}
                        className="relative h-full flex items-center px-6 py-4 cursor-pointer"
                        onMouseEnter={() => setHoveredCategory(item)}
                    >
                        <Link href={`/tag/${item.toLowerCase()}`} className="text-sm font-bold font-mono uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                            <GlitchText text={item} />
                        </Link>
                    </div>
                ))}
            </div>

            {/* MEGA MENU DROPDOWN */}
            <AnimatePresence>
                {hoveredCategory && relevantArticles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-full bg-black/95 border-b border-white/10 shadow-2xl backdrop-blur-xl z-40 overflow-hidden"
                        onMouseEnter={() => setHoveredCategory(hoveredCategory)}
                        onMouseLeave={() => setHoveredCategory(null)}
                    >
                        <div className="max-w-7xl mx-auto px-12 py-8">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-4xl font-black text-white/10 uppercase font-sans tracking-tighter">{hoveredCategory}</h3>
                                <Link href={`/tag/${hoveredCategory.toLowerCase()}`} className="text-xs font-mono text-green-500 hover:text-green-400 uppercase tracking-widest">
                                    View All {hoveredCategory} &rarr;
                                </Link>
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                                {relevantArticles.map((article) => (
                                    <Link key={article.slug} href={`/article/${article.slug}`} className="group block">
                                        <div className="relative aspect-video mb-4 overflow-hidden rounded-sm border border-white/10 group-hover:border-green-500/50 transition-colors">
                                            {article.imageUrl && (
                                                <img
                                                    src={article.imageUrl}
                                                    alt={article.title}
                                                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-100"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            <div className="absolute bottom-2 left-2">
                                                <span className="text-[10px] font-mono text-green-500 bg-black/80 px-1 py-0.5 border border-green-500/30">
                                                    {article.readTime || article.readingTime || '5 MIN'} READ
                                                </span>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-200 group-hover:text-green-400 transition-colors leading-tight mb-2 font-mono">
                                            {article.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            {article.excerpt}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
            <div className={`fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                {navLinks.map((item) => (
                    <Link
                        key={item}
                        href={`/tag/${item.toLowerCase()}`}
                        onClick={closeMenu}
                        className="text-2xl font-black font-sans uppercase tracking-tighter text-white hover:text-green-500 transition-colors"
                    >
                        {item}
                    </Link>
                ))}
                <div className="mt-8 text-xs font-mono text-gray-500">
                    // SYSTEM STATUS: ONLINE
                </div>
            </div>

            {/* CTA (Desktop) */}
            <div className="hidden md:flex items-center gap-6">
                <button className="bg-white text-black px-6 py-2 border border-white hover:bg-black hover:text-white hover:border-green-500 text-xs font-bold font-mono tracking-widest transition-all duration-300">
                    <GlitchText text="ACCESS" />
                </button>
            </div>
        </nav>
    );
}
