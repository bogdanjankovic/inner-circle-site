import { Article } from "./types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { getRandomImage } from "./images";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

async function searchWeb(query: string): Promise<string> {
    try {
        const config = {
            method: 'post',
            url: 'https://google.serper.dev/search',
            headers: {
                'X-API-KEY': process.env.SERPER_API_KEY,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                "q": query
            })
        };

        const response = await axios.request(config);
        // Extract snippets from organic results
        const results = response.data.organic || [];
        // @ts-ignore
        const snippets = results.map((result: any) =>
            `Title: ${result.title}\nSource: ${result.link}\nSummary: ${result.snippet}`
        ).join("\n\n");

        return snippets.slice(0, 4000); // Limit context window
    } catch (error) {
        console.error("Search error:", error);
        return "No recent search data available.";
    }
}

async function searchImages(query: string): Promise<string | null> {
    try {
        const config = {
            method: 'post',
            url: 'https://google.serper.dev/images',
            headers: {
                'X-API-KEY': process.env.SERPER_API_KEY,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                "q": query,
                "num": 1
            })
        };

        const response = await axios.request(config);
        const images = response.data.images || [];
        if (images.length > 0) {
            return images[0].imageUrl;
        }
        return null;
    } catch (error) {
        console.error("Image Search error:", error);
        return null;
    }
}


async function generateImage(prompt: string): Promise<string | null> {
    try {
        console.log(`[AI-Service] Generating image for: ${prompt}`);

        // TODO: CONNECT TO REAL API (Banana / Replicate / Flux)
        // For now, this is a placeholder that requires the user's API Key/URL

        // MOCK IMPLEMENTATION (Simulates successful generation):
        // In reality, this would be an axios.post() to the generation provider
        // return "https://generated-image-url.com/image.png";

        console.warn("Image Generation API not configured yet.");
        return null;

    } catch (error) {
        console.error("Image Generation error:", error);
        return null;
    }
}

// TOGGLE: Choose 'SEARCH' or 'GENERATE'
const IMAGE_SOURCE: 'SEARCH' | 'GENERATE' = 'SEARCH';

async function getImage(query: string): Promise<string | null> {
    if (IMAGE_SOURCE === 'GENERATE') {
        // Enforce style consistency for generated images here
        const enhancedPrompt = `cinematic shot of ${query}, hyper-realistic, 8k, unreal engine 5 render, dramatic lighting, detailed texture`;
        return await generateImage(enhancedPrompt);
    } else {
        return await searchImages(query);
    }
}

export async function generateArticle(topic: string): Promise<Article> {
    console.log(`[AI-Service] Starting generation for: ${topic}`);
    // 1. Search the web for real context
    const searchContext = await searchWeb(topic);
    console.log(`[AI-Service] Search context found: ${searchContext.length} chars`);

    // 2. Generate content with Gemini
    const prompt = `
  Role: You are 'BLEXOUT', an elite Gaming Analyst and Tech Industry Insider.
  Tone: Knowledgeable, Opinionated, Spec-Focused but Atmospheric.
  Voice: "The machine must serve the experience." Balance raw metrics (FPS/Thermals) with "Game Feel," "Immersion," and "Artistic Impact."
  Constraint: Avoid generic praise. If a game has "soul," explain WHY (Sound design, pacing, environmental storytelling). If it feels "hollow" despite good graphics, say so.
  
  Task: Write a comprehensive review or analysis about "${topic}".
  
  CONTEXT from the web:
  ${searchContext}

  STYLE GUIDE:
  - **Headlines**: 
      - Hardware: "The Ultimate Guide to [Topic]" or "[Product] Review: Is it Worth It?"
      - Games: "The [Game Name] Protocol: Performance & Impressions" or "[Game Name] Review: A Hollow Shell or A Masterpiece?"
  - **The Hook**: Start with the *feeling* or the problem (e.g. "It felt like 2005 again, in the best way possible.").
  - **Logic**: Use technical terms (Latency, Ray Tracing) BUT explain how they impact the *feel* (e.g. "The stuttering breaks the immersion completely").
  - **Products**: RECOMMEND SPECIFIC GEAR. "Best X for Y".
  - **Visuals**: Provide precise, modern, gaming-tech 'imageSearchQuery' (e.g. "Cyberpunk 2077 rain reflection neon").
  
  CRITICAL CONSTRAINT: 
  - Do NOT use markdown bolding (**) for product names. Keep them plain text.
  - Link them if possible, but do not bold them.

  CRITICAL CONSTRAINT: 
  - Do NOT use markdown bolding (**) for product names. Keep them plain text.
  - Link them if possible, but do not bold them.

  FORMAT:
  - Return ONLY strict JSON.
  - JSON Schema:
  {
    "title": "A precise, outcome-focused headline",
    "excerpt": "A direct summary of the optimization.",
    "tags": ["Tag1", "Tag2"],
    "readingTime": "5 min read",
    "imageSearchQuery": "Minimalist tech or lab aesthetic cover image",
    "date": "${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}",
    "keyPoints": [
        "Impactful summary of a specific section",
        "Another key takeaway linked to a later section"
    ],
    "sections": [
        {
            "heading": "Section Heading",
            "content": "Rich text content...",
            "imageSearchQuery": "REQUIRED: Minimalist visual description."
        }
    ]
  }
  `;

    try {
        let result;
        try {
            // Try User Requested Model
            result = await model.generateContent(prompt);
        } catch (modelError) {
            console.warn("Primary model failed, attempting fallback to gemini-1.5-flash-latest", modelError);
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            result = await fallbackModel.generateContent(prompt);
        }

        const responseText = result.response.text();

        // Clean up if the model adds markdown
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsedData: Article;
        try {
            parsedData = JSON.parse(cleanedJson);
        } catch (e) {
            console.warn("Standard JSON parse failed, trying JSON5/Repair...");
            try {
                const { default: json5 } = await import('json5');
                parsedData = json5.parse(cleanedJson) as Article;
            } catch (json5Error) {
                console.error("JSON5 Parse Failed as well.");
                console.log("--- FAILING JSON CONTENT ---");
                console.log(cleanedJson);
                console.log("----------------------------");
                throw json5Error;
            }
        }

        // Calculate real reading time
        const fullText = parsedData.sections.map(s => s.content).join(" ");
        const { calculateReadingTime } = await import('@/utils/reading-time');
        parsedData.readingTime = calculateReadingTime(fullText);

        // --- DYNAMIC IMAGE INJECTION ---
        // 1. Cover Image
        // @ts-ignore
        const { getImageForCategory } = await import('./images');
        let coverImage = getImageForCategory('TECH'); // Default backup

        // Check if imageSearchQuery is provided (it might be missing in strict JSON types but present in data)
        const query = (parsedData as any).imageSearchQuery;

        if (query) {
            console.log(`[AI-Service] Searching cover image for: ${query}`);
            const foundCover = await getImage(query);
            if (foundCover) coverImage = foundCover;
        }
        parsedData.imageUrl = coverImage;

        // 2. Section Images
        // We use Promise.all to fetch them in parallel without slowing down too much
        await Promise.all(parsedData.sections.map(async (section) => {
            if (section.imageSearchQuery) {
                console.log(`[AI-Service] Searching section image for: ${section.imageSearchQuery}`);
                const foundSectionImg = await getImage(section.imageSearchQuery);
                if (foundSectionImg) {
                    section.imageUrl = foundSectionImg;
                }
            }
        }));

        console.log("[AI-Service] Generation successful");
        return parsedData;

    } catch (error) {
        console.error("Generation failed:", error);
        // Fallback to offline mock if API fails
        return {
            slug: "error-generating",
            title: `Error Generating: ${topic}`,
            excerpt: "We encountered an issue connecting to the AI service.",
            tags: ["Error"],
            readingTime: "1 min",
            date: new Date().toDateString(),
            // Default Tech Image
            imageUrl: getRandomImage(),
            sections: [
                { heading: "Troubleshooting", content: "Please check your API keys." }
            ]
        } as Article;
    }
}

export async function generateSummary(content: string): Promise<{ text: string, relatedSectionIndex?: number }[]> {
    console.log(`[AI-Service] Generating summary for content length: ${content.length}`);
    const prompt = `
    Role: You are 'BLEXOUT', an elite Gaming Analyst.
    Task: Summarize the provided article content into 5 distinct, punchy 'Protocol Briefings' (key takeaways).
    Tone: Cryptic, tech-elite, futuristic, high-performance.
    Constraint: Max 15 words per point.
    Constraint: Identify which SECTION index (0-based) each point relates to most strongly.
    Format: Return ONLY a valid JSON array of objects. 
    Schema: [{ "text": "Point content...", "relatedSectionIndex": 0 }]

    CONTENT:
    ${content.slice(0, 15000)} // Limit context
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedJson) as { text: string, relatedSectionIndex?: number }[];
    } catch (error) {
        console.error("Summary Generation Error:", error);
        return [
            { text: "Protocol Error: Data Insufficient." },
            { text: "Manual Override Required." },
            { text: "System Offline." },
            { text: "Check Connection." },
            { text: "Retry Synchronization." }
        ];
    }
}
