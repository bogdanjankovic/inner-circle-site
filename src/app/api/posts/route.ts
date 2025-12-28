import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/storage";

export async function GET() {
    const posts = getAllPosts();
    return NextResponse.json(posts);
}
