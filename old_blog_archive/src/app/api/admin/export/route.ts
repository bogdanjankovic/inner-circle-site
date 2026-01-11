
import { NextRequest, NextResponse } from 'next/server';
import { getRawAnalyticsInRange } from '@/lib/metrics';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const startParam = searchParams.get('start');
        const endParam = searchParams.get('end');

        let startDate: Date;
        let endDate: Date;

        const today = new Date();

        if (startParam && endParam) {
            startDate = new Date(startParam);
            endDate = new Date(endParam);
        } else {
            // Default: Last 30 Days
            endDate = new Date(today);
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);
        }

        // Fetch RAW DATA (List of events)
        const rawEvents = await getRawAnalyticsInRange(startDate, endDate);

        // Define CSV Headers
        const header = ['Timestamp', 'IP Address', 'Country', 'City', 'Page (Slug)', 'User Agent'];

        // Handle Empty Data
        if (rawEvents.length === 0) {
            const csvContent = header.join(',');
            return new NextResponse(csvContent, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="protocol-raw-log-${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv"`,
                },
            });
        }

        // Map events to rows
        const rows = rawEvents.map(e => [
            e.timestamp,
            e.ip,
            e.country,
            e.city,
            e.slug,
            e.userAgent
        ]);

        // Construct CSV
        const csvContent = [
            header.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="protocol-raw-log-${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error('Export Error:', error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
