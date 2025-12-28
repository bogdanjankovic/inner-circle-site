"use client";

import { useState } from "react";
import Link from "next/link";
import { Article } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function AdminCreate() {
    const [topic, setTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [draft, setDraft] = useState<Article | null>(null);
    const router = useRouter();

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;
        setIsGenerating(true);

        try {
            console.log("Starting generation for:", topic);
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });
            console.log("Response status:", res.status);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Server Error");
            }

            const data = await res.json();
            console.log("Generation data received:", data);
            setDraft(data);
        } catch (err: any) {
            console.error("Generation Error:", err);
            alert(`Failed to generate: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublish = async () => {
        if (!draft) return;
        try {
            await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'publish', article: draft })
            });
            alert("Published Successfully!");
            router.push('/');
        } catch (err) {
            alert("Failed to publish");
        }
    };

    return (
        <div className="min-h-screen p-8 max-w-4xl mx-auto">
            <Link href="/" className="text-gray-400 hover:text-white mb-8 block">← Back to Home</Link>

            <h1 className="text-3xl font-bold mb-8">Admin Generator Console</h1>

            {!draft ? (
                <div className="glass-panel p-8">
                    <h2 className="text-xl mb-4">New Article Request</h2>
                    <form onSubmit={handleGenerate} className="flex gap-4">
                        <input
                            type="text"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            className="flex-1 bg-black/50 border border-white/20 p-4 rounded text-white"
                            placeholder="Enter topic..."
                        />
                        <button disabled={isGenerating} className="button-primary w-48">
                            {isGenerating ? "Analyzing..." : "Generate Draft"}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-between items-center glass-panel p-4 sticky top-4 z-50 bg-[#0a0a0a]/90 backdrop-blur-md">
                        <h2 className="text-green-400 font-mono">DRAFT PREVIEW MODE</h2>
                        <div className="flex gap-4">
                            <button onClick={() => setDraft(null)} className="px-4 py-2 text-red-400 hover:bg-white/5 rounded">Discard</button>
                            <button onClick={handlePublish} className="button-primary">Publish to Live Site</button>
                        </div>
                    </div>

                    {/* Preview Rendering */}
                    <div className="bg-white text-black p-12 rounded-xl shadow-2xl">
                        <h1 className="text-5xl font-serif font-black mb-4">{draft.title}</h1>
                        <p className="text-xl text-gray-600 mb-8 font-serif italic">{draft.excerpt}</p>

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={draft.imageUrl} className="w-full h-[400px] object-cover rounded-lg mb-8" alt="Draft" />

                        <div className="prose prose-lg max-w-none font-serif">
                            {draft.sections.map((s, i) => (
                                <div key={i} className="mb-8">
                                    <h3 className="text-2xl font-bold mb-2">{s.heading}</h3>
                                    <p className="whitespace-pre-line text-gray-800 leading-relaxed">{s.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
