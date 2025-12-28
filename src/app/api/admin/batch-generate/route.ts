
import { NextResponse } from 'next/server';
import { generateArticle } from '@/lib/ai-service';
import { savePost } from '@/lib/storage';

// 20 Article Topics
const TOPICS = [
    // Astro-Style
    "The Venus Transit: Why you need to update your jewelry box before the 15th to attract romance",
    "Mercury Retrograde Survival Kit: 5 Amazon tech accessories to keep your energy grounded",
    "Big Leo Energy: The gold statement pieces you need to manifest your Main Character era",
    "Saturn Return Style: How to transition your wardrobe from Fast Fashion to Legacy Luxury effortlessly",
    "Rising Sign Radiance: The specific earring shape that highlights your natural aura based on your birth chart",

    // Luxury Dupe
    "The Quiet Luxury Secret: 7 Amazon finds that look like they cost $5,000 (and no one will know)",
    "Found on Fifth Ave, Bought on Amazon: The Old Money watch aesthetic for under $40",
    "The 2026 It-Bag Predicition: Why this $30 Amazon tote is about to go viral on TikTok",
    "Steal the Glow: The jewelry dupes spotted on celebrities at the Met Gala",
    "The Clean Girl Starter Pack: Minimalist Amazon jewelry that screams I have my life together",

    // Manifestation & Vibe
    "Quantum Leaping via Style: How wearing Success Symbols can actually shift your income bracket",
    "The Evil Eye Protection Guide: Why celebrities are suddenly wearing this ancient symbol again",
    "Bedroom Feng Shui: High-vibration Amazon decor to turn your room into a manifestation sanctuary",
    "Color Theory for Clout: Which hues you should wear in your next Instagram post to boost engagement",
    "The Abundance Ritual: Why charging your Amazon crystals under the full moon is a non-negotiable",

    // Social Status
    "Gatekeeping No More: The Under-the-Radar Amazon brands that fashion influencers are trying to hide",
    "Airplane Mode Aesthetic: The luxury loungewear sets for your next Private Jet vibe photo op",
    "The Yacht Club Look: How to style Amazon pearls for a timeless, high-society summer",
    "Office Siren 2.0: Updating your professional look with High-Vibration eyewear and accessories",
    "The Unboxing Experience: Why these specific Amazon jewelry brands have the most Instagrammable packaging"
];

export async function GET() {
    console.log("Starting Batch Generation...");

    const results = [];

    // We'll do them one by one to avoid hitting rate limits too hard, 
    // although 20 might still take a while (20 * 10s = 200s). 
    // Vercel/Nextjs timeouts are usually 10-60s. 
    // We might need to split this or just hope for the best in dev mode.

    for (const topic of TOPICS) {
        try {
            console.log(`Generating: ${topic}`);
            const article = await generateArticle(topic);
            await savePost(article);
            results.push({ topic, status: 'success', slug: article.slug });
        } catch (e) {
            console.error(`Failed to generate ${topic}`, e);
            results.push({ topic, status: 'error', error: String(e) });
        }
    }

    return NextResponse.json({ summary: "Batch Generation Complete", results });
}
