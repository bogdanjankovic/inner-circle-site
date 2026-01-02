
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | BLEXOUT',
    description: 'Privacy Policy for BLEXOUT.',
    robots: {
        index: false,
        follow: true
    }
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto font-sans text-gray-300">
            <h1 className="text-4xl font-black text-white mb-8 border-b border-white/10 pb-6 uppercase tracking-tight">Privacy Policy</h1>

            <div className="prose prose-invert prose-lg max-w-none">
                <p className="lead text-xl text-gray-400">
                    Effective Date: {new Date().getFullYear()}-01-01
                </p>

                <p>
                    BLEXOUT ("Protocol", "we", "us") respects your privacy. This policy outlines how we handle data.
                </p>

                <h3>1. Data Collection</h3>
                <p>
                    We collect minimal data to improve system performance.
                    <strong> Protocol Metrics</strong>: We track page views, geographical region (City/Country), and session duration anonymously.
                    No personally identifiable information (PII) is stored without explicit consent (e.g., Newsletter Signup).
                </p>

                <h3>2. Cookies & Local Storage</h3>
                <p>
                    We use local storage for user preferences (UI state, read progress). Third-party vendors, including Google, use cookies to serve ads based on your prior visits.
                </p>

                <h3>3. Third-Party Links</h3>
                <p>
                    BLEXOUT participates in affiliate marketing programs. Clicking on outgoing links to hardware or software vendors may track your click for commission attribution. We do not control these external sites.
                </p>

                <h3>4. Rights via GDPR/CCPA</h3>
                <p>
                    You have the right to request deletion of your data. Contact `admin@blexout.com` for inquiries.
                </p>

                <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-lg">
                    <p className="text-sm font-mono text-gray-500 mb-0">
                        System ID: PRIVACY-{new Date().getFullYear()} // END OF FILE
                    </p>
                </div>
            </div>
        </div>
    );
}
