import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsInRange } from '@/lib/metrics';

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

        const stats = await getAnalyticsInRange(startDate, endDate);

        // Process into CSV
        const header = ['Date', 'Visitors', 'Total Views', 'Top Countries (Signals)', 'Top Outbound Targets'];
        const rows = stats.map(day => {
            // Format Top 3 as "US (50) | GB (20) | CA (10)"
            const countryStr = day.topCountries.map(c => `${c.country} (${c.count})`).join(' | ');
            // Format Top 3 Clicks as "url (count)"
            const clickStr = day.topClicks.map(c => `${c.url.replace('https://', '')} (${c.count})`).join(' | ');

            return [
                day.date,
                day.visitors,
                day.totalViews,
                countryStr,
                clickStr
            ];
        });

        const csvContent = [
            header.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="protocol-analytics-${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error('Export Error:', error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
