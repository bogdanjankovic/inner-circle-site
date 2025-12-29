import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="w-full h-auto py-6 border-b border-white/10 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 bg-black/80 backdrop-blur-md transition-all">
            {/* Logo Area */}
            {/* Logo Area */}
            <Link href="/" className="flex items-center gap-4 group">
                <div className="relative h-16 w-auto transition-opacity duration-300 hover:opacity-80">
                    <img src="/logo.png" alt="BLEXOUT" className="h-full w-auto object-contain" />
                </div>
            </Link>

            {/* Desktop Links - Minimalist & Spacious */}
            <div className="hidden md:flex items-center gap-8">
                {['Stack', 'Systems', 'Wealth', 'Bio'].map((item) => (
                    <Link key={item} href="/" className="text-[10px] font-mono font-medium uppercase tracking-widest text-gray-400 hover:text-green-500 transition-colors">
                        {item}
                    </Link>
                ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-6">
                {/* Admin link hidden for public */}
                <button className="hidden md:block bg-white text-black px-6 py-2 border border-white hover:bg-black hover:text-white hover:border-green-500 text-[10px] font-bold font-mono tracking-widest transition-all duration-300">
                    ACCESS
                </button>
            </div>
        </nav>
    );
}
