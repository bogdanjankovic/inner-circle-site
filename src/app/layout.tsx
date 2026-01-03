import type { Metadata } from "next";
import { JetBrains_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import ConsentBanner from "@/components/ConsentBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/context/ToastContext";
import { ModalProvider } from "@/context/ModalContext";
import ModalContainer from "@/components/ui/ModalContainer";
import { getPublishedPosts } from "@/lib/storage";

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

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const articles = await getPublishedPosts();

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${mono.variable} ${montserrat.variable} antialiased text-gray-200 selection:bg-green-500 selection:text-black bg-transparent`}>
                <div className="relative z-10">
                    <ToastProvider>
                        <ModalProvider>
                            <Navbar articles={articles} />

                            <div className="pt-0 min-h-screen font-sans">
                                {children}
                            </div>

                            <Footer />
                            <ModalContainer />
                        </ModalProvider>
                    </ToastProvider>
                </div>
                <ConsentBanner />
            </body>
        </html>
    );
}
