import Link from 'next/link';
import { getPaginatedPosts } from '@/lib/storage';
import { getMetrics, getDailyAnalytics } from '@/lib/metrics';
import ArchiveButton from '@/components/ArchiveButton';
import CreateManualButton from '@/components/CreateManualButton';

// Force dynamic rendering so we always see fresh data
export const dynamic = 'force-dynamic';

interface AdminDashboardProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
    const pageParam = searchParams?.page;
    const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : 1;
    const currentPage = isNaN(page) || page < 1 ? 1 : page;
    const limit = 10;

    const { posts, total, totalPages } = await getPaginatedPosts(currentPage, limit);
    const metrics = await getMetrics();
    const dailyStats = await getDailyAnalytics();

    const totalViews = Object.values(metrics).reduce((sum, m) => sum + m.views, 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                    Admin Dashboard
                </h1>
                <div className="flex gap-4">
                    <Link
                        href="/"
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        View Site
                    </Link>
                    <button className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">

                {/* Protocol Intelligence - Live Date */}
                <div className="mb-12">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Protocol Intelligence :: {dailyStats.date}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1: Daily Traffic */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                                </svg>
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Daily Signals</h3>
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{dailyStats.totalViews}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Page Views</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-purple-500">{dailyStats.visitors}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Unique Nodes</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Geo Distribution */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Top Regions</h3>
                            <div className="space-y-3">
                                {dailyStats.topCountries.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No signal data available.</p>
                                ) : (
                                    dailyStats.topCountries.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-gray-400">0{i + 1}</span>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{c.country}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500" style={{ width: `${Math.min((c.count / dailyStats.visitors) * 100, 100)}%` }}></div>
                                                </div>
                                                <span className="text-xs font-mono text-gray-500">{c.count}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Card 3: Outbound Clicks */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Top Targets (Outbound)</h3>
                            <div className="space-y-3">
                                {dailyStats.topClicks.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No outbound activity.</p>
                                ) : (
                                    dailyStats.topClicks.map((c, i) => (
                                        <div key={i} className="group flex flex-col gap-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]">{c.url.replace('https://', '')}</span>
                                                <span className="text-xs font-bold text-green-500">{c.count}</span>
                                            </div>
                                            <div className="w-full h-0.5 bg-gray-100 dark:bg-gray-700">
                                                <div className="h-full bg-green-500" style={{ width: `${Math.min(c.count * 10, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Lifetime Articles</h3>
                        <p className="text-4xl font-black">{total}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Lifetime Views</h3>
                        <p className="text-4xl font-black text-purple-600">{totalViews}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-4">
                        <Link
                            href="/admin/create"
                            className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg w-full text-center"
                        >
                            + Generate with AI
                        </Link>
                        <CreateManualButton />
                        <Link
                            href="/admin/glossary"
                            className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors shadow-sm w-full text-center"
                        >
                            Manage Glossary
                        </Link>
                    </div>
                </div>

                {/* Content Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="font-bold text-lg">Published Articles</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase tracking-wider text-xs font-medium">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Views</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {posts.map(post => {
                                    const postMetrics = metrics[post.slug || ''] || { views: 0 };
                                    const isArchived = post.isArchived;

                                    return (
                                        <tr key={post.slug} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isArchived ? 'opacity-50 grayscale' : ''}`}>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                <Link href={`/article/${post.slug}`} className="hover:text-purple-500">
                                                    {post.title}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${isArchived ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                                    {isArchived ? 'Archived' : 'Published'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-purple-600">{postMetrics.views}</td>
                                            <td className="px-6 py-4 text-right space-x-4">
                                                <Link href={`/admin/edit/${post.slug}`} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wide">Edit</Link>
                                                <Link href={`/article/${post.slug}`} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">View</Link>
                                                <ArchiveButton slug={post.slug || ''} isArchived={isArchived} />
                                            </td>
                                        </tr>
                                    );
                                })}
                                {posts.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                            No articles found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <span className="text-sm text-gray-500">
                                Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                {currentPage > 1 && (
                                    <Link
                                        href={`/admin?page=${currentPage - 1}`}
                                        className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Previous
                                    </Link>
                                )}
                                {currentPage < totalPages && (
                                    <Link
                                        href={`/admin?page=${currentPage + 1}`}
                                        className="px-4 py-2 text-sm font-medium bg-black text-white dark:bg-white dark:text-black rounded-md hover:opacity-80 transition-colors"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
