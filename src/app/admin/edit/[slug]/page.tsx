
import { getPostBySlug } from '@/lib/storage';
import { notFound, redirect } from 'next/navigation';
import ArticleEditor from '@/components/ArticleEditor';
import Link from 'next/link';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function EditPage(props: PageProps) {
    const params = await props.params;
    const post = await getPostBySlug(params.slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="text-gray-500 hover:text-gray-900 font-medium">
                        &larr; Back to Dashboard
                    </Link>
                    <span className="text-gray-300">|</span>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        Editor
                    </h1>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-8 py-12">
                <ArticleEditor article={post} />
            </main>
        </div>
    );
}
