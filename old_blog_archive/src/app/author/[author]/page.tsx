import { getPublishedPosts } from "@/lib/storage";
import Link from "next/link";
import RevealImage from "@/components/RevealImage";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ author: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { author } = await params;
    const decodedAuthor = decodeURIComponent(author);

    return {
        title: `${decodedAuthor} - Author Protocol | BLEXOUT`,
        description: `Access all protocols filed by ${decodedAuthor}.`,
    };
}

export default async function AuthorPage(props: PageProps) {
    const params = await props.params;
    const authorName = decodeURIComponent(params.author);
    const allPosts = await getPublishedPosts();

    // Filter posts by author (case-insensitive)
    const authorPosts = allPosts.filter(post =>
        (post.author || 'Protocol Officer').toLowerCase() === authorName.toLowerCase()
    );

    if (authorPosts.length === 0) {
        return (
            <div className="min-h-screen pt-32 pb-20 bg-black text-gray-200 flex flex-col items-center justify-center">
                <h1 className="text-4xl font-mono font-bold text-white mb-4">UNK_AUTHOR</h1>
                <p className="font-mono text-gray-500">No records found for operative: {authorName}</p>
                <Link href="/" className="mt-8 text-green-500 hover:underline font-mono uppercase tracking-widest text-xs">Return to Grid</Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen pt-32 pb-20 bg-black text-gray-200">
            <div className="max-w-6xl mx-auto px-6">
                <header className="mb-20 border-b border-white/10 pb-10">
                    <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest mb-4 block">Operative File</span>
                    <h1 className="text-5xl md:text-7xl font-mono font-bold text-white tracking-tighter mb-6">{authorName}</h1>
                    <div className="flex gap-8 text-xs font-mono uppercase tracking-widest text-gray-500">
                        <span>Protocols: {authorPosts.length}</span>
                        <span>Clearance: MAX</span>
                    </div>
                </header>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                    {authorPosts.map((post, idx) => (
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
            </div>
        </main>
    );
}
