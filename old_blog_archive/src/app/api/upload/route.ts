import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (filename && request.body) {
        const blob = await put(filename, request.body, {
            access: 'public',
        });

        return NextResponse.json(blob);
    } else {
        // Handle FormData upload if necessary, or keep simplified for blob direct upload
        // For this implementation, we'll robustly handle the existing FormData pattern 
        // to match the previous behavior but using Vercel Blob.

        try {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;

            if (!file) {
                return NextResponse.json(
                    { error: 'No file uploaded' },
                    { status: 400 }
                );
            }

            const blob = await put(file.name, file, {
                access: 'public',
            });

            return NextResponse.json({ url: blob.url });
        } catch (error) {
            console.error('Upload error:', error);
            return NextResponse.json(
                { error: 'Internal server error during upload' },
                { status: 500 }
            );
        }
    }
}
