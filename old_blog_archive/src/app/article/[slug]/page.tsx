import { ArticleStateProvider } from '@/context/ArticleStateContext';
import Link from 'next/link';
import { Metadata } from 'next';
import { Tweet } from 'react-tweet';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPublishedPosts, getGlossary } from '@/lib/storage'; // Re-added getGlossary
import { getMetrics } from '@/lib/metrics';
import AdUnit from '@/components/AdUnit';
import TextToSpeech from '@/components/TextToSpeech';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { getAffiliateUrl } from '@/lib/affiliate';
import ProtocolBrief from '@/components/ProtocolBrief';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import RevealImage from '@/components/RevealImage';
import ArticleActions from '@/components/ArticleActions';
import SmartContent from '@/components/SmartContent';
import SyncCompletion from '@/components/SyncCompletion';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const article = await getPostBySlug(slug);

    if (!article) {
        return {
            title: 'BLEXOUT Not Found',
        };
    }

    return {
        title: `${article.title} | BLEXOUT`,
        description: article.excerpt,
        openGraph: {
            title: article.title,
            description: article.excerpt,
            url: `https://blexout.com/article/${slug}`,
            siteName: 'BLEXOUT',
            images: [
                {
                    url: article.imageUrl,
                    width: 1200,
                    height: 630,
                    alt: article.title,
                },
            ],
            locale: 'en_US',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: article.excerpt,
            images: [article.imageUrl],
        },
    };
}

export default async function ArticlePage(props: PageProps) {
    const params = await props.params;
    const slug = params.slug;

    // Parallel fetch post, glossary, and other data
    const [article, glossary] = await Promise.all([
        getPostBySlug(slug),
        getGlossary()
    ]);

    // Fetch trending data separate to catch errors gracefully if needed, or included above
    const allPosts = await getPublishedPosts();
    const metrics = await getMetrics();

    const trending = allPosts
        .filter(p => p.slug !== slug)
        .map(post => ({
            ...post,
            views: metrics[post.slug]?.views || 0
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 4);

    if (!article || article.isArchived) {
        return notFound();
    }

    return (
        <ArticleStateProvider>
            <div className="min-h-screen pb-32 pt-20 bg-black text-gray-200 font-sans selection:bg-green-500 selection:text-black">
                <ReadingProgressBar />
                <AnalyticsTracker slug={slug} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Article',
                            headline: article.title,
                            description: article.excerpt,
                            image: article.imageUrl,
                            datePublished: new Date(article.date).toISOString(),
                            author: {
                                '@type': 'Person',
                                name: article.author || 'BLEXOUT',
                            },
                            publisher: {
                                '@type': 'Organization',
                                name: 'BLEXOUT',
                                logo: {
                                    '@type': 'ImageObject',
                                    url: 'https://blexout.com/logo.png',
                                },
                            },
                        }),
                    }}
                />

                <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-20">

                    {/* Main Content Column */}
                    <article>
                        {/* Article Header - Tech / Editorial */}
                        {/* Article Header - Tech / Editorial */}
                        <header className="mb-10 text-center lg:text-left">
                            <div className="flex gap-4 mb-6 justify-center lg:justify-start">
                                {(article.tags || []).map(tag => (
                                    <span key={tag} className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest border border-green-500/20 text-green-500 bg-green-500/5 hover:bg-green-500/10 transition-all">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-3xl md:text-6xl font-mono font-bold mb-6 leading-tight text-white tracking-tighter">
                                {article.title}
                            </h1>
                            <p className="text-xl font-mono text-gray-400 mb-8 leading-relaxed max-w-2xl border-l border-green-500/50 pl-6">
                                {article.excerpt}
                            </p>
                            <div className="flex items-center justify-center lg:justify-start gap-4 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500 border-t border-b border-white/10 py-4">
                                <span>{article.date || 'TBD'}</span>
                                <span className="text-green-900">//</span>
                                <span className="text-gray-300">{article.author || 'Protocol Officer'}</span>
                                <span className="text-green-900">//</span>
                                <span>{article.readingTime || '5 MIN READ'}</span>
                            </div>

                            {/* Actions (Audio + Watch) */}
                            <ArticleActions article={article} />

                            {/* Partnership Disclosure */}
                            {article.showAffiliateDisclosure && (
                                <div className="mt-4 text-center lg:text-left">
                                    <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono">
                                        System Disclosure: Affiliate links active.
                                    </p>
                                </div>
                            )}
                        </header>

                        {/* Featured Image - Cinematic */}
                        <div className="w-full aspect-[21/9] overflow-hidden mb-12 relative border border-white/10 bg-white/5">
                            <RevealImage
                                src={article.imageUrl}
                                alt={article.title}
                            />
                        </div>

                        {/* Content - High Readability */}
                        <div className="prose prose-xl prose-invert max-w-none font-sans font-light leading-loose text-gray-300">
                            {article.sections
                                .filter(section => section.heading !== 'Protocol Summary') // Hide legacy summaries
                                .map((section, idx) => (
                                    <section key={idx} id={section.id || `section-${idx}`} className="mb-16 last:mb-0 scroll-mt-32">
                                        <h2 className="text-3xl font-mono font-bold mb-6 mt-8 text-white tracking-tight border-b border-white/10 pb-4 inline-block">
                                            {section.heading}
                                        </h2>

                                        {/* Section Media (Image / YouTube / Tweet) */}
                                        {/* Priority: YouTube > Tweet > Image */}

                                        {section.youtubeUrl && section.youtubeUrl.includes('v=') ? (
                                            <figure className="my-8 border border-white/10 bg-white/5 p-1 rounded-sm">
                                                <div className="aspect-video w-full bg-black">
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${section.youtubeUrl.split('v=')[1]?.split('&')[0]}`}
                                                        title={section.heading}
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            </figure>
                                        ) : section.tweetUrl ? (
                                            <figure className="my-8 flex justify-center">
                                                <div className="w-full max-w-2xl dark not-prose">
                                                    <Tweet id={section.tweetUrl.split('/').pop() || ''} />
                                                </div>
                                            </figure>
                                        ) : section.imageUrl ? (
                                            <figure className="my-8 border border-white/10 bg-white/5 p-1 rounded-sm">
                                                <div className="h-[500px] w-full">
                                                    <RevealImage
                                                        src={section.imageUrl}
                                                        alt={section.imageSearchQuery || section.heading}
                                                    />
                                                </div>
                                                {section.imageSearchQuery && (
                                                    <figcaption className="text-center text-[10px] font-mono text-gray-500 mt-2 tracking-widest uppercase">
                                                        :: {section.imageSearchQuery}
                                                    </figcaption>
                                                )}
                                            </figure>
                                        ) : section.tableData && section.tableData.length > 0 ? (
                                            <figure className="my-8 overflow-x-auto border border-white/10 rounded-lg">
                                                <table className="w-full text-left border-collapse text-sm font-mono">
                                                    <thead>
                                                        <tr className="bg-white/5 border-b border-white/10">
                                                            {section.tableData[0].map((header, hIdx) => (
                                                                <th key={hIdx} className="p-4 font-bold text-gray-300 uppercase tracking-wider border-r border-white/10 last:border-r-0 whitespace-nowrap">
                                                                    {header}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {section.tableData.slice(1).map((row, rIdx) => (
                                                            <tr key={rIdx} className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors">
                                                                {row.map((cell, cIdx) => (
                                                                    <td key={cIdx} className="p-4 text-gray-400 border-r border-white/5 last:border-r-0">
                                                                        {cell}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </figure>
                                        ) : null}

                                        {/* Section Content */}
                                        <div className="text-lg md:text-xl text-gray-300 leading-relaxed font-sans">
                                            <SmartContent content={section.content} glossary={glossary} />
                                        </div>

                                        {/* Affiliate / Product Button */}
                                        {section.productUrl && (
                                            <div className="mt-8 flex justify-center md:justify-start">
                                                <a
                                                    href={getAffiliateUrl(section.productUrl)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative inline-flex items-center gap-4 px-8 py-4 bg-white text-black font-mono font-bold text-sm hover:bg-green-500 hover:text-black transition-all duration-300"
                                                >
                                                    <span className="relative z-10 tracking-widest uppercase">{section.buttonText || 'Acquire Hardware'}</span>
                                                    <span className="text-sm border-l border-black/20 pl-4 relative z-10 group-hover:translate-x-1 transition-transform">→</span>
                                                </a>
                                            </div>
                                        )}


                                        {/* Ad Injection - Styled Minimal */}
                                        {(idx === 1 || idx === 4) && (
                                            <div className="my-10 flex justify-center opacity-50 hover:opacity-100 transition-opacity border border-white/5 p-4 bg-white/5">
                                                <span className="text-[8px] uppercase tracking-widest text-gray-500 absolute -mt-7 bg-black px-2">Sponsored Protocol</span>
                                                <AdUnit slotId={`content-ad-${idx}`} format="banner" />
                                            </div>
                                        )}
                                    </section>
                                ))}
                        </div>

                        {/* Scroll To Top Button */}
                        <div className="mt-20 border-t border-white/10 pt-10 flex justify-center">
                            <ScrollToTopButton />
                        </div>
                    </article>

                    {/* Sidebar Column - "System Status" */}
                    {/* Sidebar Column - "System Status" */}
                    {/* Sidebar Column - "System Status" - Fixed & Centered */}
                    <aside className="hidden lg:flex flex-col justify-center gap-10 border-l border-white/10 pl-12 sticky top-0 h-screen overflow-y-auto no-scrollbar py-20">

                        {/* Sidebar Ad 1 */}
                        <div className="bg-white/5 p-6 border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-mono font-bold text-xs text-white uppercase tracking-widest">Sponsored</h3>
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            </div>
                            <div className="flex justify-center grayscale hover:grayscale-0 transition-all">
                                <AdUnit slotId="sidebar-1" format="rectangle" />
                            </div>
                        </div>

                        {/* Protocol Brief - Sidebar Accordion (Unlocked on Scroll) */}
                        <div className="mb-6 relative">
                            <ProtocolBrief keyPoints={article.keyPoints || []} />
                        </div>

                        {/* Trending Widget */}
                        <div className="">
                            <h3 className="font-mono font-bold text-xs uppercase tracking-[0.2em] mb-8 border-b border-white/10 pb-4 text-gray-500">
                                High Traffic
                            </h3>
                            <ul className="space-y-6">
                                {trending.map((post, i) => (
                                    <Link key={post.slug} href={`/article/${post.slug}`}>
                                        <li className="group cursor-pointer flex gap-4 items-start">
                                            <span className="text-xl font-mono font-bold text-gray-700 group-hover:text-green-500 transition-colors">0{i + 1}</span>
                                            <div>
                                                <h4 className="font-mono text-sm font-bold text-gray-300 group-hover:text-white transition-colors leading-tight line-clamp-2 mb-1">
                                                    {post.title}
                                                </h4>
                                                <span className="text-[9px] font-mono font-medium text-green-900 group-hover:text-green-500 uppercase block tracking-widest transition-colors">:: Access Protocol</span>
                                            </div>
                                        </li>
                                    </Link>
                                ))}
                            </ul>
                        </div>
                    </aside>

                </div>
                <SyncCompletion />
            </div>
        </ArticleStateProvider>
    );
}
