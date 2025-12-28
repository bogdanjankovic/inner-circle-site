import Link from "next/link";
import { getPublishedPosts } from "@/lib/storage";
import AdUnit from '@/components/AdUnit';
import NewsletterForm from '@/components/NewsletterForm';

export const dynamic = 'force-dynamic'; // Force dynamic rendering to ensure fresh data

export default async function Home() {
    const posts = await getPublishedPosts();

    // Featured Post (First one)
    const featured = posts[0];
    const gridPosts = posts.slice(1);

    return (
        <main className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden pb-20">

            {/* Header */}
            {/* Padding for global navbar is handled in layout, but we might want some top spacing */}
            <div className="h-8"></div>

            {featured ? (
                <section className="w-full max-w-6xl mb-24 px-6 md:px-0">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="relative group overflow-hidden rounded-2xl shadow-2xl shadow-purple-900/20 aspect-[16/10] border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={featured.imageUrl}
                                alt={featured.title}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        <div className="flex flex-col gap-6 justify-center">
                            <div className="flex gap-4">
                                {featured.tags.map(t => (
                                    <span key={t} className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-[10px] font-bold uppercase tracking-widest">{t}</span>
                                ))}
                            </div>
                            <Link href={`/article/${featured.slug}`} className="group">
                                <h2 className="text-5xl md:text-6xl font-serif font-black leading-[1.1] group-hover:text-purple-200 transition-colors">
                                    {featured.title}
                                </h2>
                            </Link>
                            <p className="text-gray-400 text-lg line-clamp-3 font-serif leading-relaxed border-l-2 border-purple-500/50 pl-6">
                                {featured.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-widest pt-4">
                                <span>{featured.date}</span>
                                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                                <span>{featured.readingTime}</span>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <div className="text-center py-32">
                    <h2 className="text-3xl font-serif text-gray-500 mb-4">No stories yet.</h2>
                    <p className="text-gray-600">Head to the <Link href="/admin/create" className="text-purple-400 border-b border-purple-400/30 hover:border-purple-400">Admin Console</Link> to publish your first piece.</p>
                </div>
            )}

            {/* Divider */}
            <div className="w-full max-w-6xl mb-20 divider-gradient"></div>

            {/* Section Header */}
            <div className="w-full max-w-6xl flex items-center justify-between mb-12 px-6 md:px-0">
                <h3 className="text-3xl font-serif italic text-white">Curated Vibrations</h3>
                <span className="text-[10px] font-sans text-gray-500 uppercase tracking-[0.3em]">Season of Capricorn</span>
            </div>

            {/* Grid Layout */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 w-full max-w-6xl px-6 md:px-0">
                {gridPosts.map((post, idx) => (
                    <Link key={idx} href={`/article/${post.slug}`} className="group flex flex-col gap-6">
                        <div className="overflow-hidden rounded-xl aspect-[3/2] relative bg-white/5 border border-white/10 shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3 mb-1">
                                {post.tags.slice(0, 1).map(t => (
                                    <span key={t} className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">{t}</span>
                                ))}
                                <span className="text-[10px] text-gray-600 uppercase tracking-widest">• {post.date}</span>
                            </div>
                            <h3 className="text-2xl font-serif font-bold leading-tight group-hover:text-purple-300 transition-colors">
                                {post.title}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                {post.excerpt}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Footer / Legal */}

        </main>
    );
}
