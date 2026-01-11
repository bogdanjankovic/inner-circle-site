
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | BLEXOUT',
    description: 'Terms of Service for BLEXOUT.',
    robots: {
        index: false,
        follow: true
    }
};

export default function TermsPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto font-sans text-gray-300">
            <h1 className="text-4xl font-black text-white mb-8 border-b border-white/10 pb-6 uppercase tracking-tight">Terms of Service</h1>

            <div className="prose prose-invert prose-lg max-w-none">
                <p className="lead text-xl text-gray-400">
                    By accessing BLEXOUT, you agree to these terms.
                </p>

                <h3>1. Introduction</h3>
                <p>
                    BLEXOUT ("Protocol") provides information on biohacking, tech, and productivity. All content is for informational purposes only.
                </p>

                <h3>2. Logic & Liability</h3>
                <p>
                    <strong>We are not financial or medical advisors.</strong> Any strategies or hardware configurations discussed are theoretical or personal anecdotes. Usage of information is at your own risk. BLEXOUT is not liable for data loss, hardware damage, or financial loss.
                </p>

                <h3>3. Intellectual Property</h3>
                <p>
                    All content, including the "Protocol" branding and text, is owned by BLEXOUT. You may not scrape, republish, or sell our data without permission.
                </p>

                <h3>4. Affiliate Disclosure</h3>
                <p>
                    We participate in affiliate programs. We earn commissions on qualifying purchases made through our links. This does not affect your price.
                </p>

                <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-lg">
                    <p className="text-sm font-mono text-gray-500 mb-0">
                        System ID: TERMS-{new Date().getFullYear()} // END OF FILE
                    </p>
                </div>
            </div>
        </div>
    );
}
