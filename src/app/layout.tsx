import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google"; // Import Google Fonts
import "./globals.css";
import ConsentBanner from "@/components/ConsentBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/context/ToastContext";

// Configure Fonts
const cormorant = Cormorant_Garamond({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-cormorant",
    display: 'swap',
});

const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
    variable: "--font-montserrat",
    display: 'swap',
});

export const metadata: Metadata = {
    title: "The Inner Circle",
    description: "Exclusive insights and energetic alignment.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${cormorant.variable} ${montserrat.variable} antialiased bg-[#F5F2EA] text-[#1A1A1A]`}>
                {/* 
                  Base Background: Champagne Cream (#F5F2EA) 
                  Base Text: Soft Charcoal (#1A1A1A) 
                */}
                <div className="fixed inset-0 -z-10 bg-[#F5F2EA]">
                    {/* Subtle Mystical Gradient - muted for luxury */}
                    <div className="absolute top-0 right-0 w-[60%] h-[60%] rounded-full bg-[#D4AF37]/5 blur-[150px]" />
                    <div className="absolute bottom-0 left-0 w-[60%] h-[60%] rounded-full bg-[#9DC183]/10 blur-[150px]" />
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
