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
  Role: You are 'PROTOCOL', a high-performance optimization expert and biohacking analyst.
  Tone: Clinical, precise, authoritative, and data-driven. Minimalist and direct.
  Voice: Use short, punchy sentences. Focus on "ROI," "Efficiency," "Baseline," and "Optimization."
  Constraint: No fluff. No spiritual woo-woo. No emoji overuse.
  
  Task: Write a comprehensive optimization guide about "${topic}".
  
  CONTEXT from the web:
  ${searchContext}

  STYLE GUIDE:
  - **Headlines**: Use "The [Topic] Protocol" or "How to Optimize [Topic]".
  - **The Hook**: Start with the inefficiency or pain point (e.g. "Most desks destroy focus.").
  - **Logic**: Use scientific terms: Circadian Rhythm, Cognitive Load, Ergonomics, Compound Effect.
  - **Products**: Recommend tools as implementation steps ("Acquire X to solve Y").
  - **Visuals**: Provide precise, modern, tech-focused 'imageSearchQuery' (e.g. "matte black mechanical keyboard workspace, overhead shot, 8k").
  
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
