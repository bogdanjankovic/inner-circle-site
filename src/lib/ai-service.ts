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

export async function generateArticle(topic: string): Promise<Article> {
    console.log(`[AI-Service] Starting generation for: ${topic}`);
    // 1. Search the web for real context
    const searchContext = await searchWeb(topic);
    console.log(`[AI-Service] Search context found: ${searchContext.length} chars`);

    // 2. Generate content with Gemini
    const prompt = `
  Role: You are 'BLEXOUT', an elite Gaming Hardware Analyst and Tech Industry Insider.
  Tone: Knowledgeable, Opinionated, Spec-Focused, and "No-BS".
  Voice: Use short, punchy sentences. Focus on "Frames per Second," "Thermals," "Price-to-Performance," and "Build Quality."
  Constraint: No fluff. No generic "ROI" talk unless it's about hardware value. No spiritual woo-woo.
  
  Task: Write a comprehensive analysis or guide about "${topic}".
  
  CONTEXT from the web:
  ${searchContext}

  STYLE GUIDE:
  - **Headlines**: Use "The Ultimate Guide to [Topic]" or "[Product] Review: Is it Worth It?".
  - **The Hook**: Start with the problem or the hype (e.g. "Everyone is buying the 4060, but should you?").
  - **Logic**: Use technical terms: Latency, Hz, Switch Type, Ray Tracing, DLSS, TGP.
  - **Products**: RECOMMEND SPECIFIC GEAR. "Best X for Y".
  - **Visuals**: Provide precise, modern, gaming-tech 'imageSearchQuery' (e.g. "RGB mech keyboard macro shot, cyberpunk lighting").
  
  CRITICAL CONSTRAINT: 
  - Do NOT use markdown bolding (**) for product names. Keep them plain text.
  - Link them if possible, but do not bold them.

  CRITICAL REQUIREMENT - THE CONCLUSION:
  You MUST include a "Protocol Summary" section at the end.
  1. "Implementation": Immediate action step.
  2. "The Numbers": Expected quantified result (e.g. "20% more focus").

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
        { "text": "Impactful summary of a specific section", "sectionIndex": 0 },
        { "text": "Another key takeaway linked to a later section", "sectionIndex": 2 }
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
            const foundCover = await searchImages(query);
            if (foundCover) coverImage = foundCover;
        }
        parsedData.imageUrl = coverImage;

        // 2. Section Images
        // We use Promise.all to fetch them in parallel without slowing down too much
        await Promise.all(parsedData.sections.map(async (section) => {
            if (section.imageSearchQuery) {
                console.log(`[AI-Service] Searching section image for: ${section.imageSearchQuery}`);
                const foundSectionImg = await searchImages(section.imageSearchQuery);
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
