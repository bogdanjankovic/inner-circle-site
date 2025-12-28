import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full border-t border-[#D4AF37]/20 bg-[#F0EEE6] pt-24 pb-12 px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">

                {/* Brand */}
                <div className="md:col-span-1">
                    <h3 className="text-charcoal font-serif italic text-2xl mb-6">The Inner Circle</h3>
                    <p className="text-gray-600 font-sans text-sm leading-8 font-light">
                        Curating the frequency of abundance. <br />
                        Energy. Aesthetics. Alignment.
                    </p>
                </div>

                {/* Links */}
                <div>
                    <h4 className="text-charcoal font-serif font-bold mb-6 tracking-widest text-sm uppercase">Curated</h4>
                    <ul className="space-y-4 text-sm text-gray-500 font-sans font-light">
                        <li><Link href="/" className="hover:text-gold-500 transition-colors">Aura Reports</Link></li>
                        <li><Link href="/" className="hover:text-gold-500 transition-colors">Manifestation</Link></li>
                        <li><Link href="/" className="hover:text-gold-500 transition-colors">High-Vibration Living</Link></li>
                        <li><Link href="/" className="hover:text-gold-500 transition-colors">The Vault</Link></li>
                    </ul>
                </div>

                {/* Legal */}
                <div>
                    <h4 className="text-charcoal font-serif font-bold mb-6 tracking-widest text-sm uppercase">Protocol</h4>
                    <ul className="space-y-4 text-sm text-gray-500 font-sans font-light">
                        <li><Link href="#" className="hover:text-gold-500 transition-colors">Privacy</Link></li>
                        <li><Link href="#" className="hover:text-gold-500 transition-colors">Terms of Alignment</Link></li>
                        <li><Link href="#" className="hover:text-gold-500 transition-colors">Cookie Manage</Link></li>
                        <li><Link href="#" className="hover:text-gold-500 transition-colors">Partnerships</Link></li>
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h4 className="text-charcoal font-serif font-bold mb-6 tracking-widest text-sm uppercase">Join The Frequency</h4>
                    <form className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="bg-transparent border-b border-gray-400 py-2 text-charcoal placeholder-gray-400 focus:outline-none focus:border-gold-500 font-serif italic text-lg transition-colors"
                        />
                        <button className="text-left text-xs font-bold uppercase tracking-[0.2em] text-gold-600 hover:text-charcoal transition-colors">
                            Claim Access →
                        </button>
                    </form>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-[#D4AF37]/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-gray-400 uppercase tracking-widest">
                <p>&copy; {new Date().getFullYear()} The Inner Circle. Est. 2025.</p>
                <div className="flex gap-8">
                    <span className="hover:text-gold-500 cursor-pointer transition-colors">Instagram</span>
                    <span className="hover:text-gold-500 cursor-pointer transition-colors">Pinterest</span>
                    <span className="hover:text-gold-500 cursor-pointer transition-colors">TikTok</span>
                </div>
            </div>
        </footer>
    );
}
