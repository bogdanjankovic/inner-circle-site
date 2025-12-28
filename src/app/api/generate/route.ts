import { Article } from "@/lib/types";
import { generateArticle } from "@/lib/ai-service";
import { savePost } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { topic, action, article } = body;

        if (action === "publish" && article) {
            savePost(article);
            return NextResponse.json({ success: true, slug: article.slug }); // Assuming slug will be handled in client or generated
        }

        if (topic) {
            const generatedArticle = await generateArticle(topic);
            return NextResponse.json(generatedArticle);
        }

        return NextResponse.json({ error: "Invalid Request" }, { status: 400 });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
