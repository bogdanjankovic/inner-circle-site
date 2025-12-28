import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="w-full h-24 border-b border-[#D4AF37]/20 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 bg-[#F5F2EA]/80 backdrop-blur-md transition-all">
            {/* Logo Area */}
            <Link href="/" className="flex items-center gap-4 group">
                <div className="relative w-14 h-14 transition-transform duration-700 ease-out group-hover:rotate-180">
                    {/* Ensure logo png handles light background or use distinct one. Assuming Gold logo matches. */}
                    <img src="/logo.png" alt="The Inner Circle" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                    <span className="text-charcoal font-serif font-bold tracking-widest text-xl leading-none group-hover:text-gold-500 transition-colors">INNER</span>
                    <span className="text-gray-500 text-[10px] font-sans font-medium tracking-[0.4em] uppercase mt-1">Circle</span>
                </div>
            </Link>

            {/* Desktop Links - Minimalist & Spacious */}
            <div className="hidden md:flex items-center gap-12">
                {['Align', 'Curate', 'Manifest', 'Ascend'].map((item) => (
                    <Link key={item} href="/" className="text-xs font-sans font-medium uppercase tracking-[0.2em] text-charcoal hover:text-gold-500 transition-colors">
                        {item}
                    </Link>
                ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-6">
                <Link href="/admin" className="text-[10px] font-bold tracking-widest text-gray-400 hover:text-gold-500 transition-colors">
                    MEMBER LOGIN
                </Link>
                <button className="hidden md:block bg-charcoal text-white px-8 py-3 rounded-none text-xs font-bold tracking-[0.2em] hover:bg-gold-500 transition-colors duration-300">
                    JOIN
                </button>
            </div>
        </nav>
    );
}
