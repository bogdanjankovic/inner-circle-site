import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | BLEXOUT',
    description: 'Privacy Policy and Terms of Service for BLEXOUT.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 bg-black text-gray-300 font-sans">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="text-4xl font-mono font-bold mb-12 text-white">Privacy Policy</h1>

                <div className="prose prose-invert prose-green max-w-none">
                    <p className="text-sm font-mono text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

                    <section className="mb-12">
                        <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
                        <p>
                            Welcome to BLEXOUT ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                            This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-xl font-bold text-white mb-4">2. Affiliate Disclosure</h2>
                        <p className="p-4 border border-green-500/20 bg-green-500/5 rounded">
                            <strong>FTC Disclosure:</strong> BLEXOUT participates in the Amazon Services LLC Associates Program and other affiliate advertising programs.
                            If you click on a link to a product and make a purchase, we may earn a small commission at no extra cost to you.
                            This supports our testing and editorial work.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-xl font-bold text-white mb-4">3. Advertising & Cookies</h2>
                        <p>
                            We may use third-party advertising companies (such as Google AdSense) to serve ads when you visit the Site.
                            These companies may use cookies to understand your interests and serve ads about goods and services of interest to you.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li><strong>Google AdSense:</strong> Google uses cookies (including the DoubleClick cookie) to serve ads based on your visit to our site and other sites on the Internet.</li>
                            <li><strong>Opt-Out:</strong> You may opt out of the use of the DoubleClick cookie for interest-based advertising by visiting <a href="https://about.ads.microsoft.com/en-us/resources/policies/personalized-ads" className="text-green-500 hover:underline">Ads Settings</a>.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-xl font-bold text-white mb-4">4. Analytics</h2>
                        <p>
                            We use proprietary analytics to track basic visitor data (country, page views, duration) to improve our content. This data is anonymized and stored securely.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
