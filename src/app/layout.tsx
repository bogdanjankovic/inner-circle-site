import type { Metadata } from "next";
import { JetBrains_Mono, Montserrat } from "next/font/google"; // Import Google Fonts
import "./globals.css";
import ConsentBanner from "@/components/ConsentBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/context/ToastContext";

// Configure Fonts
const mono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: 'swap',
});

const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
    variable: "--font-montserrat",
    display: 'swap',
});

export const metadata: Metadata = {
    title: "BLEXOUT | Elite Hardware & Game Analysis",
    description: "The protocol for gaming performance. In-depth hardware reviews, game optimization guides, and no-nonsense tech analysis.",
    metadataBase: new URL('https://blexout.com'),
    openGraph: {
        siteName: 'BLEXOUT',
        type: 'website',
        locale: 'en_US',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${mono.variable} ${montserrat.variable} antialiased text-gray-200 selection:bg-green-500 selection:text-black bg-black`}>
                <ToastProvider>
                    <Navbar />

                    <div className="pt-0 min-h-screen font-sans">
                        {children}
                    </div>

                    <Footer />
                </ToastProvider>
                <ConsentBanner />
            </body>
        </html>
    );
}
