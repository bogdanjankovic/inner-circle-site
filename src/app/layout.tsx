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
    title: "BLEXOUT | High-Performance Optimization",
    description: "Data-driven strategies for wealth, health, and workspace.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${mono.variable} ${montserrat.variable} antialiased bg-black text-gray-200 selection:bg-green-500 selection:text-black`}>
                <div className="fixed inset-0 -z-10 bg-black">
                    {/* Tech Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>

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
