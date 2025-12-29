// This file renders the actual article
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPublishedPosts } from '@/lib/storage';
import { getMetrics } from '@/lib/metrics';
import AdUnit from '@/components/AdUnit';
import TextToSpeech from '@/components/TextToSpeech';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { getAffiliateUrl } from '@/lib/affiliate';


interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const article = await getPostBySlug(slug);

    if (!article) {
        return {
            title: 'Article Not Found',
        };
    }

    return {
        title: `${article.title} | The Inner Circle`,
        description: article.excerpt,
        openGraph: {
            title: article.title,
            description: article.excerpt,
            url: `https://inner-circle-site.vercel.app/article/${slug}`,
            siteName: 'The Inner Circle',
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

    // Fetch from storage using the slug
    // Our getPostBySlug logic now checks for exact slug match
    const article = await getPostBySlug(slug);

    // Fetch trending data
    const allPosts = await getPublishedPosts();
    const metrics = await getMetrics();

    const trending = allPosts
        .filter(p => p.slug !== slug) // Optional: exclude current article? Maybe keep it for accurate ranking. Let's keep it.
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
        <div className="min-h-screen pb-32 pt-16 bg-[#F5F2EA] text-[#1A1A1A]">
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
                        datePublished: new Date(article.date).toISOString(), // Assuming date is parseable or just use raw string if needed
                        author: {
                            '@type': 'Person',
                            name: 'The Inner Circle', // Or specific author if available
                        },
                        publisher: {
                            '@type': 'Organization',
                            name: 'The Inner Circle',
                            logo: {
                                '@type': 'ImageObject',
                                url: 'https://inner-circle-site.vercel.app/logo.png', // Update with real logo path
                            },
                        },
                    }),
                }}
            />

            <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-20">

                {/* Main Content Column */}
                <article>
                    {/* Article Header - Spacious & Editorial */}
                    <header className="mb-16 text-center lg:text-left">
                        <div className="flex gap-4 mb-8 justify-center lg:justify-start">
                            {article.tags.map(tag => (
                                <span key={tag} className="px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-[0.2em] border border-charcoal/10 rounded-none text-charcoal/60 hover:text-gold-600 hover:border-gold-500 transition-all">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-serif font-medium mb-8 leading-[1.1] text-charcoal tracking-tight">
                            {article.title}
                        </h1>
                        <p className="text-2xl font-serif italic text-gray-600 mb-10 leading-relaxed max-w-2xl">
                            {article.excerpt}
                        </p>
                        <div className="flex items-center justify-center lg:justify-start gap-4 text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-gold-600 border-t border-b border-gold-500/20 py-4">
                            <span>{article.date}</span>
                            <span className="w-1 h-1 bg-gold-400 rounded-full"></span>
                            <span>{article.readingTime}</span>
                        </div>

                        {/* Audio Narration */}
                        <div className="mt-8 flex justify-center lg:justify-start">
                            <TextToSpeech text={`${article.title}. ${article.excerpt}. ${article.sections.map(s => s.heading + '. ' + s.content).join(' ')}`} />
                        </div>

                        {/* Partnership Disclosure */}
                        <div className="mt-4 text-center lg:text-left">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-sans">
                                Partnership Disclosure: Curated selections may earn commission.
                            </p>
                        </div>
                    </header>

                    {/* Featured Image - Cinematic */}
                    <div className="w-full aspect-[21/9] overflow-hidden mb-20 relative shadow-2xl shadow-[#D4AF37]/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-[20s] hover:scale-110"
                        />
                    </div>

                    {/* Content - High Readability */}
                    <div className="prose prose-xl prose-stone max-w-none font-sans font-light leading-[2.2] text-gray-700">
                        {article.sections.map((section, idx) => (
                            <section key={idx} className="mb-24 last:mb-0">
                                <h2 className="text-4xl font-serif font-medium mb-8 mt-12 text-charcoal italic tracking-wide">
                                    {section.heading}
                                </h2>

                                {/* Section Specific Image (Top for Products) */}
                                {section.imageUrl && (
                                    <figure className="my-12">
                                        <img
                                            src={section.imageUrl}
                                            alt={section.imageSearchQuery || section.heading}
                                            className="w-full shadow-lg object-cover max-h-[600px] grayscale-[10%] hover:grayscale-0 transition-all duration-700"
                                        />
                                        {section.imageSearchQuery && (
                                            <figcaption className="text-center text-xs font-serif italic text-gray-400 mt-4 tracking-widest">
                                                {section.imageSearchQuery}
                                            </figcaption>
                                        )}
                                    </figure>
                                )}

                                {/* Section Content */}
                                <div className="text-lg md:text-xl text-gray-800 leading-loose">
                                    <p>{section.content}</p>
                                </div>

                                {/* Affiliate / Product Button */}
                                {section.productUrl && (
                                    <div className="mt-12 flex justify-center md:justify-start">
                                        <a
                                            href={getAffiliateUrl(section.productUrl)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative inline-flex items-center gap-4 px-12 py-5 bg-charcoal text-white font-serif italic text-xl shadow-2xl hover:bg-gold-600 transition-all duration-500 overflow-hidden"
                                        >
                                            <span className="relative z-10">{section.buttonText || 'Claim your energetic match'}</span>
                                            <span className="text-sm not-italic opacity-50 relative z-10 group-hover:translate-x-2 transition-transform">→</span>
                                        </a>
                                    </div>
                                )}


                                {/* Ad Injection - Styled Minimal */}
                                {(idx === 1 || idx === 4) && (
                                    <div className="my-16 flex justify-center opaicty-50 hover:opacity-100 transition-opacity">
                                        <span className="text-[8px] uppercase tracking-widest text-gray-300 absolute -mt-4">Sponsored Alignment</span>
                                        <AdUnit slotId={`content-ad-${idx}`} format="banner" />
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </article>

                {/* Sidebar Column - "The Curated Rail" */}
                <aside className="hidden lg:block space-y-16 border-l border-[#D4AF37]/20 pl-12 h-fit sticky top-32">
                    {/* Sidebar Ad 1 */}
                    <div className="bg-white/50 p-8 border border-[#D4AF37]/10 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-serif italic text-lg text-charcoal">Curated Pick</h3>
                            <span className="w-1 h-1 bg-gold-500 rounded-full"></span>
                        </div>
                        <div className="flex justify-center grayscale hover:grayscale-0 transition-all">
                            <AdUnit slotId="sidebar-1" format="rectangle" />
                        </div>
                    </div>

                    {/* Trending Widget */}
                    <div className="">
                        <h3 className="font-sans font-bold text-xs uppercase tracking-[0.3em] mb-8 border-b border-gray-200 pb-4 text-gray-400">
                            Trending Frequencies
                        </h3>
                        <ul className="space-y-8">
                            {trending.map((post, i) => (
                                <Link key={post.slug} href={`/article/${post.slug}`}>
                                    <li className="group cursor-pointer flex gap-6 items-baseline">
                                        <span className="text-3xl font-serif italic text-gold-200 group-hover:text-gold-500 transition-colors">0{i + 1}</span>
                                        <div>
                                            <h4 className="font-serif text-xl text-charcoal group-hover:text-gold-600 transition-colors leading-tight line-clamp-2">
                                                {post.title}
                                            </h4>
                                            <span className="text-[10px] font-sans font-bold text-gray-300 uppercase mt-2 block tracking-widest">Read Now</span>
                                        </div>
                                    </li>
                                </Link>
                            ))}
                        </ul>
                    </div>
                </aside>

            </div>
        </div>
    );
}
