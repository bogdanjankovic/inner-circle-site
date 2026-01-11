import { NextResponse } from 'next/server';
import { getGlossary, saveGlossary } from '@/lib/storage';
import { TermDefinition } from '@/lib/types';

export async function GET() {
    const glossary = await getGlossary();
    return NextResponse.json(glossary);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { term, description, category, action } = body;

        const currentGlossary = await getGlossary();

        if (action === 'delete') {
            const { [term]: _, ...rest } = currentGlossary;
            await saveGlossary(rest);
            return NextResponse.json({ success: true, glossary: rest });
        }

        // Add or Update
        const newGlossary = {
            ...currentGlossary,
            [term]: { term, description, category } as TermDefinition
        };

        await saveGlossary(newGlossary);
        return NextResponse.json({ success: true, glossary: newGlossary });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to update glossary' }, { status: 500 });
    }
}
