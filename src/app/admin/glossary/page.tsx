import { getGlossary } from '@/lib/storage';
import GlossaryManager from '@/components/GlossaryManager';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function GlossaryAdminPage() {
    // Server-side fetch for initial render speed
    const glossary = await getGlossary();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans pb-20">
            {/* Nav */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex items-center gap-4 shadow-sm mb-8">
                <Link href="/admin" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    ← Dashboard
                </Link>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                <h1 className="text-lg font-bold">Glossary Management</h1>
            </nav>

            <main className="px-4 md:px-8">
                <GlossaryManager initialGlossary={glossary} />
            </main>
        </div>
    );
}
