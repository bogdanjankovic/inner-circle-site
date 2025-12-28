
import Link from 'next/link';
import { getPaginatedPosts } from '@/lib/storage';
import { getMetrics } from '@/lib/metrics';
import ArchiveButton from '@/components/ArchiveButton';

// Force dynamic rendering so we always see fresh data
export const dynamic = 'force-dynamic';

interface AdminDashboardProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default function AdminDashboard({ searchParams }: AdminDashboardProps) {
    const pageParam = searchParams?.page;
    const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : 1;
    const currentPage = isNaN(page) || page < 1 ? 1 : page;
    const limit = 10;

    const { posts, total, totalPages } = getPaginatedPosts(currentPage, limit);
    const metrics = getMetrics();

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

            <main className="max-w-7xl mx-auto px-8 py-12">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Articles</h3>
                        <p className="text-4xl font-black">{total}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Views</h3>
                        <p className="text-4xl font-black text-purple-600">{totalViews}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <Link
                            href="/admin/create"
                            className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
                        >
                            + Create New
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
