import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://inner-circle-site.vercel.app'; // Fallback to assumed default

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/admin/',
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
