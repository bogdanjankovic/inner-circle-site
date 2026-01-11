
// This file handles affiliate link logic

// TODO: Replace this with your actual Amazon Associate Tracking ID
export const AMAZON_AFFILIATE_TAG = 'modernpersp-20';

export function getAffiliateUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;

    try {
        const urlObj = new URL(url);

        // Check if it's an Amazon URL
        if (urlObj.hostname.includes('amazon') || urlObj.hostname.includes('amzn')) {
            // Check if tag already exists
            if (urlObj.searchParams.has('tag')) {
                // Determine if we should overwrite? For now, let's strictly enforce OUR tag
                urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
            } else {
                urlObj.searchParams.append('tag', AMAZON_AFFILIATE_TAG);
            }
            const finalUrl = urlObj.toString();
            console.log(`[Affiliate] Transformed: ${url} -> ${finalUrl}`);
            return finalUrl;
        }

        return url;
    } catch (e) {
        // If URL is invalid, return original string
        return url;
    }
}
