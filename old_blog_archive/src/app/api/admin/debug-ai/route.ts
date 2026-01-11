
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
    let logs = [];
    logs.push("Checking API Key: " + (process.env.GEMINI_API_KEY ? "Present" : "Missing"));

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    // Test 1: gemini-1.5-flash-latest
    try {
        logs.push("Attempting generation with gemini-1.5-flash-latest...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Write one word: Test.");
        logs.push("Success 1.5-flash-latest: " + result.response.text());
    } catch (e: any) {
        logs.push("Failed 1.5-flash-latest: " + e.message);
    }

    // Test 2: gemini-pro
    try {
        logs.push("Attempting generation with gemini-pro...");
        const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result2 = await model2.generateContent("Write one word: Test.");
        logs.push("Success gemini-pro: " + result2.response.text());
    } catch (e: any) {
        logs.push("Failed gemini-pro: " + e.message);
    }

    // Test 3: gemini-1.5-pro-latest
    try {
        logs.push("Attempting generation with gemini-1.5-pro-latest...");
        const model3 = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        const result3 = await model3.generateContent("Write one word: Test.");
        logs.push("Success 1.5-pro-latest: " + result3.response.text());
    } catch (e: any) {
        logs.push("Failed 1.5-pro-latest: " + e.message);
    }

    return NextResponse.json({ logs });
}
