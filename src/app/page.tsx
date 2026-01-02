import Link from "next/link";
import { getPublishedPosts } from "@/lib/storage";
import RevealImage from "@/components/RevealImage";

export const dynamic = 'force-dynamic';

export default async function Home() {
    const posts = await getPublishedPosts();

    // Featured Post (First one)
    const featured = posts[0];
    const gridPosts = posts.slice(1);

    return (
        <main className="min-h-screen flex flex-col items-center p-4 relative overflow-hidden pb-20 text-gray-200">

            <div className="h-12"></div>

            {featured ? (
                <section className="w-full max-w-6xl mb-24 px-6 md:px-0">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="relative group overflow-hidden rounded-sm border border-white/10 aspect-[16/10]">
                            <RevealImage
                                src={featured.imageUrl}
                                alt={featured.title}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                        </div>
                        <div className="flex flex-col gap-6 justify-center">
                            <div className="flex gap-4">
                                {(featured.tags || []).slice(0, 3).map(t => (
                                    <span key={t} className="px-2 py-1 bg-white/5 border border-white/10 text-green-500 text-[10px] font-mono font-bold uppercase tracking-widest">{t}</span>
                                ))}
                            </div>
                            <Link href={`/article/${featured.slug}`} className="group">
                                <h2 className="text-4xl md:text-5xl font-mono font-bold leading-tight group-hover:text-green-400 transition-colors tracking-tighter text-white">
                                    {featured.title}
                                </h2>
                            </Link>
                            <p className="text-gray-400 text-sm font-mono leading-relaxed border-l border-green-500/50 pl-6">
                                {featured.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono uppercase tracking-widest pt-4">
                                <span>{featured.date}</span>
                                <span className="text-green-900">/</span>
                                <span>{featured.readingTime}</span>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <div className="text-center py-32 border border-dashed border-white/10 rounded-lg p-12 max-w-2xl">
                    <h2 className="text-2xl font-mono text-gray-500 mb-4">System Empty.</h2>
                    <p className="text-gray-600 font-mono text-sm">Initialize first protocol in <Link href="/admin/create" className="text-green-400 hover:underline">Admin Console</Link>.</p>
                </div>
            )}

            <div className="w-full max-w-6xl mb-20 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {/* Section Header */}
            <div className="w-full max-w-6xl flex items-center justify-between mb-12 px-6 md:px-0">
                <h3 className="text-xl font-mono font-bold text-white tracking-tighter">Latest Protocols</h3>
                <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    System Online
                </span>
            </div>

            {/* Grid Layout */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 w-full max-w-6xl px-6 md:px-0">
                {gridPosts.map((post, idx) => (
                    <Link key={idx} href={`/article/${post.slug}`} className="group flex flex-col gap-6">
                        <div className="overflow-hidden rounded-sm aspect-[3/2] relative bg-white/5 border border-white/10 group-hover:border-green-500/50 transition-colors">
                            <RevealImage
                                src={post.imageUrl}
                                alt={post.title}
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3 mb-1">
                                {(post.tags || []).slice(0, 1).map(t => (
                                    <span key={t} className="text-green-500 text-[10px] font-mono font-bold uppercase tracking-widest">{t}</span>
                                ))}
                                <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">:: {post.date}</span>
                            </div>
                            <h3 className="text-xl font-mono font-bold leading-tight text-gray-200 group-hover:text-white transition-colors tracking-tight">
                                {post.title}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono line-clamp-3 leading-relaxed">
                                {post.excerpt}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

        </main>
    );
}
