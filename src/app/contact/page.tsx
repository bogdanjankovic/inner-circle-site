import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact | BLEXOUT',
    description: 'Get in touch with the BLEXOUT editorial team.',
};

export default function ContactPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 bg-black text-gray-300 font-sans">
            <div className="max-w-2xl mx-auto px-6 text-center">
                <h1 className="text-4xl font-mono font-bold mb-8 text-white">Contact Protocol</h1>

                <p className="text-lg text-gray-400 mb-12">
                    Have a tip? Want to request a review? <br />
                    Signal needed.
                </p>

                <div className="inline-block p-8 border border-white/10 bg-white/5 rounded-lg text-left w-full max-w-md">
                    <div className="mb-6">
                        <h3 className="font-mono text-xs uppercase tracking-widest text-green-500 mb-2">Editorial Inquiries</h3>
                        <a href="mailto:editor@blexout.com" className="text-xl text-white hover:text-green-400 transition-colors">
                            editor@blexout.com
                        </a>
                    </div>

                    <div>
                        <h3 className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-2">Business / Partnerships</h3>
                        <a href="mailto:partners@blexout.com" className="text-xl text-white hover:text-green-400 transition-colors">
                            partners@blexout.com
                        </a>
                    </div>
                </div>

                <p className="mt-12 text-xs font-mono text-gray-600">
                    Response times vary based on current workload. <br />
                    Priority given to tips regarding upcoming hardware releases.
                </p>
            </div>
        </div>
    );
}
