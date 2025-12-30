import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full border-t border-white/10 bg-black pt-24 pb-12 px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">

                {/* Brand */}
                <div className="md:col-span-1">
                    <h3 className="text-white font-mono font-bold text-2xl mb-6 tracking-tighter">BLEXOUT</h3>
                    <p className="text-gray-500 font-mono text-xs leading-6">
                        Dominate the meta. <br />
                        Hardware. Software. Performance.
                    </p>
                </div>

                {/* Links */}
                <div>
                    <h4 className="text-white font-mono font-bold mb-6 tracking-widest text-xs uppercase">Hardware</h4>
                    <ul className="space-y-4 text-xs text-gray-500 font-mono">
                        <li><Link href="/" className="hover:text-green-500 transition-colors">Peripherals</Link></li>
                        <li><Link href="/" className="hover:text-green-500 transition-colors">Components</Link></li>
                        <li><Link href="/" className="hover:text-green-500 transition-colors">Setups</Link></li>
                        <li><Link href="/" className="hover:text-green-500 transition-colors">Audio</Link></li>
                    </ul>
                </div>

                {/* Legal */}
                <div>
                    <h4 className="text-white font-mono font-bold mb-6 tracking-widest text-xs uppercase">Legal</h4>
                    <ul className="space-y-4 text-xs text-gray-500 font-mono">
                        <li><Link href="#" className="hover:text-green-500 transition-colors">Privacy</Link></li>
                        <li><Link href="#" className="hover:text-green-500 transition-colors">Terms</Link></li>
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h4 className="text-white font-mono font-bold mb-6 tracking-widest text-xs uppercase">Initialize</h4>
                    <form className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="bg-transparent border-b border-gray-800 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 font-mono text-sm transition-colors"
                        />
                        <button className="text-left text-xs font-bold uppercase tracking-widest text-green-600 hover:text-white transition-colors font-mono">
                            Execute →
                        </button>
                    </form>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-gray-600 uppercase tracking-widest font-mono">
                <p>&copy; {new Date().getFullYear()} BLEXOUT. All Systems Nominal.</p>
                <div className="flex gap-8">
                    <span className="hover:text-green-500 cursor-pointer transition-colors">X / Twitter</span>
                    <span className="hover:text-green-500 cursor-pointer transition-colors">GitHub</span>
                </div>
            </div>
        </footer>
    );
}
