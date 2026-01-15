import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({ title, description, image, url }) => {
    const siteTitle = 'Inner Circle Dota 2';
    const finalTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const finalDescription = description || 'Exkluzivni Dota 2 turniri, statistika i analitika za Inner Circle zajednicu.';
    const finalImage = image || 'https://i.imgur.com/your-default-image.png'; // Replace with actual default
    const finalUrl = url || window.location.href;

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            <meta name="viewport" content="width=device-width, initial-scale=1" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={finalUrl} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={finalImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={finalUrl} />
            <meta property="twitter:title" content={finalTitle} />
            <meta property="twitter:description" content={finalDescription} />
            <meta property="twitter:image" content={finalImage} />
        </Helmet>
    );
};

export default SEOHead;
