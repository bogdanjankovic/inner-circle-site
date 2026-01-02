
import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalAnalytics } from '@/lib/metrics';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const stats = await getHistoricalAnalytics(30); // Last 30 days

        // Process into CSV
        const header = ['Date', 'Visitors', 'Total Views', 'Top Country', 'Top Outbound Link'];
        const rows = stats.map(day => [
            day.date,
            day.visitors,
            day.totalViews,
            day.topCountries.length > 0 ? day.topCountries[0].country : '',
            day.topClicks.length > 0 ? day.topClicks[0].url : ''
        ]);

        const csvContent = [
            header.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="protocol-analytics-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error('Export Error:', error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
